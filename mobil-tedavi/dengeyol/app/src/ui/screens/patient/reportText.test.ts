import { describe, expect, it } from 'vitest';
import type { StepRecord } from '../../../core/runner';
import { RED_FLAGS } from '../../../core/safety';
import { encodePrescription, type Prescription, rxCode } from '../../../core/prescription';
import { emptyData, type Episode } from '../../../state/types';
import { capitalizeTr } from '../../../core/protocols';
import { buildHomeReport, homeReportDatesText } from '../../../core/reportShare';
import {
  doseSummaryText,
  endNoteText,
  maneuverPauses,
  maneuverStatusText,
  neuroAlertText,
  overrideCount,
  overrideKindText,
  overrideLines,
  recordSourceText,
  redFlagContinued,
  redFlagLineText,
  researchDetailText,
  researchEntries,
  researchLineText,
  researchPlainLines,
  sideTestDecisionText,
  profileRxCode,
  reachText,
  reportPlainText,
  rxHeaderLine,
  rxShortcutUsed,
  rxValidityText,
  symptomText,
  episodeEndNoteText,
  maneuverHeadText,
  periodCountsLine,
  periodEpisodes,
  periodLastOutcomeText,
  periodReportPlainText,
  periodSummaryLine,
  namedDatesText,
  reportPeriod,
  stepDefFor,
  stepSummary,
  PRONE_ARRIVAL_STOP_TEXT,
  retestText,
  stopWhereText,
  testStopText,
  unreachableStopDetail
} from './reportText';

const rec = (o: Partial<StepRecord> = {}): StepRecord => ({
  stepId: 's2',
  title: 'Sırtüstü, baş sarkık',
  startedAt: 1_000_000,
  firstInRangeAt: 1_000_000 + 16_000,
  reachedAt: 1_000_000 + 17_000,
  endedAt: 1_000_000 + 80_000,
  holdSec: 56,
  samples: 100,
  inRangeSamples: 92,
  sumAbsThetaErr: 300,
  maxAbsThetaErr: 8,
  thetaSamples: 100,
  vertigoMarks: [{ start: 17, end: 35 }],
  transitionSec: null,
  manual: false,
  driftCount: 0,
  ...o
});

describe('rapor metinleri', () => {
  it('belirti: ham saniye aralığı yerine pozisyona gelişe göre gecikme ve süre', () => {
    expect(symptomText(rec())).toBe('baş dönmesi: gecikme 1 s (pozisyona gelişten), süre 18 s');
    expect(symptomText(rec({ vertigoMarks: [{ start: 20, end: null }] }))).toMatch(/gecikme 4 s.*bitişi işaretlenmedi/);
    expect(symptomText(rec({ vertigoMarks: [] }))).toBeNull();
  });
  it('iç kodlar Türkçeye çevrilir; ham kod görünmez', () => {
    expect(endNoteText('VERTIGO_TOO_LONG')).toMatch(/2 dakikadan uzun/);
    expect(endNoteText('ATYPICAL_LONG')).toMatch(/bir dakikadan uzun/);
    // Kırmızı bayrak kimliği → soru metni (kimlik listesi değişebilir: ilk sorudan alınır).
    const q = RED_FLAGS[0]!;
    expect(endNoteText(q.id)).toBe(`güvenlik sorusu yanıtı: "${q.text}"`);
    expect(endNoteText('bilinmeyen_kimlik')).toBe('güvenlik sorularından birine verilen yanıt');
    expect(endNoteText('YENI_KOD')).not.toMatch(/YENI_KOD/);
    expect(endNoteText('Taraf testi iki kez baş dönmesini tetiklemedi')).toBe('Taraf testi iki kez baş dönmesini tetiklemedi');
  });
  it('rapor başı: hasta kodu · reçete tarihi · reçete kodu (HBYS ile aynı) · klinisyen', () => {
    const rx: Prescription = { v: 2, side: 'R', canal: 'PC', maneuver: 'epley', date: '2026-10-30', by: 'Doç. Dr. S', clinic: 'KBB', perDay: 3, days: 5, pid: 'NO-2611' };
    const token = encodePrescription(rx);
    const code = token.split('.')[1]!;
    expect(rxHeaderLine(rx)).toBe(`Hasta kodu NO-2611 · reçete 30 Ekim 2026 · reçete kodu ${code} · Doç. Dr. S, KBB`);
    // Saklanan bağlantı varsa kod ondan okunur (klinisyen ekranındaki rxCode(token) ile aynı).
    expect(profileRxCode({ prescription: rx, prescriptionToken: token })).toBe(code);
    expect(profileRxCode({ prescription: rx })).toBe(code);
    expect(profileRxCode({})).toBeNull();
    expect(rxHeaderLine(undefined)).toBeNull();
  });
  it('geçerlilik: son geçerli gün "(dahil)"; ertesi gün süresi doldu', () => {
    const rx: Prescription = { v: 1, side: 'R', canal: 'PC', maneuver: 'epley', date: '2026-10-17', perDay: 3, days: 5 };
    expect(rxValidityText(rx, new Date('2026-10-30T23:59:00').getTime())).toBe('30 Ekim 2026 tarihine kadar (dahil) geçerli');
    expect(rxValidityText(rx, new Date('2026-10-31T00:00:00').getTime())).toBe('30 Ekim 2026 tarihine kadar (dahil) geçerli · süresi doldu');
  });
  it('kısa yol, doz özeti, duraklatma (adım kayıtlarından), yakını eşliğinde ve onam sürümü', () => {
    const d = emptyData();
    const rx: Prescription = { v: 1, side: 'L', canal: 'PC', maneuver: 'epley', date: '2026-10-30', perDay: 3, days: 5 };
    d.patient = {
      consentAt: '2026-10-30T08:00:00.000Z',
      consentVersion: '2',
      consentBy: 'helper',
      diagnosedByDoctor: true,
      canal: 'PC',
      side: 'L',
      contraindications: [],
      prescription: rx
    };
    d.practiceLog = [new Date('2026-10-30T20:00:00').getTime()];
    const m = (id: string, at: string, o: Partial<Episode['maneuvers'][number]> = {}) => ({
      id,
      at: new Date(at).getTime(),
      protocolId: 'epley' as const,
      side: 'L' as const,
      completed: true,
      stopReason: null,
      records: [rec({ pauses: 1 }), rec({ pauses: 1 })],
      manual: false,
      ...o
    });
    const e: Episode = {
      id: 'e1',
      startedAt: new Date('2026-10-31T09:00:00').getTime(),
      side: 'L',
      protocolId: 'epley',
      redFlags: [],
      sideTests: [],
      maneuvers: [m('m1', '2026-10-31T09:10:00', { assisted: true }), m('m2', '2026-10-31T13:10:00')],
      retests: [],
      status: 'active'
    };
    d.episodes = [e];
    const now = new Date('2026-10-31T15:00:00').getTime();
    expect(rxShortcutUsed(e, d.patient)).toBe(true);
    expect(rxShortcutUsed({ ...e, rxShortcut: false }, d.patient)).toBe(false);
    expect(rxShortcutUsed({ ...e, sideTests: [{ at: e.startedAt, results: [], stronger: null, decision: { kind: 'NOT_TRIGGERED' } }] }, d.patient)).toBe(false);
    // Reçete atak başında geçerli değilse yazılmaz.
    expect(rxShortcutUsed({ ...e, startedAt: new Date('2026-11-20T09:00:00').getTime() }, d.patient)).toBeNull();
    expect(doseSummaryText(e, d, now)).toBe('Reçete dönemi (30 Ekim 2026 – 12 Kasım 2026): 3/15 manevra, 2/5 gün (günde en çok 3; 1 deneme dahil)');
    expect(maneuverPauses(e.maneuvers[0]!)).toBe(2);
    expect(maneuverPauses({ ...e.maneuvers[0]!, pauses: 0 })).toBe(0);
    const t = reportPlainText(e, d, now);
    expect(t).toMatch(/Hastanın telefonunda, yakını eşliğinde oluşturuldu/);
    expect(t).not.toMatch(/kendi kullanımıyla/);
    expect(t).toMatch(/Reçeteli kısa yol: evet/);
    expect(t).toMatch(/Doz: Reçete dönemi .*3\/15 manevra/);
    expect(t).toMatch(/2 kez duraklatıldı/);
    expect(t).toMatch(/Onam: 30 Ekim 2026 · metin sürümü 2 · hasta adına yakını onayladı/);
    // Reçetesiz: son 14 gün ve varsayılan sınır; kısa yol satırı yok.
    const d2 = { ...d, patient: { ...d.patient, prescription: undefined } };
    expect(doseSummaryText(e, d2, now)).toBe('Son 14 gün: 3/9 manevra, 2/3 gün (günde en çok 3; 1 deneme dahil)');
    expect(reportPlainText(e, d2, now)).not.toMatch(/kısa yol/);
  });
  it('düz metin rapor: sekme yok, yakını/duraklatma ve geçerlilik yazılır', () => {
    const d = emptyData();
    d.settings.assist = 'helper';
    d.patient = {
      consentAt: '2026-10-30T08:00:00.000Z',
      diagnosedByDoctor: true,
      canal: 'PC',
      side: 'R',
      contraindications: [],
      prescription: { v: 2, side: 'R', canal: 'PC', maneuver: 'epley', date: '2026-10-30', by: 'Doç. Dr. S', perDay: 3, days: 5, pid: 'NO-2611' }
    };
    const e: Episode = {
      id: 'e1',
      startedAt: new Date('2026-10-31T09:00:00').getTime(),
      side: 'R',
      protocolId: 'epley',
      redFlags: [],
      sideTests: [],
      maneuvers: [
        { id: 'm1', at: new Date('2026-10-31T09:10:00').getTime(), protocolId: 'epley', side: 'R', completed: false, stopReason: 'VERTIGO_TOO_LONG', records: [rec()], manual: false, assisted: true, pauses: 2 }
      ],
      retests: [],
      status: 'referred',
      endNote: 'VERTIGO_TOO_LONG'
    };
    const t = reportPlainText(e, d, new Date('2026-10-31T10:00:00').getTime());
    expect(t).not.toMatch(/\t/);
    expect(t).not.toMatch(/VERTIGO_TOO_LONG/);
    expect(t.split('\n')[1]).toBe(`Hasta kodu NO-2611 · reçete 30 Ekim 2026 · reçete kodu ${rxCode(d.patient.prescription!)} · Doç. Dr. S`);
    expect(t).toMatch(/12 Kasım 2026 tarihine kadar \(dahil\) geçerli/);
    expect(t).toMatch(/Onam: 30 Ekim 2026 · metin sürümü 1/);
    expect(t).toMatch(/yakını yaptırdı · 2 kez duraklatıldı/);
    expect(t).toMatch(/Sırtüstü, baş sarkık: 56 s · hedefte %92/);
    // Kayıtta yardım bilgisi varsa şu anki ayar ayrıca yazılmaz.
    expect(t).not.toMatch(/şu anki ayarı/);
  });
});

describe('pozisyona gelinemedi: nerede durulduğu (k07, k02)', () => {
  const ep = (o: Partial<Episode> = {}): Episode => ({
    id: 'e1',
    startedAt: new Date('2026-10-31T09:00:00').getTime(),
    side: null,
    protocolId: 'epley',
    redFlags: [],
    sideTests: [],
    maneuvers: [],
    retests: [],
    status: 'referred',
    endNote: 'POSITION_UNREACHABLE',
    ...o
  });
  // F1'in ekleyeceği alan (StepRecord.reach) henüz türde yok: kayıtta varmış gibi verilir.
  const withReach = (r: StepRecord, phi: number | null, theta: number | null) => ({ ...r, reach: { phi, theta } }) as StepRecord;

  it('hedefe yalnız bir an değdiyse ya da yüzüstünden gelindiyse yanıltıcı açı yazılmaz (kullanıcı turu 4)', () => {
    const step = stepDefFor('epley', 'R', 'ep-1');
    const touched = rec({ stepId: 'ep-1', unreachable: true, reach: { phi: 16, theta: 44, touchedOnly: true } });
    // Kullanıcı turu 6 (k07): sarkık baş adımında açı da yazılır, çelişkisiz.
    expect(reachText(touched, step)).toBe('baş hedefin alt sınırına (~16°) kadar geldi, orada tutulamadı');
    const deeper = rec({ stepId: 'ep-1', unreachable: true, reach: { phi: 24, theta: 44, touchedOnly: true } });
    expect(reachText(deeper, step)).toBe('baş hedef aralığına (~24°) kadar geldi, orada tutulamadı');
    const below = rec({ stepId: 'ep-1', unreachable: true, reach: { phi: 12, theta: 44, touchedOnly: true } });
    expect(reachText(below, step)).toBe('baş en çok ~12° geriye sarkabildi (hedef 15–40°), hedefe yalnız bir an değdi, tutulamadı');
    const prone = rec({ stepId: 'ep-1', unreachable: true, proneArrival: true, reach: { phi: 20, theta: 160 } });
    expect(reachText(prone, step)).toBe('yüzüstünden geçilerek gelindi, kabul edilmedi');
  });
  it('taraf testinde durulunca: manevra "yapılmadı", durulan yer taraf testi; stopDetail varsa o yazılır', () => {
    const e = ep();
    expect(maneuverHeadText(e)).toBe('yapılmadı (planlanan: Epley)');
    expect(stopWhereText(e)).toMatch(/^taraf testi sırasında/);
    const detail = unreachableStopDetail('side-test', 'dix-hallpike', 'R', [
      rec({ stepId: 'dh-sit', title: 'Oturuş', unreachable: false }),
      withReach(rec({ stepId: 'dh-lie', title: 'Sırtüstü, baş sağa 45° ve sarkık', unreachable: true, startedAt: 0, endedAt: 60_000 }), 8.4, 44)
    ]);
    expect(detail).toBe('Sağ taraf testi, "Sırtüstü, baş sağa 45° ve sarkık" adımı: baş en çok ~8° geriye sarkabildi (hedef 15–40°); 60 s içinde gelinemedi');
    const t = reportPlainText(ep({ stopDetail: detail }), emptyData(), new Date('2026-10-31T10:00:00').getTime());
    expect(t).toMatch(/Manevra: yapılmadı \(planlanan: Epley\)/);
    expect(t).toMatch(/Durulan yer: Sağ taraf testi, .*~8° geriye sarkabildi \(hedef 15–40°\)/);
    expect(t).not.toMatch(/POSITION_UNREACHABLE/);
  });
  it('manevrada durulunca: adım, ulaşılan açı ve hedef manevra kaydından çıkarılır', () => {
    const r = withReach(rec({ stepId: 'ep-1', title: 'Sırtüstü, baş sola 45° ve sarkık', unreachable: true, holdSec: 0, startedAt: 0, endedAt: 60_000 }), 8, -44);
    const m = { id: 'm1', at: 0, protocolId: 'epley' as const, side: 'L' as const, completed: false, stopReason: 'POSITION_UNREACHABLE' as const, records: [rec({ stepId: 'ep-sit' }), r], manual: false };
    const e = ep({ side: 'L', maneuvers: [m] });
    expect(stopWhereText(e)).toBe('Epley sol manevrası, 2. adım "Sırtüstü, baş sola 45° ve sarkık": baş en çok ~8° geriye sarkabildi (hedef 15–40°); 60 s içinde gelinemedi');
    expect(stepSummary(r, stepDefFor('epley', 'L', 'ep-1'))).toMatch(/POZİSYONA GELİNEMEDİ \(baş en çok ~8° geriye sarkabildi \(hedef 15–40°\)\)/);
    // Dönüş hedefin dışında kaldıysa uzaklık ve izin yazılır (sol tarafta hedef aynalanır: −45°).
    expect(stepSummary(withReach(r, 20, -10), stepDefFor('epley', 'L', 'ep-1'))).toMatch(/dönüş hedefe en yakın ~35° uzak kaldı \(izin ±10°\)/);
    // Açı kaydı yoksa (eski kayıt) yalnız durum yazılır.
    expect(stepSummary(rec({ unreachable: true }))).toMatch(/POZİSYONA GELİNEMEDİ · /);
    expect(maneuverHeadText(e)).toBe('Epley');
    expect(episodeEndNoteText(e)).toMatch(/baş yeterince sarkamadı/);
  });
  it('yanlış tarafta kalınca gerekçe "yanlış tarafa döndü" olur (k02)', () => {
    const r = rec({ stepId: 'ep-3', title: 'Yan', unreachable: true, wrongSide: true, wrongSideStop: true });
    const m = { id: 'm1', at: 0, protocolId: 'epley' as const, side: 'R' as const, completed: false, stopReason: 'POSITION_UNREACHABLE' as const, records: [r], manual: false };
    const e = ep({ side: 'R', maneuvers: [m] });
    expect(episodeEndNoteText(e)).toMatch(/yanlış tarafa döndü .* doğru yana getirilemedi/);
    expect(stopWhereText(e)).toMatch(/önce yanlış tarafa dönüldü, doğru yana gelinemedi/);
    expect(episodeEndNoteText(ep({ endNote: 'VERTIGO_TOO_LONG' }))).toMatch(/2 dakikadan uzun/);
    // Yanlış taraftan (yüzüstünden) gelinen açının "dönüş hedefe ~90° uzak kaldı" diye yazılmaması (kullanıcı turu 4, k02).
    const rr = { ...r, reach: { phi: 0, theta: 0 } };
    const detail = unreachableStopDetail('maneuver', 'epley', 'R', [rr]);
    expect(detail).not.toMatch(/dönüş hedefe/);
    // Kural değil olay (kullanıcı turu 5, k02): yüzüstünden gelinmediyse yalnız "önce yanlış tarafa dönüldü…".
    expect(detail).not.toMatch(/kabul edilmez/);
    expect(detail).toMatch(/önce yanlış tarafa dönüldü, doğru yana gelinemedi/);
    const prone = unreachableStopDetail('maneuver', 'epley', 'R', [{ ...rr, proneArrival: true, startedAt: 0, endedAt: 72_000 }]);
    expect(prone).toBe(
      'Epley sağ manevrası, 1. adım "Yan": önce yanlış tarafa dönüldü, doğru yana gelinemedi; hedef açıya yüzüstünden geçilerek gelindi; kabul edilmedi; 72 s içinde gelinemedi'
    );
    expect(prone).toContain(PRONE_ARRIVAL_STOP_TEXT);
    // Açı farkı ve kısa "yüzüstünden geçilerek gelindi, kabul edilmedi" yinelenmez.
    expect(prone).not.toMatch(/gelindi, kabul/);
    // Yanlış tarafta kalınmadıysa dönüş uzaklığı yine yazılır.
    expect(unreachableStopDetail('maneuver', 'epley', 'R', [{ ...rr, wrongSideStop: false, wrongSide: false }])).toMatch(/dönüş hedefe en yakın/);
  });
  it('önce yanlış tarafa dönüp sonra doğru yanda gelinemediyse gerekçe yanlış taraf değildir', () => {
    const r = rec({ stepId: 'ep-3', title: 'Yan', unreachable: true, wrongSide: true });
    const m = { id: 'm1', at: 0, protocolId: 'epley' as const, side: 'R' as const, completed: false, stopReason: 'POSITION_UNREACHABLE' as const, records: [r], manual: false };
    expect(episodeEndNoteText(ep({ side: 'R', maneuvers: [m] }))).not.toMatch(/yanlış tarafa döndü/);
  });
});

describe('dönem raporu (k09)', () => {
  const day = 24 * 60 * 60 * 1000;
  const man = (at: number, completed = true) => ({
    id: `m${at}`,
    at,
    protocolId: 'epley' as const,
    side: 'R' as const,
    completed,
    stopReason: completed ? null : ('USER_ABORT' as const),
    records: [rec(), rec()],
    manual: false
  });
  const base = new Date('2026-10-30T09:00:00').getTime();
  const mk = (id: string, startedAt: number, o: Partial<Episode> = {}): Episode => ({
    id,
    startedAt,
    side: 'R',
    protocolId: 'epley',
    redFlags: [],
    sideTests: [],
    maneuvers: [],
    retests: [],
    status: 'resolved',
    ...o
  });

  it('reçete tarihinden bu yana bütün ataklar; başta tek satır sonuç; düz metin ataklar sırayla', () => {
    const d = emptyData();
    d.patient = {
      consentAt: '2026-10-30T08:00:00.000Z',
      diagnosedByDoctor: true,
      canal: 'PC',
      side: 'R',
      contraindications: [],
      prescription: { v: 1, side: 'R', canal: 'PC', maneuver: 'epley', date: '2026-10-30', perDay: 3, days: 5 }
    };
    const e1 = mk('e1', base, {
      maneuvers: [man(base + 600_000), man(base + 4 * 3600_000)],
      retests: [{ at: base + day, kind: 'morning', side: 'R', vertigo: true, latencySec: 3, durationSec: 20 }],
      status: 'closed'
    });
    const e2 = mk('e2', base + 3 * day, {
      maneuvers: [man(base + 3 * day + 600_000), man(base + 3 * day + 3600_000, false), { ...man(base + 3 * day + 7200_000), records: [rec()], completed: false }],
      retests: [{ at: base + 4 * day, kind: 'morning', side: 'R', vertigo: false, latencySec: null, durationSec: null }]
    });
    const old = mk('e0', base - 40 * day, { endedAt: base - 39 * day, maneuvers: [man(base - 40 * day)] });
    d.episodes = [e2, old, e1];
    const now = base + 5 * day;
    const eps = periodEpisodes(d, now);
    expect(eps.map((e) => e.id)).toEqual(['e1', 'e2']);
    // Doza sayılan manevralar (tamamlanan ya da bir pozisyona geçilen); yarım kalan ayrıca belirtilir.
    expect(periodCountsLine(eps)).toBe('2 atak · 4 manevra (3 tamamlandı) · son sabah testi negatif');
    // Önce son atağın sonucu (kullanıcı turu 4, k09), sonra sayılar.
    expect(periodSummaryLine(eps)).toBe('Son atak (2 Kasım): düzeldi · 2 atak · 4 manevra (3 tamamlandı) · son sabah testi negatif');
    // Adlandırılmış tarih dizisi (kullanıcı turu 6, k09): QR kartı, klinisyen ekranı ve HBYS ile aynı biçim.
    expect(reportPeriod(d, now).label).toBe('Reçete 30.10 (geçerlilik 12.11 dahil) · ataklar 30.10–02.11 · rapor 04.11');
    expect(reportPeriod(d, now).label).toBe(
      capitalizeTr(homeReportDatesText(buildHomeReport(d, { now, episodes: periodEpisodes(d, now) })))
    );
    const t = periodReportPlainText(d, now);
    expect(t).toMatch(/\nDönem: Reçete 30\.10 \(geçerlilik 12\.11 dahil\) · ataklar 30\.10–02\.11 · rapor 04\.11\n/);
    expect(t).not.toMatch(/Dönem: Reçete dönemi/);
    expect(t.split('\n')[0]).toBe('DengeYol — BPPV dönem raporu');
    expect(t).toMatch(/Sonuç: Son atak \(2 Kasım\): düzeldi · 2 atak · 4 manevra \(3 tamamlandı\) · son sabah testi negatif/);
    expect(t.indexOf('=== 1. ATAK')).toBeLessThan(t.indexOf('=== 2. ATAK'));
    expect(t).not.toMatch(/=== 3\. ATAK/);
    // Ortak satırlar (tanı, onam) bir kez yazılır.
    expect(t.match(/Önceki tanı:/g)?.length).toBe(1);
    expect(t.match(/Onam:/g)?.length).toBe(1);
    expect(t).not.toMatch(/\t/);
  });
  it('reçetesiz: son 14 gün; atak yoksa bunu söyler; yönlendirmeler sayılır', () => {
    const d = emptyData();
    const now = base + 20 * day;
    expect(reportPeriod(d, now).label).toBe('Son 14 gün · atak yok · rapor 19.11');
    expect(periodSummaryLine([])).toBe('Bu dönemde kayıtlı atak yok');
    d.episodes = [mk('a', now - 2 * day, { status: 'referred', endNote: 'POSITION_UNREACHABLE' }), mk('b', now - 30 * day, { endedAt: now - 29 * day })];
    const eps = periodEpisodes(d, now);
    expect(eps.map((e) => e.id)).toEqual(['a']);
    expect(periodCountsLine(eps)).toBe('1 atak · 0 manevra · tekrar testi yok · 1 hekime yönlendirme');
    // Yönlendirmede nedenin kısa hâli (";" sonrası "zorlamadan hekime yönlendirildi" yinelenmez).
    expect(periodLastOutcomeText(eps)).toBe('Son atak (17 Kasım): hekime yönlendirildi — manevranın bir pozisyonuna gelinemedi (baş yeterince sarkamadı ya da çevrilemedi)');
    expect(periodSummaryLine(eps)).toMatch(/^Son atak \(17 Kasım\): hekime yönlendirildi — .* · 1 atak · 0 manevra/);
    expect(periodLastOutcomeText([])).toBeNull();
    expect(periodReportPlainText(d, now)).toMatch(/Durulan yer: taraf testi sırasında/);
  });
  it('son atak yönlendirmeyse "son sabah testi negatif"ten önce yazılır; güvenlik sorusunda kısa ad (k09)', () => {
    const d = emptyData();
    const now = base + 20 * day;
    const flag = RED_FLAGS.find((q) => q.id === 'orthostatic')!;
    d.episodes = [
      mk('a', now - 5 * day, {
        maneuvers: [man(now - 5 * day)],
        retests: [{ at: now - 4 * day, kind: 'morning', side: 'R', vertigo: false, latencySec: null, durationSec: null }]
      }),
      mk('b', now - 1 * day, { status: 'referred', endNote: 'orthostatic' })
    ];
    const line = periodSummaryLine(periodEpisodes(d, now));
    expect(line.indexOf('hekime yönlendirildi')).toBeLessThan(line.indexOf('son sabah testi negatif'));
    expect(line).toMatch(new RegExp(`^Son atak \\(18 Kasım\\): hekime yönlendirildi — güvenlik sorusu: ${flag.label}`));
  });
});

describe('testte "Kendimi kötü hissediyorum" (kullanıcı turu 5, k01)', () => {
  const at = new Date('2026-11-08T14:05:00').getTime();
  const e: Episode = {
    id: 'e1',
    startedAt: at - 600_000,
    side: null,
    protocolId: 'epley',
    redFlags: [],
    sideTests: [],
    maneuvers: [],
    retests: [],
    status: 'active',
    testStops: [
      { at, test: 'side', side: 'R', reason: 'USER_FEELS_UNWELL' },
      { at: at + 3600_000, test: 'retest', side: 'L', reason: 'USER_FEELS_UNWELL' }
    ]
  };
  it('raporda "kendini iyi hissetmedi" yazılır; tarih gün başında sıfırsız', () => {
    expect(testStopText(e.testStops![0]!)).toBe('8 Kasım 2026 14:05 — sağ taraf testi durduruldu: hasta kendini iyi hissetmedi');
    expect(testStopText(e.testStops![1]!)).toMatch(/tekrar testi \(sol\) durduruldu: hasta kendini iyi hissetmedi$/);
    const t = reportPlainText(e, emptyData(), at + 7200_000);
    expect(t).toMatch(/Testte durdurma: 8 Kasım 2026 14:05 — sağ taraf testi durduruldu: hasta kendini iyi hissetmedi/);
    expect(t).toMatch(/Testte durdurma: .*tekrar testi \(sol\)/);
    expect(t).not.toMatch(/USER_FEELS_UNWELL/);
    expect(t).not.toMatch(/\b08 Kasım/);
    expect(retestText({ at, kind: 'early', side: 'R', vertigo: false, latencySec: null, durationSec: null })).toMatch(/^8 Kasım 2026 14:05/);
  });
  it('eski kayıtta (testStops yok) satır yazılmaz', () => {
    expect(reportPlainText({ ...e, testStops: undefined }, emptyData(), at)).not.toMatch(/Testte durdurma/);
  });
});

describe('adlandırılmış tarih dizisi (kullanıcı turu 6, k09)', () => {
  const t = (s: string) => new Date(s).getTime();
  it('reçete, ataklar ve rapor kendi adlarıyla; tek atak, aynı gün ve yıl değişimi', () => {
    const rx = { date: '2026-10-16' };
    const g = t('2026-10-31T10:00:00');
    expect(namedDatesText(g, rx, [t('2026-10-25T09:00:00'), t('2026-10-17T09:00:00')])).toBe(
      'reçete 16.10 (geçerlilik 29.10 dahil) · ataklar 17.10–25.10 · rapor 31.10'
    );
    expect(namedDatesText(g, rx, [t('2026-10-25T09:00:00')])).toBe('reçete 16.10 (geçerlilik 29.10 dahil) · atak 25.10 · rapor 31.10');
    expect(namedDatesText(g, rx, [t('2026-10-25T09:00:00'), t('2026-10-25T18:00:00')])).toBe(
      'reçete 16.10 (geçerlilik 29.10 dahil) · ataklar 25.10 · rapor 31.10'
    );
    expect(namedDatesText(g, null, [])).toBe('atak yok · rapor 31.10');
    expect(namedDatesText(t('2027-01-03T10:00:00'), { date: '2026-12-28' }, [t('2026-12-29T09:00:00')])).toBe(
      'reçete 28.12.2026 (geçerlilik 10.01.2027 dahil) · atak 29.12.2026 · rapor 03.01.2027'
    );
  });
});

describe('araştırma kaydı (yeniden tasarım; yeni kullanıcı turu 1: aşmalar, kararlar ve bilgi ayrı)', () => {
  const at = (s: string) => new Date(s).getTime();
  const man = (t: string, p: Partial<Episode['maneuvers'][number]> = {}): Episode['maneuvers'][number] => ({
    id: `m${t}`,
    at: at(t),
    protocolId: 'epley',
    side: 'R',
    completed: true,
    stopReason: null,
    records: [rec({ stepId: 'ep-sit' }), rec({ stepId: 'ep-1' })],
    manual: false,
    ...p
  });
  const e: Episode = {
    id: 'o1',
    startedAt: at('2026-10-31T09:00:00'),
    side: 'R',
    protocolId: 'epley',
    redFlags: [],
    sideTests: [],
    maneuvers: [man('2026-10-31T09:15:00')],
    retests: [],
    status: 'active',
    overrides: [
      { at: at('2026-10-31T09:20:00'), kind: 'VERTIGO_TOO_LONG', detail: 'Epley · sağ, adım 2/5 (Sırtüstü): baş dönmesi 2 dakikayı aştı' },
      { at: at('2026-10-31T09:05:00'), kind: 'DOSE', detail: 'günlük manevra sınırı doluydu (2. gün)' },
      { at: at('2026-10-31T09:06:00'), kind: 'REFER_BOTH_SIDES' },
      { at: at('2026-10-31T09:07:00'), kind: 'XYZ_BILINMEYEN' }
    ]
  };
  it('kodlar Türkçeye çevrilir; ham kod yazılmaz; satırlar zamana göre', () => {
    expect(overrideKindText('POSITION_UNREACHABLE')).toBe('pozisyona 1 dakikada gelinemeyince manevraya devam edildi');
    expect(overrideKindText('REFER_BOTH_SIDES')).toMatch(/^hekime yönlendirme önerisine rağmen devam edildi \(iki tarafa yatınca/);
    expect(overrideKindText('XYZ_BILINMEYEN')).toBe('bir uyarıya rağmen devam edildi');
    const lines = overrideLines(e);
    expect(lines).toHaveLength(4);
    expect(lines[0]).toMatch(/09:05 — önerilen manevra sınırına rağmen devam edildi: günlük manevra sınırı doluydu \(2\. gün\)$/);
    expect(lines[3]).toMatch(/09:20 — baş dönmesi 2 dakikayı aşınca manevraya devam edildi: Epley · sağ, adım 2\/5/);
    for (const l of lines) expect(l).not.toMatch(/[A-Z]{3,}_[A-Z]/);
    expect(overrideCount(e)).toBe(4);
  });
  it('düz metin raporda "ARAŞTIRMA KAYDI" bölümü (aşma sayısıyla); kayıt yoksa bölüm de yok', () => {
    const d = emptyData();
    d.episodes = [e];
    const t = reportPlainText(e, d, at('2026-10-31T12:00:00'));
    expect(t).toMatch(/\nARAŞTIRMA KAYDI\nUyarıya rağmen devam \(kullanıcının aştığı uyarılar\): 4\n- 31 Ekim 2026 09:05 — önerilen manevra sınırına/);
    const none = { ...e, overrides: undefined };
    expect(reportPlainText(none, { ...d, episodes: [none] }, at('2026-10-31T12:00:00'))).not.toMatch(/ARAŞTIRMA KAYDI/);
  });
  it('uygulamanın kararı ve uyarısız bilgi kayıtları "uyarıya rağmen" yazılmaz; aşma sayısına girmez (y04 #5, y06 #7)', () => {
    const x: Episode = {
      ...e,
      maneuvers: [],
      overrides: [
        { at: at('2026-10-31T09:01:00'), kind: 'NO_DIAGNOSIS', detail: 'Hekim tanısı olmadan kullanım' },
        { at: at('2026-10-31T09:02:00'), kind: 'SUBTYPE', detail: 'Yatakta dönünce başlıyor: yatay kanal testi ve BBQ roll' },
        { at: at('2026-10-31T09:03:00'), kind: 'APP_DECISION', detail: 'Uygulamanın kararı: sağ taraf, BBQ roll (yatay kanal, geotropik varsayım). Gerekçe.' },
        { at: at('2026-10-31T09:04:00'), kind: 'USER_CHOICE', detail: 'sol taraf (uygulamanın önerisi: sağ)' },
        { at: at('2026-10-31T09:05:00'), kind: 'GATE_HORIZONTAL_CANAL', detail: 'Hekim tanısı yatay kanal; evde yatay kanal testi ve BBQ roll' }
      ]
    };
    const all = researchEntries(x);
    expect(all.map((y) => y.group)).toEqual(['info', 'info', 'decision', 'info', 'info']);
    expect(overrideCount(x)).toBe(0);
    for (const y of all) expect(y.text).not.toMatch(/rağmen/);
    expect(all[0]!.text).toBe('hekim tanısı girilmeden kullanıldı');
    expect(all[2]!.text).toBe('Uygulamanın kararı: sağ taraf, BBQ roll (yatay kanal, geotropik varsayım). Gerekçe.');
    const plain = researchPlainLines(x);
    expect(plain[0]).toBe('Uyarıya rağmen devam (kullanıcının aştığı uyarılar): yok');
    expect(plain).toContain('Uygulamanın kararları:');
    expect(plain).toContain('Seçimler ve bilgi kayıtları:');
  });
  it('manevraya girilmeden vazgeçilen erken tekrar aşma sayılmaz; iç adım adı Türkçe (y06 #7, y04 #4)', () => {
    const x: Episode = { ...e, maneuvers: [], overrides: [{ at: at('2026-10-31T10:00:00'), kind: 'EARLY_REPEAT', detail: 'Sıradaki adım: early-retest (31 Ekim 10:15)' }] };
    const [only] = researchEntries(x);
    expect(only!.group).toBe('info');
    expect(only!.text).toBe('önerilen tekrar testi beklenmeden yeniden manevraya geçildi: Sıradaki adım: 1. saat tekrar testi (31 Ekim 10:15) — manevraya girilmeden vazgeçildi (aşma sayılmadı)');
    expect(overrideCount(x)).toBe(0);
    // Ardından manevra yapıldıysa aşmadır.
    const y = { ...x, maneuvers: [man('2026-10-31T10:12:00')] };
    expect(researchEntries(y)[0]!.group).toBe('override');
    expect(overrideCount(y)).toBe(1);
  });
  it('güvenlik sorusu kimliği, önceki atak durumu ve doz kodu Türkçe yazılır (y04 #4, y05 #7)', () => {
    const neuro = RED_FLAGS.find((q) => q.id === 'neuro')!.label;
    const weak = RED_FLAGS.find((q) => q.id === 'neuroWeak')!.label;
    expect(researchDetailText('RED_FLAG', 'neuro, neuroWeak')).toBe(`${neuro}, ${weak}`);
    expect(researchDetailText('RED_FLAG', 'Manevra sonrası yeni belirti')).toBe('Manevra sonrası yeni belirti');
    expect(researchDetailText('DOSE', 'DAILY_LIMIT')).toBe('günlük manevra sınırı doluydu');
    expect(researchDetailText('REFERRAL', 'Önceki atak: referred (ear)')).toMatch(/^önceki atak hekime yönlendirildi \(güvenlik sorusu yanıtı: "/);
    expect(researchDetailText('REFERRAL', 'Önceki atak: emergency')).toBe('önceki atak acile yönlendirildi');
    expect(researchDetailText('X', 'ATYPICAL_LONG')).toMatch(/^baş dönmesi bir dakikadan uzun/);
  });
  it('aynı kayıt tekrar ederse tek satır "(2 kez)"', () => {
    const d = 'Uygulamanın kararı: sol taraf, arka kanal manevrası. Sol tarafta baş dönmesi daha uzun sürdü.';
    const x: Episode = {
      ...e,
      overrides: [
        { at: at('2026-10-31T09:01:00'), kind: 'APP_DECISION', detail: d },
        { at: at('2026-10-31T09:31:00'), kind: 'APP_DECISION', detail: d }
      ]
    };
    const all = researchEntries(x);
    expect(all).toHaveLength(1);
    expect(all[0]!.count).toBe(2);
    expect(researchLineText(all[0]!)).toMatch(/\(2 kez\)$/);
  });
});

describe('gerçekte yapılan test ve manevra (yeni kullanıcı turu 1; y04 #2, y06 #1, y01 #5–6)', () => {
  const at = (s: string) => new Date(s).getTime();
  const hcTest: Episode['sideTests'][number] = {
    at: at('2026-10-31T09:05:00'),
    results: [
      { side: 'R', vertigo: true, latencySec: 2, durationSec: 30, safetyStopped: false },
      { side: 'L', vertigo: true, latencySec: 2, durationSec: 10, safetyStopped: false }
    ],
    stronger: null,
    decision: { kind: 'TREAT', side: 'R', note: null },
    canal: 'HC'
  };
  const base: Episode = {
    id: 'h1',
    startedAt: at('2026-10-31T09:00:00'),
    side: 'R',
    // Eski kayıt: atak kaydında Epley kalmış (y06 #1).
    protocolId: 'epley',
    redFlags: [],
    sideTests: [hcTest],
    maneuvers: [
      { id: 'b1', at: at('2026-10-31T09:20:00'), protocolId: 'bbq-roll', side: 'R', completed: true, stopReason: null, records: [rec({ stepId: 'bbq-1', title: 'Sırtüstü' })], manual: false }
    ],
    retests: [],
    status: 'active'
  };
  it('manevra satırı yapılan manevradan; test başlığı yapılan testten (supine roll / BBQ roll; Dix-Hallpike/Epley yazmaz)', () => {
    expect(maneuverHeadText(base)).toBe('BBQ roll (yatakta dönme manevrası)');
    expect(maneuverHeadText({ ...base, maneuvers: [] })).toBe('yapılmadı (planlanan: BBQ roll (yatakta dönme manevrası))');
    const t = reportPlainText(base, { ...emptyData(), episodes: [base] }, at('2026-10-31T12:00:00'));
    expect(t).toMatch(/\nManevra: BBQ roll \(yatakta dönme manevrası\)\n/);
    expect(t).toMatch(/TARAF TESTLERİ\n- 31 Ekim 2026 09:05 — Sırtüstü baş çevirme testi \(supine roll\): Başı sağa çevirince: baş dönmesi/);
    expect(t).toMatch(/1\) 31 Ekim 2026 09:20 — BBQ roll \(yatakta dönme manevrası\) sağ — tamamlandı/);
    expect(t).not.toMatch(/Dix-Hallpike|Epley/);
    // Arka kanal testi (eski kayıtta kanal yok) "Dix-Hallpike" yazar.
    const pc = { ...base, sideTests: [{ ...hcTest, canal: undefined }], maneuvers: [] };
    expect(reportPlainText(pc, { ...emptyData(), episodes: [pc] }, at('2026-10-31T12:00:00'))).toMatch(/— Dix-Hallpike \(belirtiyle\): Sağ: /);
  });
  it('test tetiklemeyip kullanıcı taraf seçtiyse karar satırı seçilen tarafı yazar (y01 #5)', () => {
    const nt: Episode = {
      ...base,
      sideTests: [{ ...hcTest, canal: 'PC', results: [], decision: { kind: 'NOT_TRIGGERED' } }],
      maneuvers: [{ ...base.maneuvers[0]!, protocolId: 'epley' }]
    };
    expect(sideTestDecisionText(nt, nt.sideTests[0]!)).toBe('baş dönmesi gelmedi; kullanıcı sağ tarafa manevrayı seçti');
    expect(sideTestDecisionText({ ...nt, maneuvers: [] }, nt.sideTests[0]!)).toBe('baş dönmesi gelmedi');
  });
  it('kırmızı bayrak işaretlenip devam edildiyse "DURDURULDU" yazılmaz (y04 #3, y05 #7)', () => {
    const rf = { at: at('2026-10-31T09:01:00'), answers: { neuro: 'yes' as const }, stopped: true };
    const cont: Episode = { ...base, redFlags: [rf], overrides: [{ at: at('2026-10-31T09:02:00'), kind: 'RED_FLAG', detail: 'neuro' }] };
    expect(redFlagContinued(cont, rf)).toBe(true);
    expect(redFlagLineText(cont, rf)).toMatch(/^işaretlendi, uyarı gösterildi, devam edildi — /);
    const stopped: Episode = { ...base, redFlags: [rf], sideTests: [], maneuvers: [], status: 'emergency', endedAt: at('2026-10-31T09:02:00'), endNote: 'neuro' };
    expect(redFlagLineText(stopped, rf)).toMatch(/^işaretlendi, atak durduruldu/);
    const t = reportPlainText(cont, { ...emptyData(), episodes: [cont] }, at('2026-10-31T12:00:00'));
    expect(t).not.toMatch(/DURDURULDU/);
    expect(t).not.toMatch(/\bneuro\b/);
  });
  it('uygulama kapanınca yarıda kalan manevra "yarıda kaldı (n. adımda …)" yazılır (y01 #6)', () => {
    const m = { ...base.maneuvers[0]!, completed: false, stopReason: 'INTERRUPTED' as const, recovered: true, records: [rec(), rec(), rec()] };
    expect(maneuverStatusText(m)).toBe('yarıda kaldı (3. adımda uygulama kapandı ya da yenilendi)');
    const e = { ...base, maneuvers: [m] };
    expect(reportPlainText(e, { ...emptyData(), episodes: [e] }, at('2026-10-31T12:00:00'))).toMatch(/— yarıda kaldı \(3\. adımda uygulama kapandı/);
  });
  it('L1/L2 alanları: 112 şeridi yanıtı, çift dokunuşla geri alınan işaret, acil belirtide "doğru mu?" onayı; VOMITING Türkçe', () => {
    const m = { ...base.maneuvers[0]!, afterSymptoms: 'neuro' as const, records: [rec({ vertigoTapCancels: 1 })] };
    const e: Episode = { ...base, maneuvers: [m], neuroAlertAck: { at: at('2026-10-31T09:40:00'), by: 'called112' } };
    expect(neuroAlertText(e)).toMatch(/112 uyarısı gösterildi; kişi "112'yi aradım" dedi \(31 Ekim 2026 09:40\)$/);
    expect(neuroAlertText({ ...e, neuroAlertAck: undefined })).toMatch(/kişi 112 şeridine yanıt vermedi$/);
    expect(neuroAlertText(base)).toBeNull();
    const t = reportPlainText(e, { ...emptyData(), episodes: [e] }, at('2026-10-31T12:00:00'));
    expect(t).toMatch(/\nYeni belirti: manevra sonrası yeni nörolojik belirti bildirildi/);
    expect(t).toMatch(/1 baş dönmesi işareti çift dokunuşla geri alındı/);
    const rf = { at: at('2026-10-31T09:01:00'), answers: { neuro: 'yes' as const }, stopped: true };
    expect(redFlagLineText({ ...base, redFlags: [rf], appVersion: '0.1.0' }, rf)).toMatch(/\("doğru mu\?" sorusunda onaylandı\)$/);
    expect(redFlagLineText({ ...base, redFlags: [rf] }, rf)).not.toMatch(/doğru mu/);
    expect(overrideKindText('VOMITING')).toBe('kusmaya rağmen yeniden denendi');
  });

  it('kayıt satırı: sürüm ve demo modu; katılımcı no rapor başında (y04 #6–7)', () => {
    const e = { ...base, appVersion: '0.1.0', rulesVersion: 'k1', simulation: true };
    expect(recordSourceText(e)).toBe('DengeYol 0.1.0 · karar kuralları k1 · DEMO MODU (sanal sensör; eğitim/deneme kaydı, gerçek tedavi değil)');
    expect(recordSourceText(base)).toBeNull();
    const d = { ...emptyData(), episodes: [e], patient: { diagnosedByDoctor: false, canal: 'unknown' as const, side: 'unknown' as const, contraindications: [], studyId: 'DY-014' } };
    const t = reportPlainText(e, d, at('2026-10-31T12:00:00'));
    expect(t).toMatch(/\nÇalışma katılımcı no: DY-014\n/);
    expect(t).toMatch(/\nKayıt: DengeYol 0\.1\.0 · karar kuralları k1 · DEMO MODU/);
    expect(periodReportPlainText(d, at('2026-10-31T12:00:00'))).toMatch(/\nÇalışma katılımcı no: DY-014\n/);
  });
});
