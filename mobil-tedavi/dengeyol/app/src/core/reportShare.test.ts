import { describe, expect, it } from 'vitest';
import { emptyData, type AppData, type Episode, type ManeuverLog } from '../state/types';
import { encodePrescription, fnv1a, type Prescription, rxCode, rxIssuedAt, rxValidUntil } from './prescription';
import {
  homeStepOf,
  buildHomeReport,
  decodeHomeReport,
  encodeHomeReport,
  encodeHomeReportRaw,
  extractReportToken,
  homeReportDatesText,
  homeReportId,
  homeReportUrl,
  homeReportVersion,
  REPORT_DECODE_ERROR_TEXT,
  REPORT_SHARE_VERSION,
  REPORT_TOKEN_BUDGET,
  REPORT_TOKEN_MAX,
  selectReportEpisodes
} from './reportShare';
import { PROTOCOLS } from './protocols';
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
    expect(decodeHomeReport(tokenOf({ ...minimal, v: REPORT_SHARE_VERSION + 1 }))).toEqual({ ok: false, error: 'VERSION' });
    expect(decodeHomeReport(tokenOf({ ...minimal, v: 0 }))).toEqual({ ok: false, error: 'VERSION' });
    expect(decodeHomeReport(tokenOf({ ...minimal, v: '1' }))).toEqual({ ok: false, error: 'VERSION' });
  });

  it('sürüm hatası metni klinisyene uygulamayı güncellemesini ve bağlantıyı yeniden açmasını söyler', () => {
    expect(REPORT_DECODE_ERROR_TEXT.VERSION).toMatch(/daha yeni bir sürümüyle/);
    expect(REPORT_DECODE_ERROR_TEXT.VERSION).toMatch(/Uygulamayı güncelleyin/);
    expect(REPORT_DECODE_ERROR_TEXT.VERSION).toMatch(/yeniden okutun/);
  });
});

describe('ev dönemi raporu: biçim v2 (kullanıcı turu 6; k09, k02, k10)', () => {
  const wireOf = (token: string) => JSON.parse(unb64u(token.split('.')[0]!)) as Record<string, unknown>;
  const prone = () =>
    maneuver(T0 + 10 * MIN, {
      completed: false,
      stopReason: 'POSITION_UNREACHABLE',
      records: [rec('ep-sit'), rec('ep-1'), rec('ep-2'), rec('ep-3', { wrongSide: true, proneArrival: true, holdSec: 0 })]
    });
  const stops: NonNullable<Episode['testStops']> = [
    { at: T0 + 3 * MIN, test: 'side', side: 'R', reason: 'USER_FEELS_UNWELL' },
    { at: T0 + 70 * MIN, test: 'retest', side: 'L', reason: 'USER_FEELS_UNWELL' }
  ];

  it('yüzüstünden gelme bayrağı ve testte durdurmalar gidiş-dönüşte korunur; bağlantı v2', () => {
    const d = data([episode(T0, { status: 'active', endedAt: undefined, endNote: undefined, maneuvers: [prone()], testStops: stops })]);
    const rep = buildHomeReport(d, { now: T0 + 2 * 60 * MIN });
    expect(rep.v).toBe(2);
    const { token, report, truncated } = encodeHomeReport(rep);
    expect(truncated).toBe(false);
    expect(wireOf(token).v).toBe(2);
    const r = decodeHomeReport(token);
    if (!r.ok) throw new Error(r.error);
    expect(r.value).toEqual(report);
    expect(r.value.v).toBe(2);
    expect(r.value.episodes[0]!.maneuvers[0]!.steps![3]!.flags).toEqual(['wrongSide', 'proneArrival']);
    expect(r.value.episodes[0]!.testStops).toEqual(stops);
  });

  it('yalnız biri yeterli: testte durdurma tek başına da, yüzüstünden gelme tek başına da v2 yazar', () => {
    const onlyStops = buildHomeReport(data([episode(T0, { testStops: stops.slice(0, 1) })]), { now: T0 + 60 * MIN });
    expect(wireOf(encodeHomeReport(onlyStops).token).v).toBe(2);
    const onlyProne = buildHomeReport(data([episode(T0, { maneuvers: [prone()] })]), { now: T0 + 60 * MIN });
    expect(wireOf(encodeHomeReport(onlyProne).token).v).toBe(2);
  });

  it('v2\'ye özgü bilgi yoksa bağlantı v1 kalır (eski klinisyen uygulamaları okuyabilsin); boş testStops da v1', () => {
    const d = data([episode(T0, { testStops: [] })]);
    const rep = buildHomeReport(d, { now: T0 + 60 * MIN });
    expect(rep.v).toBe(1);
    expect(rep.episodes[0]!.testStops).toBeUndefined();
    const { token } = encodeHomeReport(rep);
    const w = wireOf(token);
    expect(w.v).toBe(1);
    expect(JSON.stringify(w)).not.toMatch(/"y":/);
    // v1 çözücünün kabul ettiği bayrak aralığında (8 bit).
    const flags = ((w.e as { m: unknown[][] }[])[0]!.m.flatMap((m) => (m[6] as number[][] | undefined) ?? [])).map((st) => st[1]!);
    expect(Math.max(...flags)).toBeLessThan(1 << 8);
    const r = decodeHomeReport(token);
    expect(r.ok && r.value).toEqual(rep);
  });

  it('adım ayrıntısı bütçe yüzünden çıkınca yüzüstü bayrağı da çıkar: başka v2 bilgisi yoksa bağlantı v1', () => {
    const ms = Array.from({ length: 15 }, (_, i) => (i === 0 ? prone() : maneuver(T0 + (20 + i * 30) * MIN)));
    const rep = buildHomeReport(data([episode(T0, { maneuvers: ms })]), { now: T0 + 2 * 24 * 60 * MIN });
    expect(rep.v).toBe(2);
    const { token, report, truncated } = encodeHomeReport(rep);
    expect(truncated).toBe(true);
    expect(report.stepsDropped).toBe(true);
    expect(report.v).toBe(1);
    expect(wireOf(token).v).toBe(1);
    expect(homeReportVersion(report)).toBe(1);
    const r = decodeHomeReport(token);
    expect(r.ok && r.value).toEqual(report);
  });

  it('bütçe: testte durdurmalar da en eskiden kısaltılır, en az biri kalır', () => {
    const many = Array.from({ length: 20 }, (_, i) => ({ at: T0 + i * MIN, test: 'side' as const, side: 'R' as const, reason: 'USER_FEELS_UNWELL' as const }));
    const rep = buildHomeReport(data([episode(T0, { testStops: many })]), { now: T0 + 60 * MIN });
    const tiny = encodeHomeReport(rep, 200);
    expect(tiny.report.episodes[0]!.testStops).toHaveLength(1);
    expect(tiny.report.episodes[0]!.testStops![0]!.at).toBe(T0 + 19 * MIN);
    const r = decodeHomeReport(tiny.token);
    expect(r.ok && r.value).toEqual(tiny.report);
  });

  it('v1 uyumluluğu: v1 bağlantısında 9. bayrak biti geçersiz, "y" alanı yok sayılır; v2\'de ikisi okunur', () => {
    const m = Math.floor(T0 / MIN);
    const ep = { s: m, u: 'a', d: 'R', m: [[10, 'e', 'R', 'P', 0, 4, [[5, 0], [30, 0], [30, 0], [0, 16 | 256]]]], y: [[3, 's', 'R', 'U']] };
    const v1 = { v: 1, g: m + 60, a: m, b: m + 60, e: [{ ...ep, m: [[10, 'e', 'R', 'P', 0, 4, [[5, 0], [30, 0], [30, 0], [0, 16]]]] }] };
    const r1 = decodeHomeReport(tokenOf(v1));
    if (!r1.ok) throw new Error(r1.error);
    expect(r1.value.episodes[0]!.testStops).toBeUndefined();
    expect(r1.value.episodes[0]!.maneuvers[0]!.steps![3]!.flags).toEqual(['wrongSide']);
    expect(decodeHomeReport(tokenOf({ ...v1, e: [ep] }))).toEqual({ ok: false, error: 'FIELDS' });
    const r2 = decodeHomeReport(tokenOf({ ...v1, v: 2, e: [ep] }));
    if (!r2.ok) throw new Error(r2.error);
    expect(r2.value.episodes[0]!.maneuvers[0]!.steps![3]!.flags).toEqual(['wrongSide', 'proneArrival']);
    expect(r2.value.episodes[0]!.testStops).toEqual([{ at: T0 + 3 * MIN, test: 'side', side: 'R', reason: 'USER_FEELS_UNWELL' }]);
  });

  it('v2: geçersiz testte durdurma kaydı reddedilir', () => {
    const m = Math.floor(T0 / MIN);
    const bad = (y: unknown) => decodeHomeReport(tokenOf({ v: 2, g: m, a: m, b: m + 60, e: [{ s: m, u: 'a', y }] }));
    expect(bad([[3, 's', 'R', 'U']]).ok).toBe(true);
    expect(bad([[3, 'x', 'R', 'U']])).toEqual({ ok: false, error: 'FIELDS' });
    expect(bad([[3, 's', 'X', 'U']])).toEqual({ ok: false, error: 'FIELDS' });
    expect(bad([[3, 's', 'R', 'V']])).toEqual({ ok: false, error: 'FIELDS' });
    expect(bad([[3, 's', 'R']])).toEqual({ ok: false, error: 'FIELDS' });
    expect(bad([[-1, 's', 'R', 'U']])).toEqual({ ok: false, error: 'FIELDS' });
    expect(bad('yok')).toEqual({ ok: false, error: 'FIELDS' });
    expect(bad(Array.from({ length: 21 }, () => [3, 's', 'R', 'U']))).toEqual({ ok: false, error: 'FIELDS' });
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

describe('adım başlıkları (kullanıcı turu 4, k10)', () => {
  it('tarafı doldurulmuş başlık; şablon belirteci "{" kalmaz', () => {
    const titles = (['epley', 'semont'] as const).flatMap((id) =>
      (['R', 'L', null] as const).flatMap((sd) =>
        PROTOCOLS[id].steps.map((_, i) => homeStepOf(id, rec('x', { title: 'kayıt' }), i, sd).title)
      )
    );
    expect(titles.every((t) => !t.includes('{'))).toBe(true);
    expect(homeStepOf('epley', rec('x', { title: 'kayıt' }), 0, 'R').title).toMatch(/sağ/);
  });
});


describe('rapor tarihleri ayrı adlarla (kullanıcı turu 5, k09)', () => {
  const ep = (y: number, mo: number, d: number) => ({ startedAt: new Date(y, mo, d, 9, 0).getTime() }) as never;
  const rx = { date: '2026-10-16', side: 'R' as const, maneuver: 'epley' as const, perDay: 3, days: 5 };

  it('reçete tarihi + son geçerli gün (dahil), atakların başlangıç tarihleri, rapor günü', () => {
    const g = new Date(2026, 9, 31, 18, 0).getTime();
    expect(homeReportDatesText({ generatedAt: g, rx, episodes: [ep(2026, 9, 17), ep(2026, 9, 25)] })).toBe(
      'reçete 16.10 (geçerlilik 29.10 dahil) · ataklar 17.10–25.10 · rapor 31.10'
    );
    expect(homeReportDatesText({ generatedAt: g, rx, episodes: [ep(2026, 9, 25)] })).toBe('reçete 16.10 (geçerlilik 29.10 dahil) · atak 25.10 · rapor 31.10');
    expect(homeReportDatesText({ generatedAt: g, episodes: [ep(2026, 9, 25), ep(2026, 9, 25)] })).toBe('ataklar 25.10 · rapor 31.10');
    expect(homeReportDatesText({ generatedAt: g, episodes: [] })).toBe('atak yok · rapor 31.10');
  });

  it('yıl değişiyorsa bütün tarihler yıllı yazılır', () => {
    const r = { generatedAt: new Date(2027, 0, 3, 10, 0).getTime(), rx: { ...rx, date: '2026-12-28' }, episodes: [ep(2026, 11, 30), ep(2027, 0, 2)] };
    expect(homeReportDatesText(r)).toBe('reçete 28.12.2026 (geçerlilik 10.01.2027 dahil) · ataklar 30.12.2026–02.01.2027 · rapor 03.01.2027');
  });
});
