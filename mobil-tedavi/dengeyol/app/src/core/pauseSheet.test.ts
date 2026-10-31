import { describe, expect, it } from 'vitest';
import {
  armedChoice,
  confirmDeadline,
  confirmPromptSpoken,
  CONFIRM_PROMPT,
  CONFIRM_WINDOW_MS,
  initialPauseSheet,
  type PauseSheetState,
  pauseSheetTap,
  type SheetTarget
} from './pauseSheet';

const patient = (now: number, vertigoActive = false) => ({ now, vertigoActive, patient: true });

/** Dokunuş dizisi: her adımda baş dönmesinin işaretli olup olmadığı ayrıca verilir. */
function taps(seq: { target: SheetTarget; at: number; vertigo?: boolean }[]) {
  let st: PauseSheetState = initialPauseSheet();
  return seq.map((t) => {
    const r = pauseSheetTap(st, t.target, patient(t.at, t.vertigo));
    st = r.state;
    return r.action;
  });
}

describe('tur 3 F1-1: duraklatma sayfasında kalıcı sonuçlu düğmeler onay ister (k01)', () => {
  it('baş dönmesi işaretliyken ilk dokunuş nereye denk gelirse gelsin "geçti"dir; düğme çalışmaz', () => {
    for (const target of ['unreachable', 'unwell', 'abort', 'resume', 'background', 'vertigoEnd', 'confirm'] as SheetTarget[]) {
      const r = pauseSheetTap(initialPauseSheet(), target, patient(0, true));
      expect(r.action, target).toEqual({ kind: 'vertigoEnd' });
      expect(r.state.armed).toBeNull();
    }
  });

  it('k01 senaryosu: kör tek dokunuş "geçti", aynı yere ikinci kör dokunuş yalnız kurar, üçüncüsü de onaylamaz', () => {
    const a = taps([
      { target: 'unreachable', at: 0, vertigo: true },
      { target: 'unreachable', at: 800 },
      { target: 'unreachable', at: 1600 }
    ]);
    expect(a[0]).toEqual({ kind: 'vertigoEnd' });
    expect(a[1]).toEqual({ kind: 'arm', choice: 'unreachable' });
    expect(a[2]).toEqual({ kind: 'none' });
    expect(a.some((x) => x.kind === 'commit')).toBe(false);
  });

  it('ilk dokunuş kurar; süre içinde "Evet … eminim" onaylar', () => {
    for (const choice of ['unwell', 'unreachable', 'abort'] as const) {
      const a = taps([
        { target: choice, at: 0 },
        { target: 'confirm', at: CONFIRM_WINDOW_MS - 100 }
      ]);
      expect(a).toEqual([{ kind: 'arm', choice }, { kind: 'commit', choice }]);
    }
  });

  it('onay süresi dolunca kalkar; geç gelen "Evet" hiçbir şey yapmaz', () => {
    let st = pauseSheetTap(initialPauseSheet(), 'abort', patient(0)).state;
    expect(armedChoice(st, CONFIRM_WINDOW_MS - 1)).toBe('abort');
    expect(armedChoice(st, CONFIRM_WINDOW_MS)).toBeNull();
    const r = pauseSheetTap(st, 'confirm', patient(CONFIRM_WINDOW_MS + 1));
    expect(r.action).toEqual({ kind: 'none' });
    st = r.state;
    expect(st.armed).toBeNull();
  });

  it('boş yere dokunuş onayı bozmaz; başka düğme onu kurar; "Devam et" onayı kaldırır', () => {
    const a = taps([
      { target: 'unwell', at: 0 },
      { target: 'background', at: 500 },
      { target: 'abort', at: 1000 },
      { target: 'confirm', at: 1500 }
    ]);
    expect(a).toEqual([
      { kind: 'arm', choice: 'unwell' },
      { kind: 'none' },
      { kind: 'arm', choice: 'abort' },
      { kind: 'commit', choice: 'abort' }
    ]);
    const b = taps([
      { target: 'unreachable', at: 0 },
      { target: 'resume', at: 500 },
      { target: 'confirm', at: 900 }
    ]);
    expect(b).toEqual([{ kind: 'arm', choice: 'unreachable' }, { kind: 'resume' }, { kind: 'none' }]);
  });

  it('kurulmadan gelen "Evet" ya da görünmeyen "geçti" düğmesi yok sayılır', () => {
    expect(pauseSheetTap(initialPauseSheet(), 'confirm', patient(0)).action).toEqual({ kind: 'none' });
    expect(pauseSheetTap(initialPauseSheet(), 'vertigoEnd', patient(0)).action).toEqual({ kind: 'none' });
  });

  it('klinisyen ekranı görür: onay istenmez', () => {
    const r = pauseSheetTap(initialPauseSheet(), 'abort', { now: 0, vertigoActive: true, patient: false });
    expect(r.action).toEqual({ kind: 'commit', choice: 'abort' });
  });

  it('kurulunca söylenen söz kısa ve yalnız eylemi söyler (tur 4)', () => {
    expect(CONFIRM_PROMPT).toBe('Eminseniz üstteki "Evet"e dokunun.');
    // "Yavaş" seste (0,8) de birkaç saniye: ~13 harf/s × 0,8.
    expect(CONFIRM_PROMPT.length / (13 * 0.8)).toBeLessThan(4);
  });
});

describe('tur 4 G1-1: onay penceresi onay cümlesi bittikten sonra başlar ve en az 15 s sürer (k01)', () => {
  /** "Yavaş" seste 12,8 s süren eski cümle gibi uzun bir okuma: tahmin 13 s, gerçek bitiş 12,8 s. */
  const slow = { now: 0, vertigoActive: false, patient: true, promptMs: 13000 };

  it('pencere en az 15 s', () => {
    expect(CONFIRM_WINDOW_MS).toBeGreaterThanOrEqual(15000);
  });

  it('cümle bitince başlar: 12,8 s süren cümleden sonra 15 s içinde "Evet" onaylar', () => {
    let st = pauseSheetTap(initialPauseSheet(), 'unwell', slow).state;
    expect(st.armed).toBe('unwell');
    // Cümle sürerken (bitiş olayı gelmeden) pencere açık.
    expect(armedChoice(st, 10000)).toBe('unwell');
    st = confirmPromptSpoken(st, 0, 12800);
    expect(confirmDeadline(st)).toBe(12800 + CONFIRM_WINDOW_MS);
    // Cümleyi sonuna kadar dinleyip 14 s sonra ekrana bakan hasta yetişir (k01 B4: eski kuralda 5 s'de kalkıyordu).
    const r = pauseSheetTap(st, 'confirm', { ...slow, now: 12800 + 14000 });
    expect(r.action).toEqual({ kind: 'commit', choice: 'unwell' });
    // Süre dolunca kalkar.
    expect(armedChoice(st, 12800 + CONFIRM_WINDOW_MS)).toBeNull();
  });

  it('bitiş olayı gelmezse tahmini bitişten sonra 15 s', () => {
    const st = pauseSheetTap(initialPauseSheet(), 'abort', slow).state;
    expect(confirmDeadline(st)).toBe(13000 + CONFIRM_WINDOW_MS);
    expect(armedChoice(st, 13000 + CONFIRM_WINDOW_MS - 1)).toBe('abort');
    expect(armedChoice(st, 13000 + CONFIRM_WINDOW_MS)).toBeNull();
  });

  it('bitiş tahminden erken gelirse pencere ondan başlar (yine en az 15 s); ses yoksa kurulmadan başlar', () => {
    let st = pauseSheetTap(initialPauseSheet(), 'abort', slow).state;
    st = confirmPromptSpoken(st, 0, 3000);
    expect(confirmDeadline(st)).toBe(3000 + CONFIRM_WINDOW_MS);
    const silent = pauseSheetTap(initialPauseSheet(), 'abort', { ...slow, promptMs: 0 }).state;
    expect(confirmDeadline(silent)).toBe(CONFIRM_WINDOW_MS);
  });

  it('eski kuruluşa ait (geç gelen) bitiş olayı, ikinci bitiş ve süresi dolmuş onay yok sayılır', () => {
    const a = pauseSheetTap(initialPauseSheet(), 'unwell', slow).state;
    // Başka düğme kuruldu: yeni cümle eskisini keser; eskisinin bitiş olayı yeni pencereyi kısaltmaz.
    const b = pauseSheetTap(a, 'abort', { ...slow, now: 2000 }).state;
    expect(confirmPromptSpoken(b, 0, 2100)).toBe(b);
    const c = confirmPromptSpoken(b, 2000, 5000);
    expect(c.promptDoneAt).toBe(5000);
    expect(confirmPromptSpoken(c, 2000, 9000)).toBe(c);
    // Pencere kapandıktan sonra gelen olay onu yeniden açmaz.
    const late = pauseSheetTap(initialPauseSheet(), 'unwell', { ...slow, promptMs: 0 }).state;
    expect(armedChoice(confirmPromptSpoken(late, 0, CONFIRM_WINDOW_MS + 500), CONFIRM_WINDOW_MS + 600)).toBeNull();
  });

  it('kör ikinci dokunuş koruması aynen: uzun pencerede de aynı yere dokunuş onaylamaz', () => {
    let st = pauseSheetTap(initialPauseSheet(), 'unwell', slow).state;
    st = confirmPromptSpoken(st, 0, 4000);
    for (const at of [1000, 5000, 12000, 18000]) {
      const r = pauseSheetTap(st, 'unwell', { ...slow, now: at });
      expect(r.action, String(at)).toEqual({ kind: 'none' });
      expect(r.state).toBe(st);
    }
  });

  it('"Tekrar dinle" kurulmuş onayı bozmaz; baş dönmesi işaretliyken ilk dokunuş yine "geçti"', () => {
    const st = pauseSheetTap(initialPauseSheet(), 'abort', slow).state;
    const r = pauseSheetTap(st, 'replay', { ...slow, now: 1000 });
    expect(r.action).toEqual({ kind: 'replay' });
    expect(r.state).toBe(st);
    expect(pauseSheetTap(initialPauseSheet(), 'replay', { ...slow, vertigoActive: true }).action).toEqual({ kind: 'vertigoEnd' });
    expect(pauseSheetTap(initialPauseSheet(), 'replay', { now: 0, vertigoActive: false, patient: false }).action).toEqual({
      kind: 'replay'
    });
  });
});
