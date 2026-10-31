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
  symptomText
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
