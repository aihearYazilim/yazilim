/**
 * Klinik muayene akışı: testler → tanı önerisi/onayı → tedavi + tekrar test → ev reçetesi → rapor.
 */
import QRCode from 'qrcode';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Calibration } from '../../../core/calibration';
import { type Finding, type Findings, keyLabel, NYSTAGMUS_LABEL, suggestDiagnosis } from '../../../core/diagnosis';
import { decodePrescription, encodePrescription, type Prescription } from '../../../core/prescription';
import {
  type Canal,
  type FindingKey,
  maneuversFor,
  PROTOCOLS,
  type ProtocolId,
  type Side,
  sideName
} from '../../../core/protocols';
import { recordStats, vertigoSummary } from '../../../core/runner';
import { formatDateTime } from '../../../state/episodes';
import { store, uid, useData } from '../../../state/store';
import type { ClinicExam, ConfirmedDiagnosis, ManeuverLog } from '../../../state/types';
import { Choice, Segmented } from '../../components/Controls';
import { Icon } from '../../components/Icon';
import { Screen } from '../../components/Screen';
import { Calibrate } from '../Calibrate';
import { RunnerView, type RunnerOutcome } from '../RunnerView';
import { emptyFinding, FindingForm } from './FindingForm';

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
  { id: 'roll', label: 'Supine roll testi', protocolId: 'supine-roll', side: null, keys: ['rollCenter', 'rollR', 'rollL'] }
];

/** Bulguların sıralı imzası: onaylı tanının hangi bulgulara dayandığını izlemek için. */
export function findingsKeyOf(f: Findings): string {
  return JSON.stringify(Object.keys(f).sort().map((k) => [k, f[k as FindingKey]]));
}

/** Onaylı tanı hâlâ geçerli mi (onaydan sonra bulgu değiştiyse hayır). */
export function dxValid(exam: ClinicExam): boolean {
  const dx = exam.diagnosis;
  if (!dx) return false;
  return dx.findingsKey === undefined || dx.findingsKey === findingsKeyOf(exam.findings);
}

function updateExam(id: string, fn: (e: ClinicExam) => ClinicExam) {
  store.update((d) => ({ ...d, clinicExams: d.clinicExams.map((e) => (e.id === id ? fn(e) : e)) }));
}

function findingSummary(f: Finding | undefined): string {
  if (!f) return 'Yapılmadı';
  if (f.nystagmus === 'none') return f.vertigo ? 'Nistagmus yok, baş dönmesi var' : 'Negatif';
  const parts = [NYSTAGMUS_LABEL[f.nystagmus]];
  if (f.latencySec !== null) parts.push(`gecikme ${f.latencySec} s`);
  if (f.durationSec !== null) parts.push(`süre ${f.durationSec} s`);
  if (f.intensity) parts.push(`şiddet ${f.intensity}/3`);
  return parts.join(' · ');
}

export function Exam() {
  const { id } = useParams();
  const d = useData();
  const nav = useNavigate();
  const exam = d.clinicExams.find((e) => e.id === id);
  const patient = exam ? d.clinicPatients.find((p) => p.id === exam.patientId) : undefined;
  const [tab, setTab] = useState<Tab>('tests');
  const [cal, setCal] = useState<Calibration | null>(null);
  const [sensorless, setSensorless] = useState(!!d.clinician.sensorless);
  const [pendingRun, setPendingRun] = useState<RunReq | null>(null);
  const [run, setRun] = useState<RunReq | null>(null);
  const [needCal, setNeedCal] = useState(false);
  const [editQueue, setEditQueue] = useState<{ key: FindingKey; initial: Finding & { nystagmusUnset?: boolean }; target: 'findings' | 'retestFindings' }[]>([]);
  const [manualEdit, setManualEdit] = useState<FindingKey | null>(null);

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
            nystagmusUnset: !!v
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
      <Screen title="Sensör kalibrasyonu" onBack={() => setNeedCal(false)}>
        <Calibrate
          audience="clinician"
          onDone={(c) => {
            setCal(c);
            setNeedCal(false);
            if (pendingRun) setRun(pendingRun);
            setPendingRun(null);
          }}
          onCancel={() => {
            setNeedCal(false);
            setPendingRun(null);
          }}
          onNoSensor={() => {
            setSensorless(true);
            setNeedCal(false);
            if (pendingRun) setRun(pendingRun);
            setPendingRun(null);
          }}
        />
        <button
          className="btn ghost"
          onClick={() => {
            setSensorless(true);
            setNeedCal(false);
            if (pendingRun) setRun(pendingRun);
            setPendingRun(null);
          }}
        >
          Sensörsüz devam et (yalnız zamanlayıcı)
        </button>
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
          initial={exam.findings[k] ?? emptyFinding()}
          showIntensity={k === 'rollR' || k === 'rollL'}
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
      title={`Muayene · ${patient?.code ?? ''}`}
      back="/odyolog"
      wide
      right={
        <span className={`chip ${cal ? 'ok' : sensorless ? 'warn' : ''}`} title="Sensör durumu">
          {cal ? 'sensör hazır' : sensorless ? 'sensörsüz' : 'kalibre değil'}
        </span>
      }
    >
      <div className="row small muted">
        <span>{formatDateTime(exam.at)}</span>
        {patient?.birthYear && <span>· d. {patient.birthYear}</span>}
        {patient?.sex && patient.sex !== '-' && <span>· {patient.sex}</span>}
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
        <TestsTab exam={exam} onRun={(t) => startRun({ protocolId: t.protocolId, side: t.side, purpose: 'test' })} onManual={setManualEdit} />
      )}
      {tab === 'dx' && <DxTab exam={exam} onGoTreat={() => setTab('treat')} />}
      {tab === 'treat' && <TreatTab exam={exam} onRun={startRun} />}
      {tab === 'rx' && <RxTab exam={exam} />}
      {tab === 'report' && <ExamReport exam={exam} />}

      {(cal || sensorless) && (
        <button
          className="btn ghost small"
          onClick={() => {
            setCal(null);
            setSensorless(false);
          }}
        >
          {sensorless ? 'Sensörlü moda geç' : 'Kalibrasyonu sıfırla (yeni hasta yerleşimi)'}
        </button>
      )}
      <button className="btn ghost small" onClick={() => nav('/odyolog')}>
        Muayene listesine dön
      </button>
    </Screen>
  );
}

function TestsTab({ exam, onRun, onManual }: { exam: ClinicExam; onRun: (t: (typeof TESTS)[number]) => void; onManual: (k: FindingKey) => void }) {
  return (
    <div className="stack">
      <p className="small muted">
        Telefonu hastanın alnına ekran dışa bakacak şekilde yaslayın. Göstergeler size bakar. Nistagmusu gözleyip başlangıç ve bitişi alttaki alana dokunarak
        işaretleyin; test sonunda bulgu formu açılır.
      </p>
      {TESTS.map((t) => (
        <div key={t.id} className="card stack">
          <div className="row">
            <h3 className="grow">{t.label}</h3>
            <button className="btn primary" onClick={() => onRun(t)} data-testid={`test-run-${t.id}`}>
              <Icon name="play" /> Telefonla yap
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
  const hasWarnings = result.warnings.length > 0;
  const valid = dxValid(exam);

  return (
    <div className="stack">
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
            onClick={() => confirm({ canal: s.canal, side: s.side, mechanism: s.mechanism, label: s.label, fromSuggestion: true })}
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
          <Segmented
            label="Taraf"
            value={side ?? 'none'}
            onChange={setSide}
            options={[
              { value: 'R', label: 'Sağ' },
              { value: 'L', label: 'Sol' },
              { value: 'none', label: 'Belirsiz' }
            ]}
          />
          <Segmented
            label="Mekanizma"
            value={mech ?? 'unknown'}
            onChange={setMech}
            options={[
              { value: 'canalithiasis', label: 'Kanalolitiazis' },
              { value: 'cupulolithiasis', label: 'Kupulolitiazis' },
              { value: 'unknown', label: 'Bilinmiyor' }
            ]}
          />
          <button
            className="btn primary"
            disabled={!canal}
            onClick={() => {
              const sd = side === 'R' || side === 'L' ? side : null;
              const canalTxt = canal === 'PC' ? 'arka kanal' : canal === 'HC' ? 'yatay kanal' : 'ön kanal';
              confirm({
                canal,
                side: sd,
                mechanism: mech ?? 'unknown',
                label: `${sd ? sideName(sd).charAt(0).toLocaleUpperCase('tr-TR') + sideName(sd).slice(1) + ' ' : ''}${canalTxt} BPPV (elle)`,
                fromSuggestion: false
              });
              setManual(false);
            }}
          >
            Kaydet
          </button>
        </div>
      )}
      {exam.diagnosis && valid && (
        <div className={`card ${exam.diagnosis.warnings?.length ? 'tint-warn' : 'tint-ok'} stack`}>
          <div className="row">
            <Icon name="check" />
            <strong className="grow">Onaylı tanı: {exam.diagnosis.label}</strong>
          </div>
          {exam.diagnosis.warnings?.length ? <p className="small">Uyarılarla birlikte onaylandı; uyarılar rapora yazılır.</p> : null}
          <button className="btn primary" onClick={onGoTreat} data-testid="dx-go-treat">
            Tedaviye geç
          </button>
        </div>
      )}
    </div>
  );
}

const MANEUVER_IDS: ProtocolId[] = ['epley', 'semont', 'bbq-roll', 'gufoni-geo', 'gufoni-apo', 'yacovino'];

function TreatTab({ exam, onRun }: { exam: ClinicExam; onRun: (r: RunReq) => void }) {
  const dx = exam.diagnosis;
  const suggested = dx?.canal ? maneuversFor(dx.canal, dx.mechanism) : [];
  const [showAll, setShowAll] = useState(false);
  // Varsayılan taraf yok: tanıda taraf belirsizse klinisyen bilinçli seçsin.
  const [side, setSide] = useState<Side | null>(dx?.side ?? null);
  useEffect(() => {
    if (dx?.side) setSide(dx.side);
  }, [dx?.side]);
  const valid = dxValid(exam);
  const list = showAll ? MANEUVER_IDS : suggested.length ? suggested : MANEUVER_IDS;

  return (
    <div className="stack">
      {!dx && <div className="notice info">Tanı onaylanmadı. Manevrayı yine de seçebilirsiniz.</div>}
      {dx && !valid && <div className="notice">Bulgular değişti; tanıyı yeniden onaylayın.</div>}
      {dx && valid && (
        <div className="card soft small">
          Onaylı tanı: <strong>{dx.label}</strong>
        </div>
      )}
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
      {list.map((id) => {
        const p = PROTOCOLS[id];
        return (
          <div key={id} className="card stack">
            <div className="row">
              <h3 className="grow">{p.name}</h3>
              {suggested[0] === id && <span className="chip ok">önerilen</span>}
            </div>
            <p className="small">{p.summary}</p>
            <p className="small muted">{p.evidenceNote}</p>
            {p.cautions.map((c, i) => (
              <p key={i} className="small" style={{ color: 'var(--warn)' }}>
                {c}
              </p>
            ))}
            <button
              className="btn primary"
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
              <span className={`chip ${m.completed ? 'ok' : 'warn'}`}>{m.completed ? 'tamamlandı' : 'yarıda'}</span>
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
  const [side, setSide] = useState<Side | null>(issued?.side ?? dx?.side ?? null);
  const stale =
    !!issued &&
    (issued.side !== side || issued.maneuver !== maneuver || issued.perDay !== perDay || issued.days !== days || (issued.note ?? '') !== note.trim());
  const sideConflict = !!dx?.side && !!side && dx.side !== side;
  const [ack, setAck] = useState(false);

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

  // Ev reçetesi yalnız geçerli, onaylı, taraflı arka kanal tanısıyla verilir (hasta tarafında "hekim tanısı" yerine geçer).
  const rxBlock = !dx
    ? 'Ev reçetesi için önce Tanı sekmesinde arka kanal tanısını onaylayın.'
    : !dxValid(exam)
      ? 'Bulgular tanı onaylandıktan sonra değişti. Tanıyı yeniden onaylayın.'
      : dx.canal !== 'PC'
        ? 'Ev reçetesi yalnızca arka kanal BPPV için verilebilir. Yatay ve ön kanal manevraları klinikte yapılmalıdır.'
        : !dx.side
          ? 'Onaylı tanıda taraf yok. Ev reçetesi için tarafı belli bir arka kanal tanısı onaylayın.'
          : null;
  if (rxBlock) {
    return (
      <div className="notice info" data-testid="rx-blocked">
        <Icon name="info" />
        <span>{rxBlock}</span>
      </div>
    );
  }
  const needAck = !!dx?.warnings?.length;

  const make = () => {
    if (!side) return;
    const p: Prescription = {
      v: 1,
      side,
      canal: 'PC',
      maneuver,
      date: new Date(exam.at).toISOString().slice(0, 10),
      by: d.clinician.name,
      clinic: d.clinician.clinic,
      perDay,
      days,
      note: note.trim() || undefined
    };
    const token = encodePrescription(p);
    updateExam(exam.id, (e) => ({ ...e, prescriptionToken: token }));
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
          <Segmented
            label="Taraf"
            value={side}
            onChange={(v) => setSide(v)}
            options={[
              { value: 'R', label: 'Sağ' },
              { value: 'L', label: 'Sol' }
            ]}
          />
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
        {sideConflict && (
          <div className="notice danger" role="alert">
            <Icon name="alert" />
            <span>Seçilen taraf, onaylanan tanıdaki taraftan ({sideName(dx!.side!)}) farklı. Lütfen kontrol edin.</span>
          </div>
        )}
        {needAck && (
          <label className="row notice danger" style={{ alignItems: 'flex-start' }}>
            <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} className="check-lg" data-testid="rx-ack" />
            <span>Tanı uyarılarla onaylandı. Uyarıları değerlendirdim; bu hastanın evde manevra yapması uygundur.</span>
          </label>
        )}
        <button className="btn primary" onClick={make} disabled={!side || (needAck && !ack)} data-testid="rx-make">
          <Icon name="qr" /> {issued ? 'Reçeteyi güncelle' : 'Reçete oluştur'}
        </button>
      </div>

      {url && stale && (
        <div className="notice" role="status" data-testid="rx-stale">
          <Icon name="alert" />
          <span>Formda değişiklik var. Hastaya göstermeden önce "Reçeteyi güncelle"ye basın; eski QR kod gizlendi.</span>
        </div>
      )}

      {url && issued && !stale && (
        <div className="card stack center" data-testid="rx-output">
          <h3>Hastaya gösterin</h3>
          <p className="small" data-testid="rx-summary">
            <strong>
              {sideName(issued.side).toLocaleUpperCase('tr-TR')} arka kanal · {issued.maneuver === 'epley' ? 'Epley' : 'Semont'}
            </strong>{' '}
            · günde en fazla {issued.perDay}, {issued.days} gün
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

/** HBYS / e-Nabız muayene notuna yapıştırılacak düz metin. */
export function examNoteText(exam: ClinicExam, code: string | undefined, clinician: { name?: string; clinic?: string }): string {
  const lines: string[] = [];
  lines.push(`Pozisyonel vertigo değerlendirmesi (DengeYol) — ${fullDate(exam.at)}${code ? ` — hasta kodu ${code}` : ''}`);
  const keys = Object.keys(exam.findings) as FindingKey[];
  if (keys.length) lines.push(`Testler: ${keys.map((k) => `${keyLabel(k)}: ${findingSummary(exam.findings[k])}`).join('; ')}.`);
  const dx = exam.diagnosis;
  if (dx && dxValid(exam)) {
    const icd = dx.canal ? ' (ICD-10 öneri: H81.1 Benign paroksismal vertigo)' : '';
    lines.push(`Tanı: ${dx.label}${dx.fromSuggestion ? ' — karar desteği önerisi klinisyence onaylandı' : ' — klinisyen'}${icd}.`);
    if (dx.warnings?.length) lines.push(`Uyarılar: ${dx.warnings.join(' ')}`);
  }
  if (exam.maneuvers.length) {
    lines.push(
      `Manevra: ${exam.maneuvers
        .map((m) => `${PROTOCOLS[m.protocolId].shortName}${m.side ? ` ${sideName(m.side)}` : ''} (${m.completed ? 'tamamlandı' : 'yarıda'})`)
        .join(', ')}.`
    );
  }
  const rk = Object.keys(exam.retestFindings) as FindingKey[];
  if (rk.length) lines.push(`Tekrar test: ${rk.map((k) => `${keyLabel(k)}: ${findingSummary(exam.retestFindings[k])}`).join('; ')}.`);
  if (exam.prescriptionToken) {
    const r = decodePrescription(exam.prescriptionToken);
    if (r.ok) {
      lines.push(
        `Ev reçetesi: ${sideName(r.value.side)} ${r.value.maneuver === 'epley' ? 'Epley' : 'Semont'}, günde en fazla ${r.value.perDay}, ${r.value.days} gün (DengeYol uygulaması, QR ile verildi).`
      );
    }
  }
  if (clinician.name) lines.push(`${clinician.name}${clinician.clinic ? `, ${clinician.clinic}` : ''}`);
  return lines.join('\n');
}

function ExamReport({ exam }: { exam: ClinicExam }) {
  const d = useData();
  const patient = d.clinicPatients.find((p) => p.id === exam.patientId);
  const [copied, setCopied] = useState(false);
  const rx = exam.prescriptionToken ? decodePrescription(exam.prescriptionToken) : null;
  const valid = dxValid(exam);
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
                <td>{findingSummary(f[k])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  return (
    <div className="stack" data-testid="exam-report">
      <div className="card stack">
        <h2>BPPV muayene raporu</h2>
        <dl className="kv">
          <dt>Hasta kodu</dt>
          <dd>{patient?.code}</dd>
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
          <dt>Tanı</dt>
          <dd>
            {exam.diagnosis && valid
              ? `${exam.diagnosis.label} (${exam.diagnosis.fromSuggestion ? 'karar desteği önerisi, klinisyen onayı' : 'klinisyen girişi'})`
              : exam.diagnosis
                ? 'Bulgular değişti; tanı yeniden onaylanmadı'
                : '—'}
          </dd>
        </dl>
        {exam.diagnosis && valid && exam.diagnosis.warnings?.length ? (
          <div className="notice danger">
            <Icon name="alert" />
            <span>
              <strong>Onay sırasındaki uyarılar:</strong> {exam.diagnosis.warnings.join(' ')}
            </span>
          </div>
        ) : null}
      </div>
      {fx('Pozisyon testleri', exam.findings)}
      {exam.maneuvers.length > 0 && (
        <div className="card stack">
          <h3>Manevralar</h3>
          {exam.maneuvers.map((m) => (
            <div key={m.id} className="stack" style={{ gap: 4 }}>
              <strong>
                {formatDateTime(m.at)} — {PROTOCOLS[m.protocolId].name} {m.side ? `(${sideName(m.side)})` : ''} · {m.completed ? 'tamamlandı' : 'yarıda kaldı'}
                {m.manual ? ' · elle onaylı' : ''}
              </strong>
              <table className="table">
                <thead>
                  <tr>
                    <th>Adım</th>
                    <th>Süre</th>
                    <th>Hedefte</th>
                    <th>Ort./maks |θ| hata</th>
                  </tr>
                </thead>
                <tbody>
                  {m.records.map((r, i) => {
                    const st = recordStats(r);
                    return (
                      <tr key={i}>
                        <td>{r.title}</td>
                        <td>{Math.round(r.holdSec)} s</td>
                        <td>{st.inRangePct !== null ? `%${st.inRangePct}` : r.manual ? 'elle' : '—'}</td>
                        <td>{st.meanAbsThetaErr !== null ? `${st.meanAbsThetaErr}° / ${st.maxAbsThetaErr}°` : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
      {fx('Tekrar test', exam.retestFindings)}
      {rx?.ok && (
        <div className="card stack">
          <h3>Ev manevrası reçetesi</h3>
          <p>
            {sideName(rx.value.side).toLocaleUpperCase('tr-TR')} arka kanal · {rx.value.maneuver === 'epley' ? 'Epley' : 'Semont'} · günde en fazla{' '}
            {rx.value.perDay}, {rx.value.days} gün{rx.value.note ? ` · Not: ${rx.value.note}` : ''}
          </p>
          <p className="small muted">Hasta, DengeYol uygulamasında her seans güvenlik sorularını yanıtlar; doz sınırları uygulamada uygulanır.</p>
        </div>
      )}
      <div className="card stack signature">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span>Klinisyen: {d.clinician.name ?? '................................'}</span>
          <span>İmza: ................................</span>
        </div>
      </div>
      <div className="row wrap no-print">
        <button
          className="btn primary grow"
          onClick={() => {
            const text = examNoteText(exam, patient?.code, d.clinician);
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
