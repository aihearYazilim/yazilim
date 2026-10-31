import { describe, expect, it } from 'vitest';
import type { Finding, Findings } from '../../../core/diagnosis';
import { encodePrescription, rxValidUntil } from '../../../core/prescription';
import type { StepRecord } from '../../../core/runner';
import { RX_VALID_DAYS } from '../../../state/episodes';
import type { ClinicExam, ConfirmedDiagnosis, ManeuverLog } from '../../../state/types';
import {
  defaultObservationMethod,
  dxValid,
  examNoteText,
  findingsKeyOf,
  findingSummary,
  maneuverLineText,
  maneuverStatus,
  manualDxLabel,
  methodHeader,
  primaryMethod,
  rxBlockReason,
  rxCurrent,
  rxLastValidDay,
  rxValidityText,
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
    const withPhi = { ...rec({ stepId: 'ep-1' }), sumPhi: 2500, minPhi: 18.04, phiSamples: 100 };
    expect(stepLines(m([withPhi]))[0]!.phi).toEqual({ mean: 25, min: 18 });
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

const log = (records: StepRecord[], p: Partial<ManeuverLog> = {}): ManeuverLog => ({
  id: 'm1',
  at: T0,
  protocolId: 'epley',
  side: 'R',
  completed: true,
  stopReason: null,
  records,
  manual: false,
  ...p
});

describe('HBYS notu (kısa)', () => {
  const token = encodePrescription({ v: 1, side: 'R', canal: 'PC', maneuver: 'epley', date: '2026-10-30', perDay: 3, days: 3 });
  const fx: Findings = {
    dhR: f({ nystagmus: 'upbeat-torsional', latencySec: 3, durationSec: 20, torsionToward: 'R', method: 'VNG', note: 'yorgun hasta' }),
    dhL: f({ method: 'VNG' })
  };
  const build = () => {
    const e = exam(fx, { ...manualPC('canalithiasis'), suggestedLabels: ['Sağ arka kanal BPPV (kanalolitiazis)'] }, {
      prescriptionToken: token,
      maneuvers: [log([rec({ stepId: 'ep-1', title: 'Sağ sarkık' }), rec({ stepId: 'ep-2', title: 'Sola dönüş', holdSec: 0.5 })])]
    });
    e.prescriptionFindingsKey = e.diagnosis!.findingsKey;
    return examNoteText(e, 'NO-2611', { name: 'Dr. Test' });
  };

  it('başlık, test başına bir satır, tanı + karar desteği, manevra ve reçete birer satır', () => {
    const text = build();
    const lines = text.split('\n');
    expect(lines[0]).toMatch(/^Pozisyonel vertigo değerlendirmesi \(DengeYol\) — .* — hasta kodu NO-2611$/);
    expect(lines.some((l) => l.startsWith('- Sağ Dix-Hallpike: Yukarı vuran + torsiyonel · gecikme 3 s · süre 20 s · torsiyon sağ kulağa'))).toBe(true);
    expect(lines.some((l) => l.startsWith('- Sol Dix-Hallpike: Negatif'))).toBe(true);
    expect(text).toMatch(/Tanı: Sağ arka kanal BPPV — kanalolitiazis \(elle\) — klinisyen girişi/);
    expect(text).toMatch(/Karar desteği önerisi: Sağ arka kanal BPPV \(kanalolitiazis\)\. Klinisyen tanıyı elle girdi\./);
    // Manevra tek satır: ad, taraf, durum, adım süreleri, nistagmus özeti.
    expect(lines).toContain('- Epley sağ: kısaltılmış (1 adım erken bitirildi) · adım süreleri 30, 1 (erken) s · nistagmus işaretlenmedi');
    expect(lines.filter((l) => /^ {2}/.test(l))).toEqual([]);
    // Reçete tek satır: kod ve son geçerli gün ("dahil").
    const rxLines = lines.filter((l) => l.startsWith('Ev reçetesi:'));
    expect(rxLines).toHaveLength(1);
    expect(rxLines[0]).toMatch(/reçete kodu [0-9a-f]{8}/);
    expect(rxLines[0]).toContain(`Geçerlilik: ${RX_VALID_DAYS} gün, ${shortDate(rxLastValidDay('2026-10-30')!)} dahil`);
    expect(rxLines[0]).toMatch(/testsiz kısa yol/);
    expect(lines[lines.length - 1]).toBe('Dr. Test');
  });

  it('açı istatistikleri HBYS notunda yok (yalnız basılı raporda)', () => {
    const text = build();
    expect(text).not.toMatch(/θ|φ|sapma|hedefte %/);
    expect(text.split('\n').length).toBeLessThanOrEqual(12);
  });

  it('gözlem yöntemi bir kez yazılır; test satırında tekrar etmez', () => {
    const lines = build().split('\n');
    expect(lines.filter((l) => /VNG/.test(l))).toEqual(['Gözlem yöntemi: VNG.']);
    expect(lines.some((l) => /gözlem:/.test(l))).toBe(false);
  });

  it('farklı yöntem kullanılan test kendi satırında belirtilir', () => {
    const mixed: Findings = {
      dhR: f({ nystagmus: 'upbeat-torsional', latencySec: 3, durationSec: 20, method: 'VNG' }),
      dhL: f({ method: 'Frenzel' }),
      rollR: f({ method: 'VNG' })
    };
    expect(primaryMethod(mixed)).toBe('VNG');
    expect(methodHeader(mixed)).toMatch(/^Gözlem yöntemi: VNG \(farklı yöntem/);
    const lines = examNoteText(exam(mixed), undefined, {}).split('\n');
    expect(lines.find((l) => l.startsWith('- Sol Dix-Hallpike'))).toMatch(/gözlem: Frenzel/);
    expect(lines.find((l) => l.startsWith('- Sağ Dix-Hallpike'))).not.toMatch(/gözlem:/);
  });

  it('bulgu kilidi notta yazılır', () => {
    const e = exam({ dhR: f({ nystagmus: 'upbeat-torsional', latencySec: 1, durationSec: 75 }) }, manualPC('canalithiasis'));
    expect(examNoteText(e, undefined, {})).toMatch(/Ev reçetesi kilidi: Sağ Dix-Hallpike: nistagmus 75 s/);
  });
});

describe('manevra satırı', () => {
  it('nistagmus işaretleri adım numarasıyla; yavaş Semont geçişi belirtilir', () => {
    const t = maneuverLineText(
      log([rec({ stepId: 'se-1', vertigoMarks: [{ start: 5, end: 20 }] }), rec({ stepId: 'se-2', transitionSec: 4.12 })], { protocolId: 'semont' })
    );
    expect(t).toMatch(/^Semont sağ: tamamlandı · adım süreleri 30, 30 s · yavaş geçiş 4\.1 s \(hedef <2 s\) · nistagmus: 1\. adımda gecikme 3 s, süre 15 s$/);
  });

  it('yarıda kalan manevra durma nedeni ve tamamlanan adım sayısıyla', () => {
    const t = maneuverLineText(log([rec({ stepId: 'ep-1' })], { completed: false, stopReason: 'POSITION_UNREACHABLE', manual: true }));
    expect(t).toMatch(/^Epley sağ: durduruldu: pozisyona gelinemedi \(1\/\d+ adım\) · adım süreleri 30 s · elle onaylı · nistagmus işaretlenmedi$/);
  });
});

describe('gözlem yöntemi varsayılanı', () => {
  const e1 = exam({ dhR: f({ method: 'Frenzel' }) }, undefined, { id: 'old', at: T0 - 86_400_000 });
  const cur = exam({}, undefined, { id: 'cur' });

  it('muayenedeki son yöntem > profil > önceki muayene', () => {
    expect(defaultObservationMethod({ ...cur, findings: { dhR: f({ method: 'çıplak göz' }) } }, 'VNG', [e1])).toBe('çıplak göz');
    expect(defaultObservationMethod(cur, 'VNG', [e1, cur])).toBe('VNG');
    expect(defaultObservationMethod(cur, undefined, [e1, cur])).toBe('Frenzel');
    expect(defaultObservationMethod(cur, undefined, [cur])).toBeUndefined();
  });
});

describe('yardımcılar', () => {
  it('son geçerli gün: hasta tarafındaki bitiş anından hemen önceki takvim günü ("dahil")', () => {
    for (const date of ['2026-10-30', '2026-03-20', '2026-10-17']) {
      const until = rxValidUntil({ date }, RX_VALID_DAYS)!;
      const last = rxLastValidDay(date)!;
      const nextDay = new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1).getTime();
      expect(last.getTime()).toBeLessThan(until);
      expect(nextDay).toBeGreaterThanOrEqual(until);
    }
    expect(rxValidityText('2026-10-30')).toMatch(/^Geçerlilik: 14 gün, \d\d\.\d\d\.2026 dahil\. Testsiz kısa yol/);
    expect(rxLastValidDay('bozuk')).toBeNull();
  });

  it('elle tanı etiketi mekanizmayı içerir', () => {
    expect(manualDxLabel('PC', 'L', 'cupulolithiasis')).toBe('Sol arka kanal BPPV — kupulolitiazis (elle)');
    expect(manualDxLabel('HC', null, 'unknown')).toBe('yatay kanal BPPV — mekanizma belirsiz (elle)');
  });

  it('tam bulgu özeti ek alanları yazar; başlıktaki yöntem satırda tekrar etmez', () => {
    const full = f({ nystagmus: 'upbeat-torsional', latencySec: 2, durationSec: 15, fatigue: true, reversalOnSitting: false, method: 'Frenzel', note: 'n' });
    expect(findingSummary(full, true)).toMatch(/yorulma var · oturunca ters nistagmus yok · gözlem: Frenzel · not: n/);
    expect(findingSummary(full, true, 'Frenzel')).toMatch(/oturunca ters nistagmus yok · not: n$/);
    expect(findingSummary(f({ nystagmus: 'upbeat-torsional', fatigue: true }))).not.toMatch(/yorulma/);
  });
});
