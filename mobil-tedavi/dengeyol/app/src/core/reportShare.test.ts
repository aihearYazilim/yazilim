import { describe, expect, it } from 'vitest';
import { emptyData, type AppData, type Episode, type ManeuverLog } from '../state/types';
import { encodePrescription, fnv1a, type Prescription, rxCode, rxIssuedAt, rxValidUntil } from './prescription';
import {
  buildHomeReport,
  decodeHomeReport,
  encodeHomeReport,
  encodeHomeReportRaw,
  extractReportToken,
  homeReportId,
  homeReportUrl,
  REPORT_TOKEN_BUDGET,
  REPORT_TOKEN_MAX,
  selectReportEpisodes
} from './reportShare';
import type { StepRecord } from './runner';

const b64u = (json: string) => {
  let bin = '';
  for (const b of new TextEncoder().encode(json)) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const unb64u = (s: string) => {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
};
/** Elle rapor bağlantısı üretir (sağlama toplamı "E" önekli). */
const tokenOf = (obj: unknown) => {
  const body = b64u(JSON.stringify(obj));
  return `${body}.${fnv1a(`E${body}`)}`;
};

const MIN = 60_000;
const T0 = new Date(2026, 9, 31, 9, 0, 0).getTime();

const rx: Prescription = {
  v: 2,
  side: 'R',
  canal: 'PC',
  maneuver: 'epley',
  date: '2026-10-31',
  by: 'Doç. Dr. Serkan K.',
  perDay: 3,
  days: 5,
  pid: 'NO-2611'
};

function rec(stepId: string, p: Partial<StepRecord> = {}): StepRecord {
  return {
    stepId,
    title: stepId,
    startedAt: 0,
    firstInRangeAt: 2000,
    reachedAt: 3000,
    endedAt: 40000,
    holdSec: 30.4,
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

function maneuver(at: number, p: Partial<ManeuverLog> = {}): ManeuverLog {
  return {
    id: `m${at}`,
    at,
    protocolId: 'epley',
    side: 'R',
    completed: true,
    stopReason: null,
    records: [
      rec('ep-sit'),
      rec('ep-1', { vertigoMarks: [{ start: 5, end: 20 }] }),
      rec('ep-2', { borderline: true }),
      rec('ep-3', { wrongSide: true }),
      rec('ep-4', { endedEarly: true })
    ],
    manual: false,
    assisted: true,
    pauses: 1,
    afterSymptoms: 'none',
    ...p
  };
}

function episode(start: number, p: Partial<Episode> = {}): Episode {
  return {
    id: `e${start}`,
    startedAt: start,
    side: 'R',
    protocolId: 'epley',
    redFlags: [],
    sideTests: [
      {
        at: start + 5 * MIN,
        results: [
          { side: 'R', vertigo: true, latencySec: 3, durationSec: 20, safetyStopped: false },
          { side: 'L', vertigo: false, latencySec: null, durationSec: null, safetyStopped: false }
        ],
        stronger: null,
        decision: { kind: 'TREAT', side: 'R', note: null }
      }
    ],
    maneuvers: [maneuver(start + 10 * MIN), maneuver(start + 40 * MIN, { completed: false, stopReason: 'USER_ABORT', assisted: false, pauses: 0 })],
    retests: [{ at: start + 22 * 60 * MIN, kind: 'morning', side: 'R', vertigo: false, latencySec: null, durationSec: null }],
    status: 'resolved',
    endedAt: start + 23 * 60 * MIN,
    endNote: 'ATYPICAL_LONG',
    rxShortcut: true,
    ...p
  };
}

function data(episodes: Episode[], withRx = true): AppData {
  const d = emptyData();
  d.episodes = episodes;
  if (withRx) {
    d.patient = {
      diagnosedByDoctor: true,
      canal: 'PC',
      side: 'R',
      contraindications: [],
      prescription: rx,
      prescriptionToken: encodePrescription(rx)
    };
  }
  return d;
}

describe('ev dönemi raporu: gidiş-dönüş', () => {
  it('reçete dönemindeki ataklar, hasta kodu, reçete kodu ve adım ayrıntısı korunur', () => {
    const d = data([episode(T0), episode(T0 + 2 * 24 * 60 * MIN, { status: 'referred', endNote: 'ear', rxShortcut: undefined })]);
    const rep = buildHomeReport(d, { now: T0 + 3 * 24 * 60 * MIN });
    const { token, truncated } = encodeHomeReport(rep);
    expect(truncated).toBe(false);
    expect(token.length).toBeLessThanOrEqual(REPORT_TOKEN_BUDGET);
    expect(token).toMatch(/^[A-Za-z0-9_-]+\.[0-9a-f]{8}$/);
    const r = decodeHomeReport(token);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // Zamanlar dakikaya yuvarlanır; örnek zamanlar zaten dakika başı.
    expect(r.value).toEqual(rep);
    expect(r.value.pid).toBe('NO-2611');
    expect(r.value.rxCode).toBe(rxCode(encodePrescription(rx)));
    expect(r.value.rx).toEqual({ date: '2026-10-31', side: 'R', maneuver: 'epley', perDay: 3, days: 5 });
    const m = r.value.episodes[0]!.maneuvers[0]!;
    expect(m.steps!.map((s) => s.title)).toHaveLength(5);
    expect(m.steps![1]!.vertigo).toEqual({ latencySec: 3, durationSec: 15, marks: 1 });
    expect(m.steps![2]!.flags).toEqual(['borderline']);
    expect(m.steps![3]!.flags).toEqual(['wrongSide']);
    expect(m.steps![4]!.flags).toEqual(['endedEarly']);
    expect(m.assisted).toBe(true);
    expect(m.pauses).toBe(1);
    expect(r.value.episodes[0]!.maneuvers[1]!.stopReason).toBe('USER_ABORT');
    expect(r.value.episodes[1]!.endNote).toBe('ear');
  });

  it('dakika altı zamanlar dakikaya yuvarlanır; Semont bayrakları ve yavaş geçiş korunur', () => {
    const se = maneuver(T0 + 10 * MIN + 37_000, {
      protocolId: 'semont',
      records: [
        rec('se-sit'),
        rec('se-1', { movedBeforeCommand: true, slowTransition: true, transitionSec: 4.12, vertigoMarks: [{ start: 4, end: null }, { start: 30, end: 31 }] }),
        rec('se-2', { noSitThrough: true })
      ]
    });
    const d = data([episode(T0 + 12_345, { maneuvers: [se] })]);
    const rep = buildHomeReport(d, { now: T0 + 60 * MIN });
    const r = decodeHomeReport(encodeHomeReport(rep).token);
    if (!r.ok) throw new Error(r.error);
    expect(r.value.episodes[0]!.startedAt).toBe(T0);
    expect(r.value.episodes[0]!.maneuvers[0]!.at).toBe(T0 + 10 * MIN);
    const steps = r.value.episodes[0]!.maneuvers[0]!.steps!;
    expect(steps[1]!.flags).toEqual(['slowTransition', 'movedBeforeCommand']);
    expect(steps[1]!.transitionSec).toBe(4.1);
    expect(steps[1]!.vertigo).toEqual({ latencySec: 2, durationSec: null, marks: 2 });
    expect(steps[2]!.flags).toEqual(['noSitThrough']);
  });

  it('reçetesiz kullanıcıda son 14 gün; hasta/reçete kodu yok', () => {
    const now = T0 + 20 * 24 * 60 * MIN;
    const d = data([episode(T0), episode(now - 2 * 24 * 60 * MIN)], false);
    const sel = selectReportEpisodes(d, now);
    expect(sel.episodes).toHaveLength(1);
    const r = decodeHomeReport(encodeHomeReport(buildHomeReport(d, { now })).token);
    if (!r.ok) throw new Error(r.error);
    expect(r.value.pid).toBeUndefined();
    expect(r.value.rxCode).toBeUndefined();
    expect(r.value.episodes).toHaveLength(1);
  });

  it('reçete dönemi: odaktaki atak dönem içindeyse dönemin bütün atakları; dışındaysa yalnız o atak', () => {
    const late = episode(T0 + 20 * 24 * 60 * MIN);
    const d = data([episode(T0), episode(T0 + 24 * 60 * MIN), late]);
    const inRx = selectReportEpisodes(d, T0 + 30 * 24 * 60 * MIN, `e${T0}`);
    expect(inRx.episodes).toHaveLength(2);
    expect(inRx.period).toEqual({ from: rxIssuedAt(rx)!, to: rxValidUntil(rx)! - 1 });
    const outside = selectReportEpisodes(d, T0 + 30 * 24 * 60 * MIN, late.id);
    expect(outside.episodes.map((e) => e.id)).toEqual([late.id]);
  });
});

describe('ev dönemi raporu: boyut bütçesi', () => {
  const DAY = 24 * 60 * MIN;
  /** Reçetenin tam dozu (günde 3 × 5 gün = 15 manevra) iki atağa yayılmış. */
  const fullDose = () => {
    const ms = (s: number, days: number[]) => days.flatMap((d) => [0, 1, 2].map((k) => maneuver(s + d * DAY + (10 + k * 120) * MIN)));
    const eps = [episode(T0, { maneuvers: ms(T0, [0, 1]) }), episode(T0 + 4 * DAY, { maneuvers: ms(T0 + 4 * DAY, [0, 1, 2]) })];
    return buildHomeReport(data(eps), { now: T0 + 8 * DAY });
  };
  /** Bütçeyi adımsız da aşan aşırı kullanım: 7 atak × 3 manevra. */
  const busy = () => {
    const eps = Array.from({ length: 7 }, (_, i) => {
      const s = T0 + i * DAY;
      return episode(s, { maneuvers: [maneuver(s + 10 * MIN), maneuver(s + 60 * MIN), maneuver(s + 120 * MIN)] });
    });
    return buildHomeReport(data(eps), { now: T0 + 8 * DAY });
  };

  it('tipik dönem (bir atak, bir manevra, adım ayrıntısıyla) bütçenin çok altında', () => {
    const d = data([episode(T0, { maneuvers: [maneuver(T0 + 10 * MIN)] })]);
    const { token, truncated } = encodeHomeReport(buildHomeReport(d, { now: T0 + DAY }));
    expect(truncated).toBe(false);
    expect(token.length).toBeLessThan(600);
  });

  it('bütçeyi aşınca önce adım ayrıntısı çıkarılır ve işaretlenir; ataklar ve sayılar korunur', () => {
    const rep = fullDose();
    expect(encodeHomeReportRaw(rep).length).toBeGreaterThan(REPORT_TOKEN_BUDGET);
    const { token, report, truncated } = encodeHomeReport(rep);
    expect(truncated).toBe(true);
    expect(token.length).toBeLessThanOrEqual(REPORT_TOKEN_BUDGET);
    const r = decodeHomeReport(token);
    if (!r.ok) throw new Error(r.error);
    expect(r.value).toEqual(report);
    expect(r.value.stepsDropped).toBe(true);
    expect(r.value.episodes).toHaveLength(2);
    expect(r.value.episodes.flatMap((e) => e.maneuvers)).toHaveLength(15);
    expect(r.value.episodesOmitted).toBe(0);
    const m = r.value.episodes[0]!.maneuvers[0]!;
    expect(m.steps).toBeNull();
    expect(m.stepCount).toBe(5);
    expect(m.completed).toBe(true);
  });

  it('adımsız da sığmazsa en eski ataklar, sonra en eski manevralar çıkarılır (en az bir atak kalır)', () => {
    const rep = busy();
    const small = encodeHomeReport(rep, 600);
    expect(small.token.length).toBeLessThanOrEqual(600);
    expect(small.report.stepsDropped).toBe(true);
    expect(small.report.episodesOmitted).toBeGreaterThan(0);
    expect(small.report.episodes.length + small.report.episodesOmitted).toBe(7);
    // Kalanlar en yeni ataklardır.
    expect(small.report.episodes[small.report.episodes.length - 1]!.startedAt).toBe(rep.episodes[6]!.startedAt);
    const tiny = encodeHomeReport(rep, 200);
    expect(tiny.report.episodes).toHaveLength(1);
    expect(tiny.report.maneuversOmitted).toBeGreaterThan(0);
    const r = decodeHomeReport(tiny.token);
    expect(r.ok && r.value.maneuversOmitted).toBe(tiny.report.maneuversOmitted);
  });
});

describe('ev dönemi raporu: reddetme', () => {
  const good = encodeHomeReport(buildHomeReport(data([episode(T0)]), { now: T0 + 60 * MIN })).token;

  it('sağlama toplamı tutmayan (bozulmuş/eksik) bağlantı reddedilir', () => {
    const [body, sum] = good.split('.') as [string, string];
    expect(decodeHomeReport(`${body}.00000000`)).toEqual({ ok: false, error: 'CHECKSUM' });
    const flipped = body.slice(0, 10) + (body[10] === 'A' ? 'B' : 'A') + body.slice(11);
    expect(decodeHomeReport(`${flipped}.${sum}`)).toEqual({ ok: false, error: 'CHECKSUM' });
    expect(decodeHomeReport(`${body.slice(0, -4)}.${sum}`)).toEqual({ ok: false, error: 'CHECKSUM' });
  });

  it('biçimsiz ve aşırı uzun bağlantı reddedilir', () => {
    expect(decodeHomeReport('')).toEqual({ ok: false, error: 'FORMAT' });
    expect(decodeHomeReport('abc')).toEqual({ ok: false, error: 'FORMAT' });
    expect(decodeHomeReport('a.b.c')).toEqual({ ok: false, error: 'FORMAT' });
    expect(decodeHomeReport('a+b/.12345678')).toEqual({ ok: false, error: 'FORMAT' });
    const huge = tokenOf({ v: 1, pad: 'x'.repeat(REPORT_TOKEN_MAX) });
    expect(decodeHomeReport(huge)).toEqual({ ok: false, error: 'SIZE' });
    // Sağlama toplamı doğru ama gövde JSON değil.
    const body = b64u('not json');
    expect(decodeHomeReport(`${body}.${fnv1a(`E${body}`)}`)).toEqual({ ok: false, error: 'FORMAT' });
  });

  it('reçete bağlantısı rapor olarak açılırsa "bu bir reçete" denir', () => {
    expect(decodeHomeReport(encodePrescription(rx))).toEqual({ ok: false, error: 'KIND' });
  });

  it('geçersiz alanlar reddedilir', () => {
    const base = JSON.parse(unb64u(good.split('.')[0]!)) as Record<string, unknown>;
    const ep = (base.e as Record<string, unknown>[])[0]!;
    const bad = (patch: (o: Record<string, unknown>, e: Record<string, unknown>) => void) => {
      const o = structuredClone(base);
      patch(o, (o.e as Record<string, unknown>[])[0]!);
      return decodeHomeReport(tokenOf(o));
    };
    expect(ep.u).toBe('r');
    expect(bad((_, e) => (e.u = 'z'))).toEqual({ ok: false, error: 'FIELDS' });
    expect(bad((_, e) => (e.d = 'X'))).toEqual({ ok: false, error: 'FIELDS' });
    const m0 = (e: Record<string, unknown>) => (e.m as unknown[][])[0]!;
    expect(m0(ep)[1]).toBe('e');
    expect(bad((_, e) => (m0(e)[1] = 'kafa-salla'))).toEqual({ ok: false, error: 'FIELDS' });
    expect(bad((_, e) => (m0(e)[1] = 'toString'))).toEqual({ ok: false, error: 'FIELDS' });
    expect(bad((_, e) => (m0(e)[1] = 'epley'))).toEqual({ ok: false, error: 'FIELDS' });
    expect(bad((_, e) => (m0(e)[0] = -5))).toEqual({ ok: false, error: 'FIELDS' });
    expect(bad((_, e) => (m0(e)[3] = 'cX'))).toEqual({ ok: false, error: 'FIELDS' });
    expect(bad((_, e) => (m0(e)[3] = 'nh'))).toEqual({ ok: false, error: 'FIELDS' });
    expect(bad((_, e) => ((m0(e)[6] as unknown[][])[0] = [30, 0, null, 1]))).toEqual({ ok: false, error: 'FIELDS' });
    expect(bad((o) => (o.c = 'ZZZZ'))).toEqual({ ok: false, error: 'FIELDS' });
    expect(bad((o) => (o.e = 'yok'))).toEqual({ ok: false, error: 'FIELDS' });
    expect(bad((o) => (o.e = Array.from({ length: 31 }, () => ({ s: ep.s, u: 'a' }))))).toEqual({ ok: false, error: 'FIELDS' });
    expect(bad((o) => (o.g = 1))).toEqual({ ok: false, error: 'FIELDS' });
  });
});

describe('ev dönemi raporu: sürümler', () => {
  const minimal = { v: 1, g: Math.floor(T0 / MIN), a: Math.floor(T0 / MIN), b: Math.floor(T0 / MIN) + 60, e: [{ s: Math.floor(T0 / MIN), u: 'a' }] };

  it('v1: yalnız zorunlu alanlı (eski/kısa) rapor çözülür; eksik isteğe bağlı alanlar varsayılanla dolar', () => {
    const r = decodeHomeReport(tokenOf(minimal));
    if (!r.ok) throw new Error(r.error);
    expect(r.value.episodes[0]).toEqual({ startedAt: T0, status: 'active', side: null, sideTests: [], maneuvers: [], retests: [] });
    expect(r.value.stepsDropped).toBe(false);
    expect(r.value.episodesOmitted).toBe(0);
  });

  it('v1: sonradan eklenen (tanınmayan) isteğe bağlı alanlar yok sayılır', () => {
    const r = decodeHomeReport(tokenOf({ ...minimal, yeniAlan: [1, 2, 3], e: [{ ...minimal.e[0], yeni: true }] }));
    expect(r.ok).toBe(true);
  });

  it('elle yazılmış v1 bağlantısı (e2e senaryosundaki) çözülür: Semont adım bayrakları ve yavaş geçiş', () => {
    const m = Math.floor(T0 / MIN);
    const r = decodeHomeReport(
      tokenOf({
        v: 1,
        g: m,
        p: 'NO-2611',
        c: '83635d6f',
        r: ['2026-10-31', 'R', 'e', 3, 5],
        a: m,
        b: m + 60,
        e: [
          {
            s: m,
            z: 1380,
            u: 'r',
            d: 'R',
            t: [[5, [1, 3, 20], [0, null, null], 'TR']],
            m: [[10, 's', 'R', 'chn', 1, 4, [[5, 0], [60, 6, 41, 2, 15], [60, 8], [30, 32]]]],
            q: [[1320, 'm', 'R', 0, null, null]]
          }
        ]
      })
    );
    if (!r.ok) throw new Error(r.error);
    const mv = r.value.episodes[0]!.maneuvers[0]!;
    expect(mv).toMatchObject({ protocolId: 'semont', completed: true, assisted: true, afterSymptoms: 'none', pauses: 1, stepCount: 4 });
    expect(mv.steps!.map((x) => x.flags)).toEqual([[], ['slowTransition', 'movedBeforeCommand'], ['noSitThrough'], ['borderline']]);
    expect(mv.steps![1]!.transitionSec).toBe(4.1);
    expect(r.value.episodes[0]!.sideTests[0]!.decision).toEqual({ kind: 'TREAT', side: 'R', note: null });
  });

  it('daha yeni ya da bilinmeyen sürüm "güncelleyin" hatasıyla reddedilir', () => {
    expect(decodeHomeReport(tokenOf({ ...minimal, v: 2 }))).toEqual({ ok: false, error: 'VERSION' });
    expect(decodeHomeReport(tokenOf({ ...minimal, v: 0 }))).toEqual({ ok: false, error: 'VERSION' });
    expect(decodeHomeReport(tokenOf({ ...minimal, v: '1' }))).toEqual({ ok: false, error: 'VERSION' });
  });
});

describe('ev dönemi raporu: bağlantı', () => {
  it('bağlantı üretilir; yapıştırılan bağlantıdan token ve kimlik çıkarılır', () => {
    const token = encodeHomeReport(buildHomeReport(data([episode(T0)]), { now: T0 })).token;
    const url = homeReportUrl('https://ornek.app/dengeyol/#/hasta/rapor/x', token);
    expect(url).toBe(`https://ornek.app/dengeyol/#/odyolog/ev-raporu/${token}`);
    expect(extractReportToken(`Rapor: ${url} `)).toBe(token);
    expect(extractReportToken(token)).toBe(token);
    expect(extractReportToken('https://ornek.app/#/recete/abc.12345678')).toBeNull();
    expect(homeReportId(token)).toBe(token.split('.')[1]);
  });
});
