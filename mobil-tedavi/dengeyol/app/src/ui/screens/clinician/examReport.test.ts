import { describe, expect, it } from 'vitest';
import type { Finding, Findings } from '../../../core/diagnosis';
import { encodePrescription } from '../../../core/prescription';
import type { StepRecord } from '../../../core/runner';
import type { ClinicExam, ConfirmedDiagnosis, ManeuverLog } from '../../../state/types';
import {
  dxValid,
  examNoteText,
  findingsKeyOf,
  findingSummary,
  maneuverStatus,
  manualDxLabel,
  rxBlockReason,
  rxCurrent,
  rxValidUntil,
  shortDate,
  stepLines
} from './examReport';

const f = (p: Partial<Finding>): Finding => ({ nystagmus: 'none', latencySec: null, durationSec: null, intensity: 0, vertigo: false, ...p });

const T0 = new Date(2026, 9, 30, 10, 0, 0).getTime();

function exam(findings: Findings, dx?: Omit<ConfirmedDiagnosis, 'findingsKey'>, extra: Partial<ClinicExam> = {}): ClinicExam {
  return {
    id: 'e1',
    patientId: 'p1',
    at: T0,
    findings,
    diagnosis: dx ? { ...dx, findingsKey: findingsKeyOf(findings) } : undefined,
    maneuvers: [],
    retestFindings: {},
    ...extra
  };
}

function rec(p: Partial<StepRecord> & { stepId: string }): StepRecord {
  return {
    title: p.stepId,
    startedAt: 0,
    firstInRangeAt: 2000,
    reachedAt: 3000,
    endedAt: 40000,
    holdSec: 30,
    samples: 100,
    inRangeSamples: 90,
    sumAbsThetaErr: 500,
    maxAbsThetaErr: 12,
    thetaSamples: 100,
    vertigoMarks: [],
    transitionSec: null,
    manual: false,
    driftCount: 0,
    ...p
  };
}

const manualPC = (mechanism: ConfirmedDiagnosis['mechanism']): Omit<ConfirmedDiagnosis, 'findingsKey'> => ({
  canal: 'PC',
  side: 'R',
  mechanism,
  label: manualDxLabel('PC', 'R', mechanism),
  fromSuggestion: false
});

describe('bulgu imzası', () => {
  it('eski kayıtların imzası değişmez (yeni alan yoksa eski algoritmayla aynı)', () => {
    const fx: Findings = { dhR: f({ nystagmus: 'upbeat-torsional', latencySec: 3, durationSec: 20 }), dhL: f({}) };
    const old = JSON.stringify(Object.keys(fx).sort().map((k) => [k, fx[k as 'dhR']]));
    expect(findingsKeyOf(fx)).toBe(old);
  });

  it('serbest not ve gözlem yöntemi tanıyı geçersiz kılmaz; torsiyon kılar', () => {
    const base: Findings = { dhR: f({ nystagmus: 'upbeat-torsional', latencySec: 3, durationSec: 20 }) };
    const k = findingsKeyOf(base);
    expect(findingsKeyOf({ dhR: { ...base.dhR!, note: 'VNG kaydı 12', method: 'VNG' } })).toBe(k);
    expect(findingsKeyOf({ dhR: { ...base.dhR!, torsionToward: 'R' } })).not.toBe(k);
  });
});

describe('ev reçetesi kilidi bulguya da bakar', () => {
  const long: Findings = { dhR: f({ nystagmus: 'upbeat-torsional', latencySec: 1, durationSec: 75 }), dhL: f({}) };
  const typical: Findings = { dhR: f({ nystagmus: 'upbeat-torsional', latencySec: 3, durationSec: 20 }), dhL: f({}) };

  it('elle "kanalolitiazis" tanısı ≥60 s bulguda reçeteyi açmaz', () => {
    const e = exam(long, manualPC('canalithiasis'));
    expect(dxValid(e)).toBe(true);
    expect(rxBlockReason(e)).toMatch(/75 s.*≥1 dk/);
  });

  it('tipik bulgu + elle kanalolitiazis → reçete verilebilir', () => {
    expect(rxBlockReason(exam(typical, manualPC('canalithiasis')))).toBeNull();
  });

  it('elle kupulolitiazis tanısı her durumda kilitler', () => {
    expect(rxBlockReason(exam(typical, manualPC('cupulolithiasis')))).toMatch(/Kupulolitiazis/);
  });

  it('tekrar testteki ≥1 dk yanıt da kilitler', () => {
    const e = exam(typical, manualPC('canalithiasis'), { retestFindings: { dhR: f({ nystagmus: 'upbeat-torsional', latencySec: 1, durationSec: 65 }) } });
    expect(rxBlockReason(e)).toMatch(/^Tekrar test/);
  });

  it('reçeteden sonra kilit doğarsa reçete güncel sayılmaz, nota yazılmaz', () => {
    const token = encodePrescription({ v: 1, side: 'R', canal: 'PC', maneuver: 'epley', date: '2026-10-30', perDay: 3, days: 3 });
    const e = exam(typical, manualPC('canalithiasis'), { prescriptionToken: token });
    e.prescriptionFindingsKey = e.diagnosis!.findingsKey;
    expect(rxCurrent(e)).toBe(true);
    e.retestFindings = { dhR: f({ nystagmus: 'upbeat-torsional', latencySec: 1, durationSec: 65 }) };
    expect(rxCurrent(e)).toBe(false);
    expect(examNoteText(e, undefined, {})).not.toMatch(/Ev reçetesi:/);
  });

  it('tanı yoksa / bayatsa / yatay kanalsa eski kilitler korunur', () => {
    expect(rxBlockReason(exam(typical))).toMatch(/önce Tanı/);
    const stale = exam(typical, manualPC('canalithiasis'));
    stale.findings = long;
    expect(rxBlockReason(stale)).toMatch(/yeniden onaylayın/);
    expect(rxBlockReason(exam(typical, { ...manualPC('canalithiasis'), canal: 'HC', label: 'x' }))).toMatch(/yalnızca arka kanal/);
  });
});

describe('manevra adımları', () => {
  const m = (records: StepRecord[], completed = true, protocolId: ManeuverLog['protocolId'] = 'epley'): ManeuverLog => ({
    id: 'm1',
    at: T0,
    protocolId,
    side: 'R',
    completed,
    stopReason: null,
    records,
    manual: false
  });

  it('pozisyona gelip ~1 s içinde bitirilen adım "erken bitirildi"; manevra "kısaltılmış"', () => {
    const log = m([rec({ stepId: 'ep-1', holdSec: 30 }), rec({ stepId: 'ep-2', holdSec: 0.8 }), rec({ stepId: 'ep-3', holdSec: 30 })]);
    const lines = stepLines(log);
    expect(lines.map((l) => l.early)).toEqual([false, true, false]);
    expect(lines[1]!.targetSec).toBe(30);
    expect(maneuverStatus(log)).toMatch(/kısaltılmış \(1 adım/);
  });

  it('yarıda kalan manevranın son adımı erken sayılmaz', () => {
    const log = m([rec({ stepId: 'ep-1', holdSec: 30 }), rec({ stepId: 'ep-2', holdSec: 0.2 })], false);
    expect(stepLines(log).some((l) => l.early)).toBe(false);
    expect(maneuverStatus(log)).toBe('yarıda kaldı');
  });

  it('θ istatistiği; φ alanları kayıtta varsa gösterilir, yoksa null', () => {
    const plain = stepLines(m([rec({ stepId: 'ep-1' })]))[0]!;
    expect(plain.theta).toEqual({ mean: 5, max: 12 });
    expect(plain.phi).toBeNull();
    const withPhi = { ...rec({ stepId: 'ep-1' }), sumAbsPhiErr: 400, maxAbsPhiErr: 9.04, phiSamples: 100 };
    expect(stepLines(m([withPhi]))[0]!.phi).toEqual({ mean: 4, max: 9 });
  });

  it('Semont geçiş süresi ve manevra sırasındaki nistagmus işaretleri', () => {
    const lines = stepLines(
      m([rec({ stepId: 'se-1', vertigoMarks: [{ start: 5, end: 20 }] }), rec({ stepId: 'se-2', transitionSec: 4.12 })], true, 'semont')
    );
    expect(lines[0]!.nystagmus).toBe('nistagmus gecikme 3 s, süre 15 s');
    expect(lines[1]!.transitionSec).toBe(4.1);
    expect(lines[1]!.fastTargetSec).toBe(2);
  });
});

describe('HBYS notu', () => {
  it('her test ayrı satırda; elle tanıda mekanizma ve öneri satırı; reçete geçerlilik bitişi', () => {
    const fx: Findings = {
      dhR: f({ nystagmus: 'upbeat-torsional', latencySec: 3, durationSec: 20, torsionToward: 'R', method: 'VNG', note: 'yorgun hasta' }),
      dhL: f({ method: 'VNG' })
    };
    const token = encodePrescription({ v: 1, side: 'R', canal: 'PC', maneuver: 'epley', date: '2026-10-30', perDay: 3, days: 3 });
    const e = exam(fx, { ...manualPC('canalithiasis'), suggestedLabels: ['Sağ arka kanal BPPV (kanalolitiazis)'] }, {
      prescriptionToken: token,
      maneuvers: [
        {
          id: 'm1',
          at: T0,
          protocolId: 'epley',
          side: 'R',
          completed: true,
          stopReason: null,
          records: [rec({ stepId: 'ep-1', title: 'Sağ sarkık' }), rec({ stepId: 'ep-2', title: 'Sola dönüş', holdSec: 0.5 })],
          manual: false
        }
      ]
    });
    e.prescriptionFindingsKey = e.diagnosis!.findingsKey;
    const text = examNoteText(e, 'NO-2611', { name: 'Dr. Test' });
    const lines = text.split('\n');
    expect(lines).toContain('Gözlem yöntemi: VNG.');
    expect(lines.some((l) => l.startsWith('- Sağ Dix-Hallpike: Yukarı vuran + torsiyonel · gecikme 3 s · süre 20 s · torsiyon sağ kulağa'))).toBe(true);
    expect(lines.some((l) => l.startsWith('- Sol Dix-Hallpike: Negatif'))).toBe(true);
    expect(text).toMatch(/Tanı: Sağ arka kanal BPPV — kanalolitiazis \(elle\) — klinisyen girişi/);
    expect(text).toMatch(/Karar desteği önerisi: Sağ arka kanal BPPV \(kanalolitiazis\)\. Klinisyen tanıyı elle girdi\./);
    expect(text).toMatch(/Epley sağ — kısaltılmış \(1 adım erken bitirildi\)/);
    expect(lines.some((l) => /^ {2}2\. Sola dönüş: 1\/30 s · ERKEN BİTİRİLDİ/.test(l))).toBe(true);
    expect(text).toMatch(/θ sapma ort\. 5° \/ en çok 12°/);
    expect(text).toMatch(/13\.11\.2026 tarihine kadar/);
    expect(text).toMatch(/reçete kodu [0-9a-f]{8}/);
  });

  it('bulgu kilidi notta yazılır', () => {
    const e = exam({ dhR: f({ nystagmus: 'upbeat-torsional', latencySec: 1, durationSec: 75 }) }, manualPC('canalithiasis'));
    expect(examNoteText(e, undefined, {})).toMatch(/Ev reçetesi kilidi: Sağ Dix-Hallpike: nistagmus 75 s/);
  });
});

describe('yardımcılar', () => {
  it('reçete geçerlilik bitişi: muayene + 14 gün (takvim günü)', () => {
    expect(shortDate(rxValidUntil('2026-10-30')!)).toBe('13.11.2026');
    expect(shortDate(rxValidUntil('2026-03-20')!)).toBe('03.04.2026');
    expect(rxValidUntil('bozuk')).toBeNull();
  });

  it('elle tanı etiketi mekanizmayı içerir', () => {
    expect(manualDxLabel('PC', 'L', 'cupulolithiasis')).toBe('Sol arka kanal BPPV — kupulolitiazis (elle)');
    expect(manualDxLabel('HC', null, 'unknown')).toBe('yatay kanal BPPV — mekanizma belirsiz (elle)');
  });

  it('tam bulgu özeti ek alanları yazar', () => {
    const s = findingSummary(
      f({ nystagmus: 'upbeat-torsional', latencySec: 2, durationSec: 15, fatigue: true, reversalOnSitting: false, method: 'Frenzel', note: 'n' }),
      true
    );
    expect(s).toMatch(/yorulma var · oturunca ters nistagmus yok · gözlem: Frenzel · not: n/);
    expect(findingSummary(f({ nystagmus: 'upbeat-torsional', fatigue: true }))).not.toMatch(/yorulma/);
  });
});
