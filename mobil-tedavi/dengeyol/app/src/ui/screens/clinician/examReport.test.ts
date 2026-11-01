import { describe, expect, it } from 'vitest';
import type { Finding, Findings } from '../../../core/diagnosis';
import { encodePrescription, rxCode, rxValidUntil } from '../../../core/prescription';
import { decodeHomeReport, encodeHomeReport, type HomeEpisode, type HomeReport } from '../../../core/reportShare';
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
  homeContraText,
  homeEpisodeTitle,
  homeMatchCode,
  homeNeuroAckText,
  homeOverrideCount,
  homeRedFlagText,
  homeReportAdvice,
  homeResearchEntries,
  homeResearchNote,
  homeSideTestText,
  homeLastOutcomeText,
  homeManeuverFlags,
  homeManeuverText,
  homeOpenEpisodeText,
  homePeriodText,
  homeReportHeadline,
  looksLikeRxLink,
  reportPasteErrorText,
  homeReportNoteLine,
  homeStepText,
  homeTestStopText,
  homeTestStopsShort,
  homeTruncationText,
  methodHeader,
  primaryMethod,
  rxBlockReason,
  rxCurrent,
  rxLastValidDay,
  rxOverrideCovers,
  rxOverrideLine,
  rxWarning,
  RX_REASON_MIN,
  RX_WARN_PATIENT_LABEL,
  rxValidityText,
  shortDate,
  stepFlagLabels,
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

describe('ev reçetesi uyarısı (eski kilit) bulguya da bakar', () => {
  const long: Findings = { dhR: f({ nystagmus: 'upbeat-torsional', latencySec: 1, durationSec: 75 }), dhL: f({}) };
  const typical: Findings = { dhR: f({ nystagmus: 'upbeat-torsional', latencySec: 3, durationSec: 20 }), dhL: f({}) };
  const token = encodePrescription({ v: 1, side: 'R', canal: 'PC', maneuver: 'epley', date: '2026-10-30', perDay: 3, days: 3 });

  it('elle "kanalolitiazis" tanısı ≥60 s bulguda uyarıyı kaldırmaz; artık kilit değil', () => {
    const e = exam(long, manualPC('canalithiasis'));
    expect(dxValid(e)).toBe(true);
    expect(rxBlockReason(e)).toBeNull();
    const w = rxWarning(e);
    expect(w?.kind).toBe('RX_LONG_RESPONSE');
    expect(w?.message).toMatch(/75 s.*≥1 dk/);
    expect(w?.message).toMatch(/yine de reçete verebilirsiniz/);
  });

  it('tipik bulgu + elle kanalolitiazis → uyarısız reçete', () => {
    const e = exam(typical, manualPC('canalithiasis'));
    expect(rxBlockReason(e)).toBeNull();
    expect(rxWarning(e)).toBeNull();
  });

  it('elle kupulolitiazis tanısı uyarı doğurur (RX_CUPULOLITHIASIS)', () => {
    const w = rxWarning(exam(typical, manualPC('cupulolithiasis')));
    expect(w?.kind).toBe('RX_CUPULOLITHIASIS');
    expect(w?.message).toMatch(/Kupulolitiazis/);
  });

  it('tekrar testteki ≥1 dk yanıt da uyarı doğurur', () => {
    const e = exam(typical, manualPC('canalithiasis'), { retestFindings: { dhR: f({ nystagmus: 'upbeat-torsional', latencySec: 1, durationSec: 65 }) } });
    expect(rxWarning(e)?.message).toMatch(/^Tekrar test/);
  });

  it('çok kanallı tutulum uyarısı (RX_MULTI_CANAL)', () => {
    const e = exam({
      dhR: f({ nystagmus: 'upbeat-torsional', latencySec: 3, durationSec: 20 }),
      dhL: f({}),
      rollR: f({ nystagmus: 'horizontal-geotropic', intensity: 3, durationSec: 30 }),
      rollL: f({ nystagmus: 'horizontal-geotropic', intensity: 1, durationSec: 20 })
    }, manualPC('canalithiasis'));
    expect(rxWarning(e)?.kind).toBe('RX_MULTI_CANAL');
  });

  it('tanı yoksa uyarı (RX_NO_DIAGNOSIS); taraf yoksa RX_NO_SIDE', () => {
    expect(rxBlockReason(exam(typical))).toBeNull();
    expect(rxWarning(exam(typical))?.kind).toBe('RX_NO_DIAGNOSIS');
    expect(rxWarning(exam(typical, { ...manualPC('canalithiasis'), side: null }))?.kind).toBe('RX_NO_SIDE');
  });

  it('yalnız bayat tanı kesin engel olarak kalır (tutarlılık); yatay kanal reçete alır, ön kanal uyarıdır', () => {
    const stale = exam(typical, manualPC('canalithiasis'));
    stale.findings = long;
    expect(rxBlockReason(stale)).toMatch(/yeniden onaylayın/);
    // Yatay kanal tanısı artık reçete alır (BBQ roll; kullanıcı turu yeni-1, L4-1).
    const hc = exam(typical, { ...manualPC('canalithiasis'), canal: 'HC', label: 'x' });
    expect(rxBlockReason(hc)).toBeNull();
    expect(rxWarning(hc)).toBeNull();
    // Ön kanal: kilit değil, uyarı + gerekçe (kanal klinisyence seçilir).
    const ac = exam(typical, { ...manualPC('unknown'), canal: 'AC', label: 'x' });
    expect(rxBlockReason(ac)).toBeNull();
    expect(rxWarning(ac)?.kind).toBe('RX_CANAL');
    expect(rxWarning(ac)?.message).toMatch(/ön kanal/);
    expect(rxWarning(exam(typical, { ...manualPC('unknown'), canal: null, label: 'x' }))?.kind).toBe('RX_CANAL');
  });

  it('reçeteden sonra yeni uyarı doğarsa reçete güncel sayılmaz, nota yazılmaz', () => {
    const e = exam(typical, manualPC('canalithiasis'), { prescriptionToken: token });
    e.prescriptionFindingsKey = e.diagnosis!.findingsKey;
    expect(rxCurrent(e)).toBe(true);
    e.retestFindings = { dhR: f({ nystagmus: 'upbeat-torsional', latencySec: 1, durationSec: 65 }) };
    expect(rxCurrent(e)).toBe(false);
    expect(examNoteText(e, undefined, {})).not.toMatch(/Ev reçetesi:/);
    expect(examNoteText(e, undefined, {})).toMatch(/Ev reçetesi uyarısı: Tekrar test/);
  });

  it('uyarıya rağmen reçete: gerekçe aynı neden için kayıtlıysa reçete güncel; HBYS notunda "Uyarıya rağmen reçete"', () => {
    const e = exam(long, manualPC('canalithiasis'), { prescriptionToken: token });
    e.prescriptionFindingsKey = e.diagnosis!.findingsKey;
    expect(rxCurrent(e)).toBe(false);
    expect(rxOverrideLine(e)).toBeNull();
    e.rxOverride = { at: T0, kind: 'RX_LONG_RESPONSE', reason: 'Hasta kliniğe gelemiyor; telefonla izlenecek.' };
    expect(rxOverrideCovers(e)).toBe(true);
    expect(rxCurrent(e)).toBe(true);
    expect(rxOverrideLine(e)).toBe('Uyarıya rağmen reçete: Hasta kliniğe gelemiyor; telefonla izlenecek (uyarı: ≥1 dk nistagmus).');
    const note = examNoteText(e, undefined, {});
    const lines = note.split('\n');
    const i = lines.findIndex((l) => l.startsWith('Ev reçetesi:'));
    expect(i).toBeGreaterThan(-1);
    expect(lines[i + 1]).toBe('Uyarıya rağmen reçete: Hasta kliniğe gelemiyor; telefonla izlenecek (uyarı: ≥1 dk nistagmus).');
  });

  it('gerekçe başka bir neden içinse ya da boşsa uyarıyı karşılamaz', () => {
    const e = exam(long, manualPC('canalithiasis'), { prescriptionToken: token, rxOverride: { at: T0, kind: 'RX_NO_DIAGNOSIS', reason: 'x' } });
    e.prescriptionFindingsKey = e.diagnosis!.findingsKey;
    expect(rxOverrideCovers(e)).toBe(false);
    expect(rxCurrent(e)).toBe(false);
    e.rxOverride = { at: T0, kind: 'RX_LONG_RESPONSE', reason: '   ' };
    expect(rxOverrideCovers(e)).toBe(false);
  });

  it('yatay kanal reçetesi: tanıyla aynı kanal ve tarafsa güncel; HBYS notunda "sağ BBQ roll (yatay kanal)"', () => {
    const roll: Findings = {
      rollR: f({ nystagmus: 'horizontal-geotropic', latencySec: 2, durationSec: 30, intensity: 3 }),
      rollL: f({ nystagmus: 'horizontal-geotropic', latencySec: 2, durationSec: 20, intensity: 1 })
    };
    const dx = { canal: 'HC' as const, side: 'R' as const, mechanism: 'canalithiasis' as const, label: 'Sağ yatay kanal BPPV — geotropik (kanalolitiazis)', fromSuggestion: true };
    const hcToken = encodePrescription({ v: 1, side: 'R', canal: 'HC', maneuver: 'bbq-roll', date: '2026-10-30', perDay: 2, days: 3 });
    const e = exam(roll, dx, { prescriptionToken: hcToken });
    e.prescriptionFindingsKey = e.diagnosis!.findingsKey;
    expect(rxWarning(e)).toBeNull();
    expect(rxCurrent(e)).toBe(true);
    expect(examNoteText(e, undefined, {})).toMatch(/^Ev reçetesi: sağ BBQ roll \(yatay kanal\), günde en fazla 2, 3 gün/m);
    // Arka kanal reçetesi yatay kanal tanısına dayanmaz.
    const pc = exam(roll, dx, { prescriptionToken: token, prescriptionFindingsKey: findingsKeyOf(roll) });
    expect(rxCurrent(pc)).toBe(false);
  });

  it('santral örüntü: saf aşağı vuran nistagmus tanıdan önce gelir, bulguyu adıyla söyler (RX_CENTRAL); HBYS notuna girer', () => {
    const central: Findings = { dhR: f({ nystagmus: 'downbeat-pure', latencySec: 0, durationSec: 30 }), dhL: f({ nystagmus: 'downbeat-pure', latencySec: 0, durationSec: 30 }) };
    const w = rxWarning(exam(central));
    expect(w?.kind).toBe('RX_CENTRAL');
    expect(w?.title).toMatch(/Santral örüntü: saf aşağı vuran nistagmus/);
    expect(w?.message).toMatch(/^Sağ Dix-Hallpike: saf aşağı vuran nistagmus; Sol Dix-Hallpike: saf aşağı vuran nistagmus\. Santral/);
    expect(RX_WARN_PATIENT_LABEL.CENTRAL).toMatch(/beyin kaynaklı/);
    // Atipik desen de santral.
    expect(rxWarning(exam({ dhR: f({ nystagmus: 'other', durationSec: 10 }) }, manualPC('canalithiasis')))?.kind).toBe('RX_CENTRAL');
    const note = examNoteText(exam(central), undefined, {});
    expect(note).toMatch(/Santral örüntü: Sağ Dix-Hallpike: saf aşağı vuran nistagmus/);
    // Uyarıya rağmen reçete: gerekçe kaydı ve HBYS satırı.
    const e = exam(central, undefined, {
      prescriptionToken: token,
      prescriptionFindingsKey: findingsKeyOf(central),
      rxOverride: { at: T0, kind: 'RX_CENTRAL', reason: 'MR randevusu verildi, hasta takipte' }
    });
    expect(rxCurrent(e)).toBe(true);
    expect(rxOverrideLine(e)).toBe('Uyarıya rağmen reçete: MR randevusu verildi, hasta takipte (uyarı: santral örüntü).');
    expect(RX_REASON_MIN).toBe(10);
  });

  it('tanısız reçete: bulgu imzasına bağlı; bulgu değişirse ya da başka tarafa tanı onaylanırsa güncel değil', () => {
    const e = exam(typical, undefined, {
      prescriptionToken: token,
      prescriptionFindingsKey: findingsKeyOf(typical),
      rxOverride: { at: T0, kind: 'RX_NO_DIAGNOSIS', reason: 'Klinik bulgu net, tanı sonra girilecek' }
    });
    expect(rxCurrent(e)).toBe(true);
    expect(rxOverrideLine(e)).toMatch(/^Uyarıya rağmen reçete: Klinik bulgu net, tanı sonra girilecek \(uyarı: onaylı tanı yok\)\.$/);
    expect(rxCurrent({ ...e, findings: long })).toBe(false);
    // Sol tarafa tanı onaylandı: sağ reçete o tanıya dayanmaz (uyarı da kalktı).
    const left = { ...e, diagnosis: { ...manualPC('canalithiasis'), side: 'L' as const, findingsKey: findingsKeyOf(typical) } };
    expect(rxCurrent(left)).toBe(false);
    // Aynı tarafa tanı onaylandı: uyarı kalkar, reçete güncel kalır.
    const right = { ...e, diagnosis: { ...manualPC('canalithiasis'), findingsKey: findingsKeyOf(typical) } };
    expect(rxWarning(right)).toBeNull();
    expect(rxCurrent(right)).toBe(true);
    expect(rxOverrideLine(right)).toBeNull();
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

  it('adım işaretleri rapor tablosu için etiketlenir (sınırda, oturuştan geçilmedi, komuttan önce, yanlış taraf)', () => {
    const lines = stepLines(
      m(
        [
          rec({ stepId: 'se-sit' }),
          rec({ stepId: 'se-1', movedBeforeCommand: true, borderline: true }),
          rec({ stepId: 'se-2', noSitThrough: true }),
          rec({ stepId: 'se-3', wrongSide: true })
        ],
        true,
        'semont'
      )
    );
    expect(lines.map((l) => l.flags)).toEqual([[], ['komuttan önce hareket', 'hedef sınırında'], ['oturuştan geçilmedi'], ['önce yanlış taraf']]);
    expect(stepFlagLabels({})).toEqual([]);
  });

  it('yüzüstünden gelinen adımda "önce yanlış taraf" yerine "yüzüstünden gelme reddedildi" (tur 5, k10)', () => {
    const recs = [rec({ stepId: 'ep-sit' }), rec({ stepId: 'ep-1' }), rec({ stepId: 'ep-2', wrongSide: true }), rec({ stepId: 'ep-3', wrongSide: true, proneArrival: true, borderline: true })];
    const lines = stepLines(m(recs));
    expect(lines.map((l) => l.flags)).toEqual([[], [], ['önce yanlış taraf'], ['yüzüstünden gelme reddedildi', 'hedef sınırında']]);
    const text = maneuverLineText(m(recs));
    expect(text).toContain('3. adımda önce yanlış taraf; 4. adımda yüzüstünden gelme reddedildi; 4. adım hedef sınırında');
    expect(text).not.toContain('4. adımda önce yanlış taraf');
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

  it('bulgu uyarısı notta yazılır (ekrandaki "yine de reçete" cümlesi olmadan)', () => {
    const e = exam({ dhR: f({ nystagmus: 'upbeat-torsional', latencySec: 1, durationSec: 75 }) }, manualPC('canalithiasis'));
    expect(examNoteText(e, undefined, {})).toMatch(/Ev reçetesi uyarısı: Sağ Dix-Hallpike: nistagmus 75 s.*klinikte yapmanız önerilir\.$/m);
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

describe('ev dönemi raporu (klinisyen metinleri ve HBYS satırı)', () => {
  const MIN = 60_000;
  const S = new Date(2026, 9, 31, 9, 0).getTime();
  const rxToken = encodePrescription({ v: 2, side: 'R', canal: 'PC', maneuver: 'epley', date: '2026-10-31', perDay: 3, days: 5, pid: 'NO-2611' });
  const report = (p: Partial<HomeReport> = {}): HomeReport => ({
    v: 1,
    generatedAt: S + 5 * 24 * 60 * MIN,
    pid: 'NO-2611',
    rxCode: rxCode(rxToken),
    period: { from: new Date(2026, 9, 31).getTime(), to: new Date(2026, 10, 13, 23, 59).getTime() },
    episodes: [
      {
        startedAt: S,
        status: 'resolved',
        side: 'R',
        sideTests: [
          {
            at: S + 5 * MIN,
            R: { vertigo: true, latencySec: 3, durationSec: 20, safetyStopped: false },
            L: { vertigo: false, latencySec: null, durationSec: null, safetyStopped: false },
            decision: { kind: 'TREAT', side: 'R', note: null }
          }
        ],
        maneuvers: [
          {
            at: S + 10 * MIN,
            protocolId: 'semont',
            side: 'R',
            completed: true,
            stopReason: null,
            pauses: 1,
            assisted: true,
            manual: false,
            afterSymptoms: 'none',
            stepCount: 4,
            steps: [
              { index: 0, title: 'a', holdSec: 5, flags: [], transitionSec: null, vertigo: null },
              { index: 1, title: 'b', holdSec: 60, flags: ['slowTransition', 'movedBeforeCommand'], transitionSec: 4.1, vertigo: { latencySec: 2, durationSec: 15, marks: 1 } },
              { index: 2, title: 'c', holdSec: 60, flags: ['noSitThrough'], transitionSec: null, vertigo: null }
            ]
          },
          { at: S + 60 * MIN, protocolId: 'epley', side: 'R', completed: false, stopReason: 'USER_ABORT', pauses: 0, manual: true, stepCount: 2, steps: null }
        ],
        retests: [{ at: S + 22 * 60 * MIN, kind: 'morning', side: 'R', vertigo: false, latencySec: null, durationSec: null }]
      }
    ],
    stepsDropped: false,
    episodesOmitted: 0,
    maneuversOmitted: 0,
    ...p
  });

  it('manevra, adım ve sonuç satırları okunur Türkçe', () => {
    const r = report();
    expect(homeManeuverText(r.episodes[0]!.maneuvers[0]!)).toBe('Semont sağ: tamamlandı (4/4 adım) · yakını yaptırdı · 1 kez duraklatıldı · sonrası: iyi');
    expect(homeManeuverText(r.episodes[0]!.maneuvers[1]!)).toMatch(/^Epley sağ: yarıda bırakıldı \(2\/5 adım\) · sensörsüz$/);
    expect(homeStepText(r.episodes[0]!.maneuvers[0]!.steps![1]!)).toBe('60 s · yavaş geçiş 4.1 s · komuttan önce hareket · baş dönmesi: gecikme 2 s, süre 15 s');
    expect(homeManeuverFlags(r.episodes[0]!.maneuvers[0]!)).toEqual(['2. adımda yavaş geçiş 4.1 s', '2. adımda komuttan önce hareket', '3. adımda oturuştan geçilmedi']);
    expect(homeReportHeadline(r)).toMatch(/^Son atak \(31\.10\): düzeldi · 1 atak · 2 manevra \(1 tamamlandı\) · son tekrar test \(01\.11\) sabah, sağ: baş dönmesi gelmedi$/);
    expect(homeTruncationText(r)).toBeNull();
    expect(homeTruncationText(report({ stepsDropped: true, episodesOmitted: 2 }))).toMatch(/adım ayrıntısı çıkarıldı, en eski 2 atak çıkarıldı/);
  });

  it('HBYS notuna eklenen her ev dönemi raporu bir satır; reçete kodu eşleşirse belirtilir', () => {
    const token = encodeHomeReport(report()).token;
    expect(decodeHomeReport(token).ok).toBe(true);
    const e = exam({}, undefined, { prescriptionToken: rxToken, homeReports: [{ id: 'x', token, importedAt: S }] });
    const lines = examNoteText(e, 'NO-2611', {}).split('\n');
    const home = lines.filter((l) => l.startsWith('Ev dönemi'));
    expect(home).toHaveLength(1);
    expect(home[0]).toContain(`reçete kodu ${rxCode(rxToken)} (bu muayenenin reçetesi)`);
    // Önce son atağın sonucu, sonra sayılar, sonra adlandırılmış tarihler (tur 5, k09).
    expect(home[0]).toMatch(/^Ev dönemi \(hastanın DengeYol raporu, QR ile aktarıldı\): Son atak \(31\.10\): düzeldi · 1 atak · 2 manevra \(1 tamamlandı\)/);
    expect(home[0]).toContain('· atak 31.10 · rapor 05.11 ·');
    expect(home[0]).not.toMatch(/son atak: /);
    // Araştırma kaydı taşımayan (sürümsüz, eski uygulama) rapor: kaydın bilinmediği yazılır (yeni kullanıcı turu 1, y04 #1).
    expect(home[0]).toMatch(/adım işaretleri: yavaş geçiş 4\.1 s, komuttan önce hareket, oturuştan geçilmedi · araştırma kaydı yok \(raporu üreten uygulama eski sürüm\)\.$/);
    // Başka reçetenin raporu: eşleşme yazılmaz; bozuk kayıt nota girmez.
    expect(homeReportNoteLine(report({ rxCode: '00000000' }), rxCode(rxToken))).not.toMatch(/bu muayenenin/);
    const broken = exam({}, undefined, { homeReports: [{ id: 'y', token: token.slice(0, -1) + '0', importedAt: S }] });
    expect(examNoteText(broken, undefined, {})).not.toMatch(/Ev dönemi/);
  });

  it('tarihler her yerde ayrı adlarla: reçete (geçerlilik … dahil) · ataklar · rapor (tur 5, k09)', () => {
    const rx = { date: '2026-10-16', side: 'R' as const, maneuver: 'epley' as const, perDay: 3, days: 5 };
    const ep = report().episodes[0]!;
    const two = report({
      rx,
      generatedAt: new Date(2026, 9, 31, 18, 0).getTime(),
      episodes: [
        { ...ep, startedAt: new Date(2026, 9, 17, 8, 0).getTime() },
        { ...ep, startedAt: new Date(2026, 9, 25, 7, 30).getTime(), status: 'referred', endNote: 'ATYPICAL_LONG', retests: [] }
      ]
    });
    expect(homePeriodText(two)).toBe('Reçete 16.10 (geçerlilik 29.10 dahil) · ataklar 17.10–25.10 · rapor 31.10');
    const line = homeReportNoteLine(two);
    expect(line).toContain('reçete 16.10 (geçerlilik 29.10 dahil) · ataklar 17.10–25.10 · rapor 31.10');
    // Son atak yönlendirmeyle bittiyse satır bununla (ve nedeniyle) başlar; "gelmedi" son okunan bilgi olmaz.
    expect(line).toMatch(/: Son atak \(25\.10\): hekime yönlendirildi — baş dönmesi bir dakikadan uzun sürdü/);
    expect(homeReportHeadline(two)).toMatch(/^Son atak \(25\.10\): hekime yönlendirildi — .* · 2 atak · /);
    // Reçetesiz rapor: reçete parçası yok.
    expect(homePeriodText(report())).toBe('Atak 31.10 · rapor 05.11');
  });

  it('açık atakta 1. saat tekrar testi negatifse "sürüyor" değil "sabah testi bekleniyor" (tur 5, k08)', () => {
    const ep = report().episodes[0]!;
    const early = { at: S + 70 * MIN, kind: 'early' as const, side: 'R' as const, vertigo: false, latencySec: null, durationSec: null };
    const open = report({ episodes: [{ ...ep, status: 'active', retests: [early] }] });
    expect(homeLastOutcomeText(open)).toBe('son atak (31.10) — atak açık: 1. saat tekrar testi negatif, sabah testi bekleniyor');
    expect(homeReportNoteLine(open)).toContain('atak açık: 1. saat tekrar testi negatif, sabah testi bekleniyor');
    expect(homeReportNoteLine(open)).not.toMatch(/sürüyor/);
    expect(homeEpisodeTitle(open.episodes[0]!)).toMatch(/— Atak açık: 1\. saat tekrar testi negatif, sabah testi bekleniyor$/);
    // "Sürüyor" yalnız belirti sürüyorsa: tekrar testi pozitif ya da hiç test/manevra yok.
    expect(homeOpenEpisodeText({ ...ep, status: 'active', retests: [{ ...early, vertigo: true, latencySec: 3, durationSec: 20 }] })).toBe(
      'sürüyor: 1. saat tekrar testi pozitif (baş dönmesi var)'
    );
    expect(homeOpenEpisodeText({ ...ep, status: 'active', retests: [] })).toBe('atak açık: manevra sonrası tekrar testi yapılmadı');
    expect(homeOpenEpisodeText({ ...ep, status: 'active', retests: [], maneuvers: [], sideTests: [] })).toBe('sürüyor');
  });

  it('açık atakta baştaki sonuç tekrar testini söylüyorsa "son tekrar test" bir daha yazılmaz (tur 6, k08 #4)', () => {
    const ep = report().episodes[0]!;
    const early = { at: S + 70 * MIN, kind: 'early' as const, side: 'R' as const, vertigo: false, latencySec: null, durationSec: null };
    const open = report({ episodes: [{ ...ep, status: 'active', retests: [early] }] });
    const head = homeReportHeadline(open);
    expect(head).toBe('Son atak (31.10) — atak açık: 1. saat tekrar testi negatif, sabah testi bekleniyor · 1 atak · 2 manevra (1 tamamlandı)');
    expect(head.match(/tekrar test/g)).toHaveLength(1);
    const line = homeReportNoteLine(open);
    expect(line.match(/tekrar test/g)).toHaveLength(1);
    expect(line).not.toMatch(/erken \(1\. saat\)/);
    // Pozitif testte baştaki sonuç tarafı ve süreleri söylemez: yalnız o kısım eklenir, test adı tekrarlanmaz.
    const pos = report({ episodes: [{ ...ep, status: 'active', retests: [{ ...early, vertigo: true, latencySec: 3, durationSec: 20 }] }] });
    expect(homeReportHeadline(pos)).toBe(
      'Son atak (31.10) — sürüyor: 1. saat tekrar testi pozitif (baş dönmesi var) · 1 atak · 2 manevra (1 tamamlandı) · son tekrar test sağ: gecikme 3 s, süre 20 s'
    );
    // Kapanmış atakta baştaki sonuç testi söylemez: son tekrar test yazılmaya devam eder.
    expect(homeReportHeadline(report())).toMatch(/· son tekrar test \(01\.11\) sabah, sağ: baş dönmesi gelmedi$/);
  });

  it('biçim v2: yüzüstünden gelme adım işaretinde "önce yanlış taraf" yerine; testte durdurma ekranda ve HBYS\'de (tur 6, k09)', () => {
    const ep = report().episodes[0]!;
    const m0 = ep.maneuvers[0]!;
    const proneStep = { index: 2, title: 'c', holdSec: 0, flags: ['wrongSide' as const, 'proneArrival' as const], transitionSec: null, vertigo: null };
    const stop = { at: S + 3 * MIN, test: 'side' as const, side: 'R' as const, reason: 'USER_FEELS_UNWELL' as const };
    const r = report({
      v: 2,
      episodes: [{ ...ep, status: 'active', retests: [], maneuvers: [{ ...m0, steps: [m0.steps![0]!, proneStep] }], testStops: [stop] }]
    });
    expect(homeStepText(proneStep)).toBe('0 s · yüzüstünden gelme reddedildi');
    expect(homeManeuverFlags(r.episodes[0]!.maneuvers[0]!)).toEqual(['2. adımda yüzüstünden gelme reddedildi']);
    expect(homeTestStopText(stop)).toBe('sağ taraf testi durduruldu — hasta kendini iyi hissetmedi');
    expect(homeTestStopText({ ...stop, test: 'retest', side: 'L' })).toBe('tekrar testi (sol) durduruldu — hasta kendini iyi hissetmedi');
    expect(homeTestStopsShort(r)).toBe('testte durdurma: sağ taraf testi 31.10 (hasta kendini iyi hissetmedi)');
    const line = homeReportNoteLine(r);
    expect(line).toContain('adım işaretleri: yüzüstünden gelme reddedildi');
    expect(line).not.toContain('önce yanlış taraf');
    expect(line).toContain('· testte durdurma: sağ taraf testi 31.10 (hasta kendini iyi hissetmedi)');
    // Çok sayıda durdurma kısa kalır: sayı ve son üçü.
    const many = report({ episodes: [{ ...ep, testStops: Array.from({ length: 5 }, (_, i) => ({ ...stop, at: S + i * 24 * 60 * MIN })) }] });
    expect(homeTestStopsShort(many)).toBe('testte durdurma: 5 kez, son: sağ taraf testi 02.11, sağ taraf testi 03.11, sağ taraf testi 04.11 (hasta kendini iyi hissetmedi)');
    // Durdurma yoksa HBYS satırında da yok.
    expect(homeTestStopsShort(report())).toBeNull();
    expect(homeReportNoteLine(report())).not.toMatch(/testte durdurma/);
    // Gidiş-dönüş: kodlanan v2 rapor aynı metinleri verir.
    const dec = decodeHomeReport(encodeHomeReport(r).token);
    if (!dec.ok) throw new Error(dec.error);
    expect(homeReportNoteLine(dec.value)).toContain('testte durdurma: sağ taraf testi 31.10');
  });
});

describe('rapor yapıştırma alanı (tur 4, k09)', () => {
  const rxToken = encodePrescription({ v: 2, side: 'R', canal: 'PC', maneuver: 'epley', date: '2026-10-31', perDay: 3, days: 5, pid: 'NO-2611' });

  it('reçete bağlantısı tanınır ve açık mesaj verilir', () => {
    const url = `https://dengeyol.example/#/recete/${rxToken}`;
    expect(looksLikeRxLink(url)).toBe(true);
    expect(reportPasteErrorText(url)).toMatch(/^Bu bir ev reçetesi bağlantısı, hasta raporu değil\./);
  });

  it('serbest metin ve boş giriş genel mesajı alır', () => {
    for (const t of ['merhaba', '', 'https://dengeyol.example/#/hasta', rxToken]) {
      expect(looksLikeRxLink(t)).toBe(false);
      expect(reportPasteErrorText(t)).toBe('Bu bir hasta raporu bağlantısına benzemiyor.');
    }
  });
});

describe('ev raporunun araştırma kaydı ve klinik öneri (yeni kullanıcı turu 1; y04 #1, y05 #7, y08 #3)', () => {
  const MIN = 60_000;
  const S = new Date(2026, 9, 31, 9, 0).getTime();
  const ep = (p: Partial<HomeEpisode> = {}): HomeEpisode => ({
    startedAt: S,
    status: 'active',
    side: 'R',
    sideTests: [
      {
        at: S + 5 * MIN,
        R: { vertigo: true, latencySec: 2, durationSec: 30, safetyStopped: false },
        L: { vertigo: true, latencySec: 2, durationSec: 10, safetyStopped: false },
        decision: { kind: 'TREAT', side: 'R', note: null },
        canal: 'HC'
      }
    ],
    maneuvers: [
      { at: S + 15 * MIN, protocolId: 'bbq-roll', side: 'R', completed: true, stopReason: null, pauses: 0, manual: false, stepCount: 7, steps: null }
    ],
    retests: [],
    ...p
  });
  const rep = (p: Partial<HomeReport> = {}, e: Partial<HomeEpisode> = {}): HomeReport => ({
    v: 3,
    generatedAt: S + 2 * 60 * MIN,
    period: { from: S, to: S + 2 * 60 * MIN },
    episodes: [ep(e)],
    stepsDropped: false,
    episodesOmitted: 0,
    maneuversOmitted: 0,
    appVersion: '0.1.0',
    rulesVersion: 'k1',
    ...p
  });
  const p4: Partial<HomeEpisode> = {
    simulation: true,
    redFlags: [{ at: S + MIN, ids: ['neuro'], continued: true }],
    overrides: [
      { at: S + 2 * MIN, kind: 'RED_FLAG', detail: 'neuro' },
      { at: S + 3 * MIN, kind: 'CONTRAINDICATION', detail: 'Boyun' },
      { at: S + 6 * MIN, kind: 'APP_DECISION', detail: 'sağ taraf, BBQ roll (yatay kanal, geotropik varsayım).' },
      { at: S + 7 * MIN, kind: 'NO_DIAGNOSIS' }
    ]
  };

  it('taraf testi satırı test türünü yazar: sırtüstü baş çevirme (v3) ya da Dix-Hallpike', () => {
    const t = ep().sideTests[0]!;
    expect(homeSideTestText(t)).toMatch(/^Sırtüstü baş çevirme testi \(supine roll\) — Başı sağa çevirince: baş dönmesi/);
    expect(homeSideTestText({ ...t, canal: undefined })).toMatch(/^Dix-Hallpike \(belirtiyle\) — Sağ: /);
    expect(homeManeuverText(ep().maneuvers[0]!)).toMatch(/^BBQ roll \(yatakta dönme manevrası\) sağ: tamamlandı/);
    // Uygulama kapanınca yarıda kalan manevra (y01 #6).
    expect(homeManeuverText({ ...ep().maneuvers[0]!, completed: false, stopReason: 'INTERRUPTED', stepCount: 3 })).toMatch(
      /yarıda kaldı: 3\. adımda uygulama kapandı ya da yenilendi \(3\/\d+ adım\)/
    );
  });

  it('HBYS satırında aşma sayısı (Türkçe adlarla), işaretlenen güvenlik sorusu, kontrendikasyon, demo, katılımcı no, sürüm', () => {
    const r = rep({ contraindications: ['neck'], studyId: 'DY-014' }, p4);
    expect(homeOverrideCount(r)).toBe(2);
    const note = homeResearchNote(r);
    expect(note).toMatch(/^araştırma kaydı — uyarıya rağmen devam: 2 \(güvenlik sorusu \(kırmızı bayrak\), kontrendikasyon\)/);
    expect(note).toMatch(/güvenlik sorusu işaretli: .+ \(devam edildi\)/);
    expect(note).toMatch(/kontrendikasyon: /);
    expect(note).toMatch(/uygulama kararı: 1/);
    expect(note).toMatch(/DEMO MODU: 1 atak/);
    expect(note).toMatch(/katılımcı no DY-014/);
    expect(note).toMatch(/DengeYol 0\.1\.0 · karar kuralları k1$/);
    expect(note).not.toMatch(/RED_FLAG|CONTRAINDICATION|APP_DECISION|NO_DIAGNOSIS|\bneuro\b/);
    const line = homeReportNoteLine(r);
    expect(line).toContain('araştırma kaydı — uyarıya rağmen devam: 2');
    // Aşma yoksa "0" açıkça yazılır.
    expect(homeResearchNote(rep())).toMatch(/^araştırma kaydı — uyarıya rağmen devam: 0;/);
    // Eski uygulama (sürüm yok, v1/v2): kayıt bilinmiyor.
    expect(homeResearchNote(rep({ v: 1, appVersion: undefined, rulesVersion: undefined }))).toBe('araştırma kaydı yok (raporu üreten uygulama eski sürüm)');
  });

  it('112 şeridi yanıtı ve çift dokunuş geri almaları HBYS satırında (L1/L2 alanları)', () => {
    const m = { ...ep().maneuvers[0]!, afterSymptoms: 'neuro' as const };
    const r = rep({}, { maneuvers: [m], neuroAck: { at: S + 40 * MIN, by: 'ok' }, vertigoTapCancels: 2 });
    expect(homeNeuroAckText(r.episodes[0]!)).toMatch(/^112 uyarısı gösterildi, kişi "belirtiler geçti, iyiyim" dedi/);
    expect(homeNeuroAckText(ep({ maneuvers: [m] }))).toBe('112 uyarısı gösterildi, kişi yanıt vermedi');
    expect(homeNeuroAckText(ep())).toBeNull();
    const note = homeResearchNote(r);
    expect(note).toMatch(/yeni belirti: 112 uyarısı gösterildi, kişi "belirtiler geçti, iyiyim" dedi/);
    expect(note).toMatch(/çift dokunuşla geri alınan baş dönmesi işareti: 2/);
  });

  it('işaretlenen güvenlik sorusu ve kontrendikasyon adları Türkçe', () => {
    expect(homeRedFlagText({ at: S, ids: ['neuro'], continued: true })).toMatch(/ — uyarı gösterildi, devam edildi$/);
    expect(homeRedFlagText({ at: S, ids: ['neuro'], continued: false })).toMatch(/ — atak durduruldu/);
    expect(homeContraText({ contraindications: ['neck', 'bilinmeyen'] })).toMatch(/, 1 tanınmayan madde$/);
    expect(homeContraText({})).toBeNull();
    expect(homeResearchEntries(ep(p4)).map((x) => x.group)).toEqual(['override', 'override', 'decision', 'info']);
  });

  it('eşleşme kodu: reçetedeki hasta kodu, yoksa katılımcı no', () => {
    expect(homeMatchCode({ pid: 'NO-1', studyId: 'DY-2' })).toBe('NO-1');
    expect(homeMatchCode({ studyId: 'DY-2' })).toBe('DY-2');
    expect(homeMatchCode({})).toBeUndefined();
  });

  it('tek cümle öneri: demo, acil belirti, atipik süre, tekrar testi yok, yanıtsızlık, düzelme', () => {
    expect(homeReportAdvice(rep({}, { simulation: true }))).toMatch(/^Bu rapor demo modunda/);
    expect(homeReportAdvice(rep({}, { redFlags: [{ at: S, ids: ['neuro'], continued: true }] }))).toMatch(/^Evde acil \(nörolojik\) belirti/);
    expect(homeReportAdvice(rep({}, { maneuvers: [{ ...ep().maneuvers[0]!, afterSymptoms: 'neuro' }] }))).toMatch(/^Evde acil/);
    const long = ep().sideTests[0]!;
    expect(homeReportAdvice(rep({}, { sideTests: [{ ...long, R: { ...long.R!, durationSec: 75 } }] }))).toMatch(/1 dakikadan uzun/);
    // y08: manevra var, tekrar testi yok → testi tekrarla; 2–3 manevraya yanıtsızsa sevk.
    expect(homeReportAdvice(rep())).toMatch(/^Manevra sonrası tekrar testi yapılmamış: .*sevk/);
    const m = ep().maneuvers[0]!;
    const three = [m, { ...m, at: S + 30 * MIN }, { ...m, at: S + 50 * MIN }];
    const pos = { at: S + 120 * MIN, kind: 'early' as const, side: 'R' as const, vertigo: true, latencySec: 2, durationSec: 20 };
    expect(homeReportAdvice(rep({}, { maneuvers: three, retests: [pos] }))).toMatch(/^3 manevraya karşın tekrar testi hâlâ pozitif/);
    expect(homeReportAdvice(rep({}, { retests: [pos] }))).toMatch(/^Tekrar testi hâlâ pozitif/);
    expect(homeReportAdvice(rep({}, { retests: [{ ...pos, kind: 'morning', vertigo: false, latencySec: null, durationSec: null }] }))).toMatch(/^Sabah testi negatif/);
    const nt = { ...long, R: { vertigo: false, latencySec: null, durationSec: null, safetyStopped: false }, L: null, decision: { kind: 'NOT_TRIGGERED' as const } };
    expect(homeReportAdvice(rep({}, { sideTests: [nt], maneuvers: [] }))).toMatch(/^Evde test baş dönmesi başlatmadı/);
  });
});
