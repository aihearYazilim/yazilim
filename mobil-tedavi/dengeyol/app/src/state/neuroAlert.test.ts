import { describe, expect, it } from 'vitest';
import { RED_FLAGS } from '../core/safety';
import { ackNeuroAlert, emergencyOverridden, NEURO_ALERT_MS, neuroAlertFor } from './neuroAlert';
import { emptyData, type Episode, type ManeuverLog } from './types';

const NOW = Date.UTC(2026, 10, 1, 12, 0, 0);

const man = (at: number, afterSymptoms?: ManeuverLog['afterSymptoms']): ManeuverLog => ({
  id: 'm' + at,
  at,
  protocolId: 'epley',
  side: 'R',
  completed: true,
  stopReason: null,
  records: [],
  manual: false,
  ...(afterSymptoms ? { afterSymptoms } : {})
});

const ep = (id: string, extra: Partial<Episode> = {}): Episode => ({
  id,
  startedAt: NOW - 3600_000,
  side: 'R',
  protocolId: 'epley',
  redFlags: [],
  sideTests: [],
  maneuvers: [],
  retests: [],
  status: 'active',
  ...extra
});

describe('manevra sonrası yeni belirti: kırmızı 112 şeridi (L2-1)', () => {
  it('yeni belirti bildirilen manevradan sonra 24 saat görünür; sonra kalkar', () => {
    const d = { ...emptyData(), episodes: [ep('a', { maneuvers: [man(NOW - 600_000, 'neuro')] })] };
    expect(neuroAlertFor(d, NOW)).toEqual({ episodeId: 'a', at: NOW - 600_000 });
    expect(neuroAlertFor(d, NOW - 600_000 + NEURO_ALERT_MS + 1)).toBeNull();
  });

  it('atak acil olarak kapatılmış olsa da görünür; başka belirtilerde görünmez', () => {
    const closed = { ...emptyData(), episodes: [ep('a', { status: 'emergency', endedAt: NOW, maneuvers: [man(NOW - 60_000, 'neuro')] })] };
    expect(neuroAlertFor(closed, NOW)?.episodeId).toBe('a');
    const mild = { ...emptyData(), episodes: [ep('a', { maneuvers: [man(NOW - 60_000, 'mild'), man(NOW - 30_000, 'severe')] })] };
    expect(neuroAlertFor(mild, NOW)).toBeNull();
  });

  it('"112\'yi aradım" ya da "iyiyim" şeridi kapatır; sonraki yeni bildirim yeniden açar', () => {
    let d = { ...emptyData(), episodes: [ep('a', { maneuvers: [man(NOW - 600_000, 'neuro')] })] };
    d = ackNeuroAlert(d, 'a', 'called112', NOW - 300_000);
    expect(d.episodes[0]!.neuroAlertAck).toEqual({ at: NOW - 300_000, by: 'called112' });
    expect(neuroAlertFor(d, NOW)).toBeNull();
    d = { ...d, episodes: [{ ...d.episodes[0]!, maneuvers: [...d.episodes[0]!.maneuvers, man(NOW - 60_000, 'neuro')] }] };
    expect(neuroAlertFor(d, NOW)?.at).toBe(NOW - 60_000);
  });
});

describe('acil uyarısı aşıldı mı (yürütücüde kırmızı hatırlatma; L2-2)', () => {
  const neuro = RED_FLAGS.find((q) => q.id === 'neuro')!;
  const ear = RED_FLAGS.find((q) => q.id === 'ear')!;
  const answers = (q: typeof neuro) => Object.fromEntries(RED_FLAGS.map((x) => [x.id, x.id === q.id ? x.stopsOn : x.stopsOn === 'yes' ? 'no' : 'yes'])) as Record<string, 'yes' | 'no'>;

  it('acil belirti işaretlenip "Yine de devam et" denince evet; hekim belirtisinde ya da aşma yoksa hayır', () => {
    const at = NOW - 60_000;
    expect(emergencyOverridden(ep('a', { redFlags: [{ at, answers: answers(neuro), stopped: true }], overrides: [{ at: at + 1000, kind: 'RED_FLAG', detail: 'neuro' }] }))).toBe(true);
    expect(emergencyOverridden(ep('a', { redFlags: [{ at, answers: answers(neuro), stopped: true }] }))).toBe(false);
    expect(emergencyOverridden(ep('a', { redFlags: [{ at, answers: answers(ear), stopped: true }], overrides: [{ at: at + 1000, kind: 'RED_FLAG', detail: 'ear' }] }))).toBe(false);
    expect(emergencyOverridden(null)).toBe(false);
  });

  it('manevra sonrası yeni belirti uyarısı aşıldıysa evet', () => {
    expect(emergencyOverridden(ep('a', { maneuvers: [man(NOW - 60_000, 'neuro')], overrides: [{ at: NOW, kind: 'RED_FLAG' }] }))).toBe(true);
  });
});
