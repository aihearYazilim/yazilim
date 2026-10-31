import { describe, expect, it } from 'vitest';
import type { StepRecord } from '../../../core/runner';
import { RED_FLAGS } from '../../../core/safety';
import { emptyData, type Episode } from '../../../state/types';
import { endNoteText, reportPlainText, rxHeaderLine, symptomText } from './reportText';

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
  it('rapor başı: hasta kodu · reçete tarihi · klinisyen', () => {
    const line = rxHeaderLine({ v: 2, side: 'R', canal: 'PC', maneuver: 'epley', date: '2026-10-30', by: 'Doç. Dr. S', clinic: 'KBB', perDay: 3, days: 5, pid: 'NO-2611' });
    expect(line).toBe('Hasta kodu NO-2611 · reçete 30 Ekim 2026 · Doç. Dr. S, KBB');
    expect(rxHeaderLine(undefined)).toBeNull();
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
    expect(t.split('\n')[1]).toBe('Hasta kodu NO-2611 · reçete 30 Ekim 2026 · Doç. Dr. S');
    expect(t).toMatch(/13 Kasım 2026 tarihine kadar geçerli/);
    expect(t).toMatch(/yakını yaptırdı · 2 kez duraklatıldı/);
    expect(t).toMatch(/Sırtüstü, baş sarkık: 56 s · hedefte %92/);
    // Kayıtta yardım bilgisi varsa şu anki ayar ayrıca yazılmaz.
    expect(t).not.toMatch(/şu anki ayarı/);
  });
});
