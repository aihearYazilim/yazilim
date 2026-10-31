/**
 * Hastanın ev dönemi raporunu içe aktarma (`/odyolog/ev-raporu/:token`; kullanıcı turu 3, F4). Hasta raporunun sonundaki QR
 * klinisyenin telefon kamerasıyla okutulur ya da WhatsApp'tan gelen bağlantı açılır; ağ yoktur, veri bağlantının içindedir.
 * Rapor okunur özet olarak gösterilir; klinisyen aynı hasta koduyla (ya da seçtiği hastayla) bir muayeneye "ev dönemi" olarak
 * ekler. HBYS notuna bir satır girer. Bozuk/aşırı uzun bağlantı reçete içe aktarmadaki gibi reddedilir.
 */
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { rxCode } from '../../../core/prescription';
import { decodeHomeReport, extractReportToken, homeReportId, REPORT_DECODE_ERROR_TEXT } from '../../../core/reportShare';
import { localDayKey } from '../../../core/safety';
import { isStandalone } from '../../../platform/reminders';
import { formatDateTime } from '../../../state/episodes';
import { store, uid, useData } from '../../../state/store';
import type { ClinicExam, ClinicPatient, HomeReportRecord } from '../../../state/types';
import { Icon } from '../../components/Icon';
import { Screen } from '../../components/Screen';
import { looksLikeRxLink, reportPasteErrorText } from './examReport';
import { HomeReportView } from './HomeReportView';

const norm = (s: string) => s.trim().toLocaleLowerCase('tr-TR');

/** Rapor bağlantısını yapıştırıp açma alanı (klinisyen ana ekranı ve hata ekranı). */
export function ReportPaste() {
  const nav = useNavigate();
  const [v, setV] = useState('');
  /** Ret metni (açılamayan yapıştırma); null: hata yok. */
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="stack" style={{ gap: 8 }}>
      <label htmlFor="hrpaste">Hastanın gönderdiği rapor bağlantısını yapıştırın:</label>
      <div className="row">
        <input
          id="hrpaste"
          className="input grow"
          value={v}
          onChange={(e) => {
            setV(e.target.value);
            setErr(null);
          }}
          placeholder="https://…#/odyolog/ev-raporu/…"
          data-testid="hr-paste"
        />
        <button
          className="btn secondary"
          onClick={() => {
            const t = extractReportToken(v);
            if (t) nav(`/odyolog/ev-raporu/${t}`);
            else setErr(reportPasteErrorText(v));
          }}
          data-testid="hr-paste-open"
        >
          Aç
        </button>
      </div>
      {err && (
        <span className="small" style={{ color: 'var(--danger)' }} role="alert" data-testid="hr-paste-error" data-kind={looksLikeRxLink(v) ? 'rx' : 'other'}>
          {err}
        </span>
      )}
    </div>
  );
}

export function ReportImport() {
  // useParams değeri zaten çözülmüş gelir (reçete içe aktarmadaki gibi ikinci kez çözülmez).
  const { token = '' } = useParams();
  const nav = useNavigate();
  const d = useData();
  const res = useMemo(() => decodeHomeReport(token), [token]);
  const report = res.ok ? res.value : null;
  const id = homeReportId(token);

  const matched = report?.pid ? d.clinicPatients.find((p) => norm(p.code) === norm(report.pid!)) : undefined;
  const [patientSel, setPatientSel] = useState<string>(matched?.id ?? 'new');
  const [newCode, setNewCode] = useState(report?.pid ?? '');
  const patient = d.clinicPatients.find((p) => p.id === patientSel);
  const exams = useMemo(
    () => (patient ? d.clinicExams.filter((e) => e.patientId === patient.id).sort((a, b) => b.at - a.at) : []),
    [d.clinicExams, patient]
  );
  // Varsayılan: bugün bu hastaya açılmış muayene (kontrol muayenesi) varsa o; yoksa yeni kontrol muayenesi.
  const todayExam = exams.find((e) => localDayKey(e.at) === localDayKey(Date.now()));
  const [examSel, setExamSel] = useState<string | null>(null);
  const examChoice = examSel !== null && (examSel === 'new' || exams.some((e) => e.id === examSel)) ? examSel : (todayExam?.id ?? 'new');
  const rxExam = report?.rxCode ? exams.find((e) => e.prescriptionToken && rxCode(e.prescriptionToken) === report.rxCode) : undefined;
  const already = d.clinicExams.find((e) => e.homeReports?.some((h) => h.id === id));
  const alreadyPatient = already ? d.clinicPatients.find((p) => p.id === already.patientId) : undefined;

  if (!res.ok || !report) {
    return (
      <Screen title="Hasta ev raporu" back="/odyolog">
        <div className="notice danger" role="alert" data-testid="hr-error">
          <Icon name="alert" />
          <span>{res.ok ? '' : REPORT_DECODE_ERROR_TEXT[res.error]}</span>
        </div>
        <ReportPaste />
        <button className="btn ghost" onClick={() => nav('/', { replace: true })}>
          Ana ekran
        </button>
      </Screen>
    );
  }

  const role = d.settings.role;
  const attach = () => {
    const now = Date.now();
    const rec: HomeReportRecord = { id, token: token.trim(), importedAt: now };
    let patientId = patient?.id;
    let newPatient: ClinicPatient | null = null;
    if (!patientId) {
      const code = newCode.trim() || report.pid || `H-${(d.clinicPatients.length + 1).toString().padStart(3, '0')}`;
      // Aynı kodla kayıtlı hasta varsa yeni kayıt açılmaz (klinisyen ana ekranındaki kural).
      const same = d.clinicPatients.find((p) => norm(p.code) === norm(code));
      if (same) patientId = same.id;
      else {
        newPatient = { id: uid(), code: code.slice(0, 30), sex: '-', createdAt: now };
        patientId = newPatient.id;
      }
    }
    const targetId = examChoice !== 'new' && patient ? examChoice : null;
    let examId = targetId;
    store.update((x) => {
      const patients = newPatient ? [...x.clinicPatients, newPatient] : x.clinicPatients;
      if (targetId) {
        return {
          ...x,
          clinicPatients: patients,
          clinicExams: x.clinicExams.map((e) => (e.id === targetId ? { ...e, homeReports: [...(e.homeReports ?? []), rec] } : e))
        };
      }
      const e: ClinicExam = { id: uid(), patientId: patientId!, at: now, findings: {}, maneuvers: [], retestFindings: {}, homeReports: [rec] };
      examId = e.id;
      return { ...x, clinicPatients: patients, clinicExams: [...x.clinicExams, e] };
    });
    nav(`/odyolog/muayene/${examId}`, { replace: true, state: { tab: 'report' } });
  };

  const rxNote = rxExam ? `bu hastaya ${formatDateTime(rxExam.at)} muayenesinde verdiğiniz reçete` : null;

  return (
    <Screen title="Hasta ev raporu" back="/odyolog" wide>
      <HomeReportView report={report} rxNote={rxNote} testId="hr-report" />

      {role === 'patient' ? (
        <div className="notice info" data-testid="hr-patient-role">
          <Icon name="info" />
          <span>Bu sayfa hekiminiz ya da odyoloğunuz içindir. Raporunuzu kendi telefonunuzdaki QR koddan ona okutun.</span>
        </div>
      ) : role !== 'clinician' ? (
        <NoClinicianHere />
      ) : already ? (
        <div className="notice info" data-testid="hr-already">
          <Icon name="check" />
          <span>
            Bu rapor zaten eklendi: {alreadyPatient?.code ?? '—'} · {formatDateTime(already.at)} muayenesi.{' '}
            <button className="btn ghost" onClick={() => nav(`/odyolog/muayene/${already.id}`, { state: { tab: 'report' } })}>
              Muayeneyi aç
            </button>
          </span>
        </div>
      ) : (
        <div className="card stack" data-testid="hr-attach-card">
          <h3>Muayeneye "ev dönemi" olarak ekle</h3>
          <div className="field">
            <label htmlFor="hr-patient">Hasta</label>
            <select
              id="hr-patient"
              className="select"
              value={patientSel}
              onChange={(e) => {
                setPatientSel(e.target.value);
                setExamSel(null);
              }}
              data-testid="hr-patient"
            >
              <option value="new">Yeni hasta kaydı{report.pid ? ` (kod ${report.pid})` : ''}</option>
              {d.clinicPatients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code}
                  {matched?.id === p.id ? ' — rapordaki kodla aynı' : ''}
                </option>
              ))}
            </select>
          </div>
          {!patient && (
            <div className="field">
              <label htmlFor="hr-code">Yeni hastanın kodu</label>
              <input
                id="hr-code"
                className="input"
                value={newCode}
                maxLength={30}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="Ör. protokol no ya da baş harfler"
                data-testid="hr-code"
              />
            </div>
          )}
          {patient && report.pid && norm(patient.code) !== norm(report.pid) && (
            <div className="notice danger" role="status" data-testid="hr-code-mismatch">
              <Icon name="alert" />
              <span>
                Rapordaki hasta kodu ({report.pid}) seçtiğiniz hastanın kodundan ({patient.code}) farklı. Doğru hastayı seçtiğinizden emin olun.
              </span>
            </div>
          )}
          {patient && report.rxCode && !rxExam && (
            <div className="notice" role="status" data-testid="hr-rx-mismatch">
              <Icon name="info" />
              <span>Rapordaki reçete kodu ({report.rxCode}) bu hastanın muayenelerindeki reçetelerle eşleşmiyor (başka cihazda ya da başka hekimce verilmiş olabilir).</span>
            </div>
          )}
          {patient && (
            <div className="field">
              <label htmlFor="hr-exam">Muayene</label>
              <select id="hr-exam" className="select" value={examChoice} onChange={(e) => setExamSel(e.target.value)} data-testid="hr-exam">
                <option value="new">Yeni kontrol muayenesi aç</option>
                {exams.map((e) => (
                  <option key={e.id} value={e.id}>
                    {formatDateTime(e.at)} · {e.diagnosis?.label ?? 'tanı girilmedi'}
                    {rxExam?.id === e.id ? ' · bu reçeteyi veren muayene' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button className="btn primary" onClick={attach} data-testid="hr-attach">
            <Icon name="plus" /> Ev dönemi olarak ekle
          </button>
          <p className="small muted">Rapor muayene raporunda ve HBYS notunda bir satır olarak görünür. Bağlantı yalnız bu telefonda saklanır.</p>
        </div>
      )}
    </Screen>
  );
}

/**
 * Bu tarayıcıda klinisyen kaydı yok (kullanıcı turu 4, k08). iPhone'da QR kamerayla okutulunca bağlantı Safari'de açılır;
 * ana ekrana eklenmiş uygulamanın kayıtları Safari'den ayrıdır. Burada klinisyen modunu açmak ikinci, boş bir kayıt açar:
 * önce bağlantıyı kopyalayıp uygulamadaki "Hastanın ev raporu" alanına yapıştırma yolu söylenir.
 */
function NoClinicianHere() {
  const [copied, setCopied] = useState<null | 'ok' | 'fail'>(null);
  // Uygulamanın kendisinde (ana ekrandan) açıldıysa kopyalama yolu anlamsızdır: yalnız klinisyen modunu açma.
  const standalone = isStandalone();
  const url = window.location.href;
  const copy = () => {
    const p = navigator.clipboard?.writeText(url);
    if (!p) {
      setCopied('fail');
      return;
    }
    p.then(
      () => setCopied('ok'),
      () => setCopied('fail')
    );
  };
  return (
    <div className="card stack" data-testid="hr-no-clinician">
      {!standalone && (
        <>
          <p data-testid="hr-copy-hint">
            <strong>DengeYol'u ana ekrandan kullanıyorsanız</strong> bağlantıyı kopyalayıp uygulamadaki "Hastanın ev raporu" alanına
            yapıştırın. Ana ekrandaki uygulamanın kayıtları bu tarayıcıdan ayrıdır; burada klinisyen modunu açarsanız hastalarınız iki
            yere bölünür.
          </p>
          <button className="btn primary block" onClick={copy} data-testid="hr-copy-link">
            <Icon name="copy" /> {copied === 'ok' ? 'Kopyalandı' : 'Bağlantıyı kopyala'}
          </button>
          {copied === 'fail' && (
            <>
              <p className="small muted">Kopyalanamadı; bağlantıyı aşağıdan seçip kopyalayın.</p>
              <input
                className="input small"
                readOnly
                value={url}
                onFocus={(e) => e.currentTarget.select()}
                aria-label="Rapor bağlantısı"
                data-testid="hr-link-text"
              />
            </>
          )}
        </>
      )}
      <p className="small">
        {standalone
          ? 'Raporu bir muayeneye eklemek için bu telefonda klinisyen modunu açın.'
          : 'Klinisyen kayıtlarınızı bu tarayıcıda tutuyorsanız ya da DengeYol bu telefonda yüklü değilse:'}
      </p>
      <button
        className={`btn ${standalone ? 'primary' : 'secondary'}`}
        onClick={() => store.update((x) => ({ ...x, settings: { ...x.settings, role: 'clinician' } }))}
        data-testid="hr-become-clinician"
      >
        Klinisyen modunda devam et
      </button>
    </div>
  );
}
