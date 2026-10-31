import { describe, expect, it } from 'vitest';
import type { StepRecord } from '../../../core/runner';
import { RED_FLAGS } from '../../../core/safety';
import { encodePrescription, type Prescription, rxCode } from '../../../core/prescription';
import { emptyData, type Episode } from '../../../state/types';
import {
  doseSummaryText,
  endNoteText,
  maneuverPauses,
  profileRxCode,
  reportPlainText,
  rxHeaderLine,
  rxShortcutUsed,
  rxValidityText,
  symptomText,
  episodeEndNoteText,
  maneuverHeadText,
  periodEpisodes,
  periodReportPlainText,
  periodSummaryLine,
  reportPeriod,
  stepDefFor,
  stepSummary,
  stopWhereText,
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
    expect(periodSummaryLine(eps)).toBe('2 atak · 4 manevra (3 tamamlandı) · son sabah testi negatif');
    expect(reportPeriod(d, now).label).toMatch(/^Reçete dönemi \(30 Ekim 2026 – 12 Kasım 2026\)$/);
    const t = periodReportPlainText(d, now);
    expect(t.split('\n')[0]).toBe('DengeYol — BPPV dönem raporu');
    expect(t).toMatch(/Sonuç: 2 atak · 4 manevra \(3 tamamlandı\) · son sabah testi negatif/);
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
    expect(reportPeriod(d, now).label).toMatch(/^Son 14 gün/);
    expect(periodSummaryLine([])).toBe('Bu dönemde kayıtlı atak yok');
    d.episodes = [mk('a', now - 2 * day, { status: 'referred', endNote: 'POSITION_UNREACHABLE' }), mk('b', now - 30 * day, { endedAt: now - 29 * day })];
    const eps = periodEpisodes(d, now);
    expect(eps.map((e) => e.id)).toEqual(['a']);
    expect(periodSummaryLine(eps)).toBe('1 atak · 0 manevra · tekrar testi yok · 1 hekime yönlendirme');
    expect(periodReportPlainText(d, now)).toMatch(/Durulan yer: taraf testi sırasında/);
  });
});
