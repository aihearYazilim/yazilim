/**
 * Klinik muayene akışı: testler → tanı önerisi/onayı → tedavi + tekrar test → ev reçetesi → rapor.
 */
import QRCode from 'qrcode';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import type { Calibration } from '../../../core/calibration';
import { type Finding, type Findings, keyLabel, rxFindingLock, suggestDiagnosis } from '../../../core/diagnosis';
import { decodePrescription, encodePrescription, type Prescription } from '../../../core/prescription';
import { decodeHomeReport } from '../../../core/reportShare';
import {
  type Canal,
  type FindingKey,
  maneuversFor,
  PROTOCOLS,
  type ProtocolId,
  type Side,
  sideName
} from '../../../core/protocols';
import { vertigoSummary } from '../../../core/runner';
import { formatDateTime } from '../../../state/episodes';
import { localDayKey } from '../../../core/safety';
import { store, uid, useData } from '../../../state/store';
import type { ClinicExam, ConfirmedDiagnosis, ManeuverLog } from '../../../state/types';
import { Choice, Segmented } from '../../components/Controls';
import { Icon } from '../../components/Icon';
import { Screen } from '../../components/Screen';
import { Calibrate } from '../Calibrate';
import { RunnerView, type RunnerOutcome } from '../RunnerView';
import {
  defaultObservationMethod,
  dxText,
  dxValid,
  examNoteText,
  findingsKeyOf,
  findingSummary,
  manualDxLabel,
  maneuverStatus,
  methodsOf,
  primaryMethod,
  rxBlockReason,
  rxCode,
  rxCurrent,
  rxValidityText,
  stepLines
} from './examReport';
import { emptyFinding, FindingForm } from './FindingForm';
import { HomeReportView } from './HomeReportView';

type Tab = 'tests' | 'dx' | 'treat' | 'rx' | 'report';
type RunPurpose = 'test' | 'retest' | 'maneuver';
interface RunReq {
  protocolId: ProtocolId;
  side: Side | null;
  purpose: RunPurpose;
  /** Her çalıştırmaya özgü sabit numara (yeniden çizimlerde ekran baştan başlamasın). */
  nonce?: number;
}

let runCounter = 0;

const TESTS: { id: string; label: string; protocolId: ProtocolId; side: Side | null; keys: FindingKey[] }[] = [
  { id: 'dhR', label: 'Sağ Dix-Hallpike', protocolId: 'dix-hallpike', side: 'R', keys: ['dhR'] },
  { id: 'dhL', label: 'Sol Dix-Hallpike', protocolId: 'dix-hallpike', side: 'L', keys: ['dhL'] },
  { id: 'roll', label: 'Sırtüstü baş çevirme (supine roll)', protocolId: 'supine-roll', side: null, keys: ['rollCenter', 'rollR', 'rollL'] }
];

function updateExam(id: string, fn: (e: ClinicExam) => ClinicExam) {
  store.update((d) => ({ ...d, clinicExams: d.clinicExams.map((e) => (e.id === id ? fn(e) : e)) }));
}

/**
 * Tam ekran alt durumlar (kalibrasyon, bulgu formu) açıkken sistem geri tuşu / kenardan kaydırma muayeneden çıkarmasın:
 * geçmişe bir girdi eklenir; geri gelince `onBack` çağrılır (yoksa yerinde kalınır). RunnerView ile aynı desen.
 */
function useBackGuard(active: boolean, onBack?: () => void) {
  const ref = useRef(onBack);
  ref.current = onBack;
  useEffect(() => {
    if (!active) return;
    const marker = { dengeyolExam: true };
    window.history.pushState(marker, '');
    const onPop = () => {
      if (ref.current) ref.current();
      else window.history.pushState(marker, '');
    };
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      // Kendi girdimiz hâlâ en üstteyse temizle (adres değişmez).
      if ((window.history.state as { dengeyolExam?: boolean } | null)?.dengeyolExam) window.history.back();
    };
  }, [active]);
}

export function Exam() {
  const { id } = useParams();
  const d = useData();
  const exam = d.clinicExams.find((e) => e.id === id);
  const patient = exam ? d.clinicPatients.find((p) => p.id === exam.patientId) : undefined;
  // Ev raporu içe aktarıldıktan sonra muayene Rapor sekmesinde açılır (ReportImport → state.tab).
  const initialTab = (useLocation().state as { tab?: Tab } | null)?.tab;
  const [tab, setTab] = useState<Tab>(initialTab ?? 'tests');
  const [cal, setCal] = useState<Calibration | null>(null);
  const [sensorless, setSensorless] = useState(!!d.clinician.sensorless);
  const [pendingRun, setPendingRun] = useState<RunReq | null>(null);
  const [run, setRun] = useState<RunReq | null>(null);
  const [needCal, setNeedCal] = useState(false);
  const [editQueue, setEditQueue] = useState<{ key: FindingKey; initial: Finding & { nystagmusUnset?: boolean }; target: 'findings' | 'retestFindings' }[]>([]);
  const [manualEdit, setManualEdit] = useState<FindingKey | null>(null);
  const cancelCal = () => {
    setNeedCal(false);
    setPendingRun(null);
    setTab('tests');
  };
  // Kalibrasyonda geri tuşu muayeneden çıkarmaz, Testler sekmesine döner.
  useBackGuard(needCal && !run, cancelCal);
  // Test sonrası bulgu formu: geri tuşu kaydedilmemiş bulguyu kaybettirmesin (yerinde kalınır).
  useBackGuard(editQueue.length > 0 && !run && !needCal);
  useBackGuard(manualEdit !== null && editQueue.length === 0 && !run && !needCal, () => setManualEdit(null));

  if (!exam) {
    return (
      <Screen title="Muayene" back="/odyolog">
        <p>Muayene bulunamadı.</p>
      </Screen>
    );
  }

  const startRun = (r0: RunReq) => {
    const r = { ...r0, nonce: ++runCounter };
    if (!cal && !sensorless) {
      setPendingRun(r);
      setNeedCal(true);
      return;
    }
    setRun(r);
  };

  const onRunExit = (o: RunnerOutcome, r: RunReq) => {
    setRun(null);
    // Başlatılmadan kapatıldı: yapılmamış manevra/test kaydedilmez.
    if (o.started === false) return;
    if (r.purpose === 'maneuver') {
      const log: ManeuverLog = {
        id: uid(),
        at: Date.now(),
        protocolId: r.protocolId,
        side: r.side,
        completed: o.phase === 'done',
        stopReason: o.state.stopReason,
        records: o.state.records,
        manual: o.manual || o.state.records.some((x) => x.manual)
      };
      updateExam(exam.id, (e) => ({ ...e, maneuvers: [...e.maneuvers, log] }));
      return;
    }
    if (o.phase === 'aborted' && o.state.records.length === 0) return;
    // Bulgu adımlarını düzenleme kuyruğuna al
    const queue = o.protocol.steps
      .map((st, i) => ({ st, rec: o.state.records[i] }))
      .filter((x) => x.st.finding && x.rec)
      .map(({ st, rec }) => {
        const v = rec ? vertigoSummary(rec) : null;
        return {
          key: st.finding!,
          target: (r.purpose === 'retest' ? 'retestFindings' : 'findings') as 'findings' | 'retestFindings',
          initial: {
            ...emptyFinding(),
            latencySec: v?.latencySec ?? null,
            durationSec: v?.durationSec ?? null,
            vertigo: false,
            // Nistagmus tipi her zaman bilinçli seçilir ("Yok" önceden seçili gelmez: tek dokunuşla yanlış negatif olmasın).
            nystagmusUnset: true
          }
        };
      });
    setEditQueue(queue);
  };

  // ---- Tam ekran durumlar -------------------------------------------------------------------
  if (run) {
    return (
      <RunnerView
        key={`run-${run.nonce}`}
        protocolId={run.protocolId}
        side={run.side}
        mode="clinician"
        calibration={sensorless ? null : cal}
        onExit={(o) => onRunExit(o, run)}
      />
    );
  }

  if (needCal) {
    return (
      <Screen title="Sensör kalibrasyonu" onBack={cancelCal}>
        <button
          className="btn secondary block"
          onClick={() => {
            setSensorless(true);
            setNeedCal(false);
            if (pendingRun) setRun(pendingRun);
            setPendingRun(null);
          }}
        >
          Sensörsüz devam et (yalnız zamanlayıcı)
        </button>
        <Calibrate
          audience="clinician"
          onDone={(c) => {
            setCal(c);
            setNeedCal(false);
            if (pendingRun) setRun(pendingRun);
            setPendingRun(null);
          }}
          onCancel={cancelCal}
          onNoSensor={() => {
            setSensorless(true);
            setNeedCal(false);
            if (pendingRun) setRun(pendingRun);
            setPendingRun(null);
          }}
        />

      </Screen>
    );
  }

  if (editQueue.length > 0) {
    const cur = editQueue[0]!;
    const showIntensity = cur.key === 'rollR' || cur.key === 'rollL';
    return (
      <Screen title={cur.target === 'retestFindings' ? 'Tekrar test bulgusu' : 'Test bulgusu'}>
        <FindingForm
          key={`${cur.key}-${editQueue.length}`}
          title={keyLabel(cur.key)}
          initial={cur.initial}
          showIntensity={showIntensity}
          dixHallpike={cur.key === 'dhR' || cur.key === 'dhL'}
          defaultMethod={defaultObservationMethod(exam, d.clinician.method, d.clinicExams)}
          onSave={(f) => {
            updateExam(exam.id, (e) => ({ ...e, [cur.target]: { ...e[cur.target], [cur.key]: f } }));
            setEditQueue((q) => q.slice(1));
          }}
        />
      </Screen>
    );
  }

  if (manualEdit) {
    const k = manualEdit;
    return (
      <Screen title="Bulgu gir" onBack={() => setManualEdit(null)}>
        <FindingForm
          title={keyLabel(k)}
          // Yeni elle girişte hiçbir yanıt önceden seçili gelmez (tek dokunuşla yanlış negatif kaydedilmesin); var olan bulgu
          // düzenlenirken kayıtlı değer gösterilir.
          initial={exam.findings[k] ?? { ...emptyFinding(), nystagmusUnset: true }}
          showIntensity={k === 'rollR' || k === 'rollL'}
          dixHallpike={k === 'dhR' || k === 'dhL'}
          defaultMethod={defaultObservationMethod(exam, d.clinician.method, d.clinicExams)}
          onSave={(f) => {
            updateExam(exam.id, (e) => ({ ...e, findings: { ...e.findings, [k]: f } }));
            setManualEdit(null);
          }}
          onCancel={() => setManualEdit(null)}
        />
      </Screen>
    );
  }

  return (
    <Screen
      title="Muayene"
      back="/odyolog"
      wide
      right={
        <button
          className={`chip ${cal ? 'ok' : sensorless ? 'warn' : ''}`}
          title={cal || sensorless ? 'Dokunun: kalibrasyonu sıfırla (yeni hasta yerleşimi / sensörlü moda geç)' : 'Sensör durumu'}
          onClick={() => {
            if (!cal && !sensorless) return;
            setCal(null);
            setSensorless(false);
          }}
          data-testid="exam-sensor-chip"
        >
          {cal ? 'sensör hazır ⟲' : sensorless ? 'sensörsüz ⟲' : 'kalibre değil'}
        </button>
      }
    >
      {/* Hasta kodu kesilmeden, gerekirse satır kırılarak gösterilir (aynı önekli protokol numaraları ayırt edilsin). */}
      <div className="exam-code no-print" data-testid="exam-patient-code">
        <span className="small muted">Hasta kodu</span> <strong>{patient?.code ?? '—'}</strong>
      </div>
      <div className="row small muted no-print">
        <span>{formatDateTime(exam.at)}</span>
        {patient?.birthYear && <span>· d. {patient.birthYear}</span>}
        {patient?.sex && patient.sex !== '-' && <span>· {patient.sex}</span>}
        {exam.homeReports?.length ? (
          <span className="chip primary" data-testid="exam-home-chip">
            ev dönemi raporu
          </span>
        ) : null}
      </div>
      {exam.diagnosis && !dxValid(exam) && (
        <div className="notice danger" role="alert" data-testid="dx-stale">
          <Icon name="alert" />
          <span>Bulgular tanı onaylandıktan sonra değişti. Tanı sekmesinden tanıyı yeniden onaylayın.</span>
        </div>
      )}
      <Segmented
        label="Bölüm"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'tests', label: 'Testler' },
          { value: 'dx', label: 'Tanı' },
          { value: 'treat', label: 'Tedavi' },
          { value: 'rx', label: 'Reçete' },
          { value: 'report', label: 'Rapor' }
        ]}
      />

      {tab === 'tests' && (
        <TestsTab
          exam={exam}
          sensorless={sensorless && !cal}
          onRun={(t) => startRun({ protocolId: t.protocolId, side: t.side, purpose: 'test' })}
          onManual={setManualEdit}
        />
      )}
      {tab === 'dx' && <DxTab exam={exam} onGoTreat={() => setTab('treat')} />}
      {tab === 'treat' && <TreatTab exam={exam} onRun={startRun} />}
      {tab === 'rx' && <RxTab exam={exam} />}
      {tab === 'report' && <ExamReport exam={exam} />}


    </Screen>
  );
}

function TestsTab({
  exam,
  sensorless,
  onRun,
  onManual
}: {
  exam: ClinicExam;
  sensorless: boolean;
  onRun: (t: (typeof TESTS)[number]) => void;
  onManual: (k: FindingKey) => void;
}) {
  // Sıradaki yapılmamış test: tek dokunuşla devam.
  const next = TESTS.find((t) => t.keys.some((k) => !exam.findings[k]));
  const anyDone = TESTS.some((t) => t.keys.some((k) => exam.findings[k]));
  return (
    <div className="stack">
      {anyDone && next && (
        <button className="btn primary block" onClick={() => onRun(next)} data-testid="test-next">
          <Icon name="play" /> Sıradaki: {next.label}
        </button>
      )}
      <p className="small muted">
        {sensorless
          ? 'Sensörsüz (VNG/Frenzel) mod: telefon zamanlayıcı olarak kullanılır, alna yaslanmaz. Pozisyonu elle onaylayın; nistagmusu ekrana dokunarak işaretleyin ya da test sonunda VNG değerlerini bulgu formuna yazın.'
          : 'Telefonu ekranı size bakacak şekilde hastanın alnına yaslayın. Nistagmusun başlangıç ve bitişini ekranın herhangi bir yerine dokunarak işaretleyin; test sonunda bulgu formu açılır.'}
      </p>
      {TESTS.map((t) => (
        <div key={t.id} className="card stack">
          <div className="row">
            <h3 className="grow">{t.label}</h3>
            <button className="btn primary" onClick={() => onRun(t)} data-testid={`test-run-${t.id}`}>
              <Icon name="play" /> {sensorless ? 'Zamanlayıcıyla yap' : 'Telefonla yap'}
            </button>
          </div>
          {t.keys.map((k) => (
            <div key={k} className="row small">
              <span className="grow">
                <strong>{keyLabel(k)}:</strong> {findingSummary(exam.findings[k])}
              </span>
              <button className="btn ghost" onClick={() => onManual(k)}>
                Elle gir
              </button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function DxTab({ exam, onGoTreat }: { exam: ClinicExam; onGoTreat: () => void }) {
  const result = useMemo(() => suggestDiagnosis(exam.findings), [exam.findings]);
  const [manual, setManual] = useState(false);
  const [canal, setCanal] = useState<Canal | null>(null);
  const [side, setSide] = useState<Side | 'none' | null>(null);
  const [mech, setMech] = useState<ConfirmedDiagnosis['mechanism'] | null>(null);

  const confirm = (dx: ConfirmedDiagnosis) => {
    updateExam(exam.id, (e) => ({
      ...e,
      diagnosis: { ...dx, warnings: result.warnings.length ? result.warnings : undefined, findingsKey: findingsKeyOf(e.findings) }
    }));
  };
  // Bulguya dayanan reçete kilidi (≥1 dk yanıt / çok kanallı): elle tanı bunu açmaz; formda önceden söylenir.
  const findingLock = rxFindingLock(exam.findings, exam.retestFindings);
  const hasWarnings = result.warnings.length > 0;
  const valid = dxValid(exam);

  return (
    <div className="stack">
      {exam.diagnosis && valid && (
        <div className={`card ${exam.diagnosis.warnings?.length ? 'tint-warn' : 'tint-ok'} stack`}>
          <div className="row">
            <Icon name="check" />
            <strong className="grow">Onaylı tanı: {dxText(exam.diagnosis)}</strong>
          </div>
          {exam.diagnosis.warnings?.length ? <p className="small">Uyarılarla birlikte onaylandı; uyarılar rapora yazılır.</p> : null}
          <button className="btn primary" onClick={onGoTreat} data-testid="dx-go-treat">
            Tedaviye geç
          </button>
        </div>
      )}
      {Object.keys(exam.findings).length === 0 && <div className="notice info">Önce test bulgularını girin.</div>}
      {result.warnings.map((w, i) => (
        <div key={i} className="notice danger" role="alert">
          <Icon name="alert" />
          <span>{w}</span>
        </div>
      ))}
      {result.negative && (
        <div className="card soft">
          <p>Pozisyon testleri negatif. BPPV dışı nedenleri ve öyküyü değerlendirin.</p>
        </div>
      )}
      {result.suggestions.map((s, i) => (
        <div key={i} className={`card stack ${valid && exam.diagnosis?.label === s.label ? 'tint-ok' : ''}`} data-testid="dx-suggestion">
          <div className="row">
            <h3 className="grow">{s.label}</h3>
            <span className={`chip ${s.confidence === 'tipik' ? 'ok' : s.confidence === 'olası' ? 'warn' : ''}`}>{s.confidence}</span>
          </div>
          <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>
            {s.rationale.map((r, j) => (
              <li key={j}>{r}</li>
            ))}
          </ul>
          {s.maneuvers.length > 0 && <p className="small muted">Önerilen: {s.maneuvers.map((m) => PROTOCOLS[m].shortName).join(', ')}</p>}
          <button
            className={`btn ${hasWarnings ? 'warn' : 'secondary'}`}
            onClick={() =>
              confirm({ canal: s.canal, side: s.side, mechanism: s.mechanism, label: s.label, fromSuggestion: true, confidence: s.confidence })
            }
            data-testid="dx-confirm"
          >
            <Icon name="check" /> {hasWarnings ? 'Uyarıları okudum, yine de onayla' : 'Bu tanıyı onayla'}
          </button>
        </div>
      ))}
      <details className="card soft small" data-testid="dx-limits">
        <summary>
          <strong>Bu öneri neye dayanır, neye dayanmaz?</strong>
        </summary>
        <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
          <li>Yalnız girilen pozisyon testi bulgularına dayanır (Bárány 2015 ölçütleri).</li>
          <li>Öykü, nörolojik muayene (HINTS dahil), işitme ve spontan nistagmus değerlendirilmez.</li>
          <li>"Tipik": desen, gecikme ve süre ölçütlere uyuyor ve hiçbir uyarı yok. "Olası": ölçütlerden biri eksik ya da uyarı var.</li>
          <li>Sevk ölçütleri: aşağı vuran ya da saf torsiyonel nistagmus, gecikmesiz/yorulmayan uzun yanıt, nörolojik bulgu, ani işitme kaybı, 2–3 doğru manevraya yanıtsızlık.</li>
        </ul>
      </details>
      <p className="small muted">Uygulama yalnızca öneri sunar. Tanı kararı klinisyene aittir.</p>
      {!manual ? (
        <button className="btn ghost" onClick={() => setManual(true)}>
          Tanıyı elle gir
        </button>
      ) : (
        <div className="card stack">
          <h3>Elle tanı</h3>
          <Choice
            name="Kanal"
            value={canal}
            onChange={setCanal}
            options={[
              { value: 'PC', label: 'Arka kanal' },
              { value: 'HC', label: 'Yatay kanal' },
              { value: 'AC', label: 'Ön kanal' }
            ]}
          />
          <p className="small muted">Kanal, taraf ve mekanizmanın üçünü de seçin; hiçbiri önceden seçili gelmez.</p>
          <Segmented
            label="Taraf"
            value={side}
            onChange={setSide}
            options={[
              { value: 'R', label: 'Sağ' },
              { value: 'L', label: 'Sol' },
              { value: 'none', label: 'Belirsiz' }
            ]}
          />
          <Segmented
            label="Mekanizma"
            value={mech}
            onChange={setMech}
            options={[
              { value: 'canalithiasis', label: 'Kanalolitiazis' },
              { value: 'cupulolithiasis', label: 'Kupulolitiazis' },
              { value: 'unknown', label: 'Bilinmiyor' }
            ]}
          />
          {canal === 'PC' && findingLock && (
            <div className="notice danger" role="alert" data-testid="dx-manual-lock">
              <Icon name="alert" />
              <span>
                {findingLock.message}
                {mech === 'canalithiasis' && findingLock.code === 'long-response'
                  ? ' Seçtiğiniz "kanalolitiazis" bulguyla çelişiyor; tanıyı kaydedebilirsiniz, ev reçetesi kilitli kalır.'
                  : ''}
              </span>
            </div>
          )}
          <button
            className="btn primary"
            disabled={!canal || side === null || mech === null}
            onClick={() => {
              if (!canal || side === null || mech === null) return;
              const sd = side === 'R' || side === 'L' ? side : null;
              confirm({
                canal,
                side: sd,
                mechanism: mech,
                label: manualDxLabel(canal, sd, mech),
                fromSuggestion: false,
                suggestedLabels: result.suggestions.length ? result.suggestions.map((x) => x.label) : undefined
              });
              setManual(false);
            }}
            data-testid="dx-manual-save"
          >
            Kaydet
          </button>
        </div>
      )}

    </div>
  );
}

const MANEUVER_IDS: ProtocolId[] = ['epley', 'semont', 'bbq-roll', 'gufoni-geo', 'gufoni-apo', 'yacovino'];

function TreatTab({ exam, onRun }: { exam: ClinicExam; onRun: (r: RunReq) => void }) {
  const dx = exam.diagnosis;
  const valid = dxValid(exam);
  // Bayat (bulgu değişmiş) tanıdan öneri ve varsayılan taraf alınmaz.
  const suggested = valid && dx?.canal ? maneuversFor(dx.canal, dx.mechanism) : [];
  const [showAll, setShowAll] = useState(false);
  // Varsayılan taraf yok: tanıda taraf belirsizse klinisyen bilinçli seçsin.
  const [side, setSide] = useState<Side | null>(valid ? (dx?.side ?? null) : null);
  useEffect(() => {
    if (valid && dx?.side) setSide(dx.side);
  }, [valid, dx?.side]);
  const list = showAll ? MANEUVER_IDS : suggested.length ? suggested : MANEUVER_IDS;

  return (
    <div className="stack">
      {!dx && <div className="notice info">Tanı onaylanmadı. Manevrayı yine de seçebilirsiniz.</div>}
      {dx && !valid && <div className="notice">Bulgular değişti; tanıyı yeniden onaylayın.</div>}
      {dx && valid && (
        <div className="card soft small">
          Onaylı tanı: <strong>{dxText(dx)}</strong>
        </div>
      )}
      {valid && dx?.side ? (
        <p className="small">
          Taraf: <strong>{sideName(dx.side)}</strong> <span className="muted">(onaylı tanıdan)</span>
        </p>
      ) : (
        <div className="field">
          <label>Etkilenen taraf</label>
          <Segmented
            label="Taraf"
            value={side}
            onChange={setSide}
            options={[
              { value: 'R', label: 'Sağ' },
              { value: 'L', label: 'Sol' }
            ]}
          />
        </div>
      )}
      {list.map((id) => {
        const p = PROTOCOLS[id];
        return (
          <div key={id} className="card stack">
            <div className="row">
              <h3 className="grow">{p.name}</h3>
              {suggested[0] === id && <span className="chip ok">önerilen</span>}
            </div>
            <details className="small">
              <summary>Açıklama, kanıt ve uyarılar</summary>
              <p>{p.summary}</p>
              <p className="muted">{p.evidenceNote}</p>
              {p.cautions.map((c, i) => (
                <p key={i} style={{ color: 'var(--warn)' }}>
                  {c}
                </p>
              ))}
            </details>
            <button
              className={`btn ${suggested[0] === id || suggested.length === 0 ? 'primary' : 'secondary'}`}
              disabled={p.sided && !side}
              onClick={() => onRun({ protocolId: id, side: p.sided ? side : null, purpose: 'maneuver' })}
              data-testid={`treat-run-${id}`}
            >
              <Icon name="play" /> {p.shortName}
              {p.sided ? (side ? ` (${sideName(side)})` : ' — önce tarafı seçin') : ''} başlat
            </button>
          </div>
        );
      })}
      {suggested.length > 0 && (
        <button className="btn ghost" onClick={() => setShowAll(!showAll)}>
          {showAll ? 'Yalnız önerilenleri göster' : 'Tüm manevraları göster'}
        </button>
      )}

      {exam.maneuvers.length > 0 && (
        <div className="card stack">
          <h3>Yapılan manevralar</h3>
          {exam.maneuvers.map((m) => (
            <div key={m.id} className="row small">
              <span className="grow">
                {formatDateTime(m.at)} — {PROTOCOLS[m.protocolId].shortName} {m.side ? sideName(m.side) : ''}
              </span>
              <span className={`chip ${m.completed && maneuverStatus(m) === 'tamamlandı' ? 'ok' : 'warn'}`}>{maneuverStatus(m)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="card stack">
        <h3>Tekrar test</h3>
        <p className="small muted">Manevradan sonra pozisyon testini tekrarlayarak sonucu kaydedin.</p>
        <div className="row wrap">
          {TESTS.map((t) => (
            <button key={t.id} className="btn secondary" onClick={() => onRun({ protocolId: t.protocolId, side: t.side, purpose: 'retest' })}>
              {t.label}
            </button>
          ))}
        </div>
        {Object.entries(exam.retestFindings).map(([k, f]) => (
          <div key={k} className="small">
            <strong>{keyLabel(k as FindingKey)}:</strong> {findingSummary(f)}
          </div>
        ))}
      </div>
    </div>
  );
}

function RxTab({ exam }: { exam: ClinicExam }) {
  const d = useData();
  const dx = exam.diagnosis;
  // Daha önce oluşturulan reçete varsa form onunla açılır (QR ile form her zaman aynı bilgiyi göstersin).
  const issued = useMemo(() => {
    if (!exam.prescriptionToken) return null;
    const r = decodePrescription(exam.prescriptionToken);
    return r.ok ? r.value : null;
  }, [exam.prescriptionToken]);
  const [maneuver, setManeuver] = useState<'epley' | 'semont'>(issued?.maneuver ?? 'epley');
  const [perDay, setPerDay] = useState(issued?.perDay ?? 3);
  const [days, setDays] = useState(issued?.days ?? 3);
  const [note, setNote] = useState(issued?.note ?? '');
  const [svg, setSvg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  // Taraf yalnız onaylı tanıdan gelir (reçetede ayrıca seçilmez: ters taraf riski).
  const side: Side | null = dx?.side ?? null;
  const stale =
    !!issued &&
    (issued.side !== side || issued.maneuver !== maneuver || issued.perDay !== perDay || issued.days !== days || (issued.note ?? '') !== note.trim());
  const [ack, setAck] = useState(false);
  // Reçete oluşturulunca QR görünür alana kaydırılır (hastaya göstermek için aşağı kaydırmak gerekmesin).
  const [justMade, setJustMade] = useState(false);
  const outRef = useRef<HTMLDivElement | null>(null);

  const url = useMemo(() => {
    if (!exam.prescriptionToken) return null;
    const base = window.location.href.split('#')[0]!;
    return `${base}#/recete/${exam.prescriptionToken}`;
  }, [exam.prescriptionToken]);

  useEffect(() => {
    if (!url) {
      setSvg(null);
      return;
    }
    void QRCode.toString(url, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' }).then(setSvg);
  }, [url]);

  useEffect(() => {
    if (!justMade || !svg || !outRef.current) return;
    outRef.current.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
    setJustMade(false);
  }, [justMade, svg]);

  // Ev reçetesi yalnız geçerli, onaylı, taraflı arka kanal tanısıyla verilir (hasta tarafında "hekim tanısı" yerine geçer).
  // Kilit onaylı tanının mekanizmasına EK OLARAK bulgulara da bakar: elle girilen "kanalolitiazis" ≥1 dk yanıtı aşamaz.
  const rxBlock = rxBlockReason(exam);
  if (rxBlock) {
    return (
      <div className="notice info" data-testid="rx-blocked">
        <Icon name="info" />
        <span>{rxBlock}</span>
      </div>
    );
  }
  // Onaydaki ya da şu anki bulgulardan çıkan uyarı varsa reçete için ek onay istenir.
  // Uyarı (onay anında ya da şimdi) ya da "belirsiz" güvenli öneri (ör. nistagmussuz pozisyonel vertigo) varsa ek onay istenir.
  const needAck = !!dx?.warnings?.length || suggestDiagnosis(exam.findings).warnings.length > 0 || dx?.confidence === 'belirsiz';

  const make = () => {
    if (!side) return;
    // Hasta kodu reçeteye yazılır: hastanın hekime gönderdiği rapor bu kodla muayene kaydıyla eşleşir (ad değil).
    const pid = d.clinicPatients.find((x) => x.id === exam.patientId)?.code;
    const p: Prescription = {
      v: 1,
      side,
      canal: 'PC',
      maneuver,
      // Yerel tarih (UTC değil): gece yarısından sonraki muayene önceki güne yazılmasın.
      date: localDayKey(exam.at),
      by: d.clinician.name,
      clinic: d.clinician.clinic,
      perDay,
      days,
      note: note.trim() || undefined,
      pid
    };
    const token = encodePrescription(p);
    updateExam(exam.id, (e) => ({ ...e, prescriptionToken: token, prescriptionFindingsKey: e.diagnosis?.findingsKey }));
    setJustMade(true);
  };

  return (
    <div className="stack">
      <div className="card stack">
        <h3>Ev manevrası reçetesi</h3>
        <p className="small muted">
          Hasta bağlantıyı açtığında (ya da QR kodu telefon kamerasıyla okuttuğunda) taraf, manevra ve doz otomatik yüklenir. Hasta her seansta yine güvenlik
          sorularını yanıtlar.
        </p>
        <div className="field">
          <label>Taraf</label>
          <p data-testid="rx-side">
            <strong>{side ? sideName(side).charAt(0).toLocaleUpperCase('tr-TR') + sideName(side).slice(1) : '—'}</strong>{' '}
            <span className="small muted">(onaylı tanıdan; değişecekse tanıyı yeniden onaylayın)</span>
          </p>
        </div>
        <div className="field">
          <label>Manevra</label>
          <Segmented
            label="Manevra"
            value={maneuver}
            onChange={setManeuver}
            options={[
              { value: 'epley', label: 'Epley' },
              { value: 'semont', label: 'Semont' }
            ]}
          />
        </div>
        <div className="row">
          <div className="field grow">
            <label>Günde en fazla</label>
            <Segmented label="Günde" value={perDay} onChange={setPerDay} options={[1, 2, 3].map((n) => ({ value: n, label: `${n}` }))} />
          </div>
          <div className="field grow">
            <label>Gün sayısı</label>
            <Segmented label="Gün" value={days} onChange={setDays} options={[1, 3, 5, 7].map((n) => ({ value: n, label: `${n}` }))} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="rxnote">Not (isteğe bağlı, en fazla 80 karakter)</label>
          <input id="rxnote" className="input" value={note} maxLength={80} onChange={(e) => setNote(e.target.value)} />
        </div>
        <p className="small" data-testid="rx-validity">
          {rxValidityText(localDayKey(exam.at))}
        </p>
        {needAck && (
          <label className="row notice danger" style={{ alignItems: 'flex-start' }}>
            <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} className="check-lg" data-testid="rx-ack" />
            <span>
              {dx?.confidence === 'belirsiz' && !dx?.warnings?.length
                ? 'Tanı belirsiz bir öneriden onaylandı (ör. nistagmus gözlenmedi). Değerlendirdim; bu hastanın evde manevra yapması uygundur.'
                : 'Tanı uyarılarla onaylandı. Uyarıları değerlendirdim; bu hastanın evde manevra yapması uygundur.'}
            </span>
          </label>
        )}
        <button className="btn primary" onClick={make} disabled={!side || (needAck && !ack)} data-testid="rx-make">
          <Icon name="qr" /> {issued ? 'Reçeteyi güncelle' : 'Reçete oluştur'}
        </button>
      </div>

      {url && !stale && !rxCurrent(exam) && (
        <div className="notice" role="status" data-testid="rx-outdated">
          <Icon name="alert" />
          <span>Tanı, reçete verildikten sonra değişti. Hastaya göstermeden önce "Reçeteyi güncelle"ye basın; eski QR kod gizlendi.</span>
        </div>
      )}
      {url && stale && (
        <div className="notice" role="status" data-testid="rx-stale">
          <Icon name="alert" />
          <span>Formda değişiklik var. Hastaya göstermeden önce "Reçeteyi güncelle"ye basın; eski QR kod gizlendi.</span>
        </div>
      )}

      {url && issued && !stale && rxCurrent(exam) && (
        <div className="card stack center" data-testid="rx-output" ref={outRef}>
          <h3>Hastaya gösterin</h3>
          <p className="small" data-testid="rx-summary">
            <strong>
              {sideName(issued.side).toLocaleUpperCase('tr-TR')} arka kanal · {issued.maneuver === 'epley' ? 'Epley' : 'Semont'}
            </strong>{' '}
            · günde en fazla {issued.perDay}, {issued.days} gün
          </p>
          <p className="small muted" data-testid="rx-output-validity">
            {rxValidityText(issued.date)} Reçete kodu: {rxCode(exam.prescriptionToken!)}
          </p>
          {svg && <div className="qr" dangerouslySetInnerHTML={{ __html: svg }} aria-label="Reçete QR kodu" />}
          <p className="small muted">Hasta telefon kamerasıyla bu kodu okutur.</p>
          <div className="row wrap" style={{ justifyContent: 'center' }}>
            <button
              className="btn secondary"
              onClick={() => {
                void navigator.clipboard?.writeText(url).then(() => setCopied(true));
              }}
            >
              <Icon name="copy" /> {copied ? 'Kopyalandı' : 'Bağlantıyı kopyala'}
            </button>
            {'share' in navigator && (
              <button className="btn secondary" onClick={() => void navigator.share({ title: 'DengeYol reçetesi', url }).catch(() => undefined)}>
                <Icon name="share" /> Paylaş
              </button>
            )}
          </div>
          <input className="input small" readOnly value={url} onFocus={(e) => e.currentTarget.select()} data-testid="rx-url" />
        </div>
      )}
    </div>
  );
}


const fullDate = (t: number) =>
  new Date(t).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

function ExamReport({ exam }: { exam: ClinicExam }) {
  const d = useData();
  const patient = d.clinicPatients.find((p) => p.id === exam.patientId);
  const [copied, setCopied] = useState(false);
  const rx = exam.prescriptionToken ? decodePrescription(exam.prescriptionToken) : null;
  const valid = dxValid(exam);
  // Yazdırılan raporda hastanın okutabileceği QR (yalnız güncel reçete).
  const [qr, setQr] = useState<string | null>(null);
  const rxOk = rxCurrent(exam);
  const [notes, setNotes] = useState(exam.notes ?? '');
  useEffect(() => {
    if (!exam.prescriptionToken || !rxOk) {
      setQr(null);
      return;
    }
    const url = `${window.location.href.split('#')[0]}#/recete/${exam.prescriptionToken}`;
    void QRCode.toString(url, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' }).then(setQr);
  }, [exam.prescriptionToken, rxOk]);
  const methods = methodsOf(exam.findings, exam.retestFindings);
  // Yöntem başlıkta bir kez; satırda yalnız farklı olan yazılır.
  const baseMethod = primaryMethod(exam.findings, exam.retestFindings);
  const lock =rxFindingLock(exam.findings, exam.retestFindings);
  const fx = (title: string, f: Findings) => {
    const keys = Object.keys(f) as FindingKey[];
    if (keys.length === 0) return null;
    return (
      <div className="card stack">
        <h3>{title}</h3>
        <table className="table">
          <tbody>
            {keys.map((k) => (
              <tr key={k}>
                <th>{keyLabel(k)}</th>
                <td>{findingSummary(f[k], true, baseMethod)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  return (
    <div className="stack clin-report" data-testid="exam-report">
      <div className="card stack">
        <h2>BPPV muayene raporu</h2>
        <dl className="kv">
          <dt>Hasta kodu</dt>
          <dd className="exam-code-value">{patient?.code}</dd>
          <dt>Doğum yılı / cinsiyet</dt>
          <dd>
            {patient?.birthYear ?? '—'} / {patient?.sex ?? '—'}
          </dd>
          <dt>Tarih</dt>
          <dd>{fullDate(exam.at)}</dd>
          <dt>Klinisyen</dt>
          <dd>
            {d.clinician.name ?? '—'}
            {d.clinician.clinic ? `, ${d.clinician.clinic}` : ''}
          </dd>
          {methods.length > 0 && (
            <>
              <dt>Gözlem yöntemi</dt>
              <dd>{methods.join(', ')}</dd>
            </>
          )}
          <dt>Tanı</dt>
          <dd>
            {exam.diagnosis && valid
              ? `${dxText(exam.diagnosis)} (${exam.diagnosis.fromSuggestion ? 'karar desteği önerisi, klinisyen onayı' : 'klinisyen girişi'})`
              : exam.diagnosis
                ? 'Bulgular değişti; tanı yeniden onaylanmadı'
                : '—'}
          </dd>
          {exam.diagnosis && valid && !exam.diagnosis.fromSuggestion && exam.diagnosis.suggestedLabels?.length ? (
            <>
              <dt>Karar desteği önerisi</dt>
              <dd>{exam.diagnosis.suggestedLabels.join('; ')}</dd>
            </>
          ) : null}
        </dl>
        {exam.diagnosis && valid && exam.diagnosis.warnings?.length ? (
          <div className="notice danger">
            <Icon name="alert" />
            <span>
              <strong>Onay sırasındaki uyarılar:</strong> {exam.diagnosis.warnings.join(' ')}
            </span>
          </div>
        ) : null}
        {lock && (
          <div className="notice danger" data-testid="report-rx-lock">
            <Icon name="alert" />
            <span>
              <strong>Ev reçetesi kilidi:</strong> {lock.message}
            </span>
          </div>
        )}
      </div>
      {fx('Pozisyon testleri', exam.findings)}
      {exam.maneuvers.length > 0 && (
        <div className="card stack">
          <h3>Manevralar</h3>
          {exam.maneuvers.map((m) => {
            const lines = stepLines(m);
            const anyPhi = lines.some((l) => l.phi);
            const anyTransition = lines.some((l) => l.transitionSec !== null);
            return (
              <div key={m.id} className="stack" style={{ gap: 4 }}>
                <strong>
                  {formatDateTime(m.at)} — {PROTOCOLS[m.protocolId].name} {m.side ? `(${sideName(m.side)})` : ''} · {maneuverStatus(m, lines)}
                  {m.manual ? ' · elle onaylı' : ''}
                </strong>
                <table className="table" data-testid="report-steps">
                  <thead>
                    <tr>
                      <th>Adım</th>
                      <th>Süre / hedef</th>
                      <th>Hedefte</th>
                      <th>θ sapma (ort. / en çok)</th>
                      {anyPhi && <th>φ sarkma (ort. / en az)</th>}
                      {anyTransition && <th>Geçiş</th>}
                      <th>Nistagmus</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((l, i) => (
                      <tr key={i} className={l.early || l.flags.length ? 'early' : undefined}>
                        <td>
                          {l.title}
                          {l.flags.length > 0 && (
                            <span className="small" style={{ display: 'block' }} data-testid="report-step-flags">
                              <strong>{l.flags.join(' · ')}</strong>
                            </span>
                          )}
                        </td>
                        <td>
                          {l.holdSec}
                          {l.targetSec !== null ? ` / ${l.targetSec}` : ''} s{l.early ? <strong> · erken bitirildi</strong> : null}
                        </td>
                        <td>{l.inRangePct !== null ? `%${l.inRangePct}` : l.manual ? 'elle' : '—'}</td>
                        <td>{l.theta ? `${l.theta.mean}° / ${l.theta.max}°` : '—'}</td>
                        {anyPhi && <td>{l.phi ? `${l.phi.mean}° / ${l.phi.min}°` : '—'}</td>}
                        {anyTransition && (
                          <td>
                            {l.transitionSec !== null
                              ? `${l.transitionSec} s${l.fastTargetSec !== null && l.transitionSec > l.fastTargetSec ? ` (yavaş; hedef <${l.fastTargetSec} s)` : ''}`
                              : '—'}
                          </td>
                        )}
                        <td>{l.nystagmus ? l.nystagmus.replace(/^nistagmus /, '') : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}
      {fx('Tekrar test', exam.retestFindings)}
      {(exam.homeReports ?? []).map((h) => {
        const r = decodeHomeReport(h.token);
        if (!r.ok) {
          return (
            <div key={h.id} className="notice" data-testid="report-home-broken">
              <Icon name="alert" />
              <span>Eklenen ev dönemi raporu okunamadı.</span>
            </div>
          );
        }
        const match = !!r.value.rxCode && !!exam.prescriptionToken && rxCode(exam.prescriptionToken) === r.value.rxCode;
        return (
          <div key={h.id} className="stack" style={{ gap: 4 }}>
            <HomeReportView report={r.value} rxNote={match ? 'bu muayenede verilen reçete' : null} testId="report-home" />
            <button
              className="btn ghost no-print"
              onClick={() => {
                if (!window.confirm('Ev dönemi raporu bu muayeneden kaldırılsın mı?')) return;
                updateExam(exam.id, (e) => ({ ...e, homeReports: (e.homeReports ?? []).filter((x) => x.id !== h.id) }));
              }}
              data-testid="report-home-remove"
            >
              <Icon name="trash" /> Ev dönemi raporunu kaldır
            </button>
          </div>
        );
      })}
      <div className="card stack no-print">
        <label htmlFor="examnote">Muayene notu (isteğe bağlı; rapora ve HBYS notuna yazılır)</label>
        <textarea
          id="examnote"
          className="input"
          rows={3}
          maxLength={500}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => {
            const v = notes.trim();
            if (v !== (exam.notes ?? '')) updateExam(exam.id, (e) => ({ ...e, notes: v || undefined }));
          }}
          data-testid="exam-notes"
        />
      </div>
      {exam.notes ? (
        <div className="card stack print-only">
          <h3>Not</h3>
          <p>{exam.notes}</p>
        </div>
      ) : null}
      {/* Yazdırmada reçete, QR ve imza aynı sayfada kalır (bölünmez blok). */}
      <div className="stack clin-rx-block">
        {rx?.ok && (
          <div className="card stack clin-rx">
            <h3>Ev manevrası reçetesi{rxOk ? '' : ' (güncel tanıya dayanmıyor)'}</h3>
            <p>
              {sideName(rx.value.side).toLocaleUpperCase('tr-TR')} arka kanal · {rx.value.maneuver === 'epley' ? 'Epley' : 'Semont'} · günde en fazla{' '}
              {rx.value.perDay}, {rx.value.days} gün{rx.value.note ? ` · Not: ${rx.value.note}` : ''}
            </p>
            <p className="small" data-testid="report-rx-validity">
              {rxValidityText(rx.value.date)} Reçete kodu: {rxCode(exam.prescriptionToken!)}
            </p>
            <p className="small muted">Hasta, DengeYol uygulamasında her seans güvenlik sorularını yanıtlar; doz sınırları uygulamada uygulanır.</p>
            {qr && (
              <div className="row" style={{ alignItems: 'center' }}>
                <div className="qr" style={{ width: 120 }} dangerouslySetInnerHTML={{ __html: qr }} aria-label="Reçete QR kodu" />
                <span className="small">Hasta bu kodu DengeYol yüklü telefonun kamerasıyla okutur.</span>
              </div>
            )}
          </div>
        )}
        <div className="card stack signature clin-signature">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span>Klinisyen: {d.clinician.name ?? '................................'}</span>
            <span>İmza: ................................</span>
          </div>
        </div>
      </div>
      <div className="row wrap no-print">
        <button
          className="btn primary grow"
          onClick={() => {
            // Yazılmakta olan not da nota girsin (odak kaybı beklenmeden).
            const v = notes.trim();
            if (v !== (exam.notes ?? '')) updateExam(exam.id, (e) => ({ ...e, notes: v || undefined }));
            const text = examNoteText({ ...exam, notes: v || undefined }, patient?.code, d.clinician);
            void navigator.clipboard?.writeText(text).then(() => setCopied(true));
          }}
          data-testid="exam-copy-note"
        >
          <Icon name="copy" /> {copied ? 'Kopyalandı' : 'Muayene notunu kopyala (HBYS / e-Nabız)'}
        </button>
        <button className="btn secondary grow" onClick={() => window.print()}>
          <Icon name="print" /> Yazdır / PDF
        </button>
      </div>
    </div>
  );
}
