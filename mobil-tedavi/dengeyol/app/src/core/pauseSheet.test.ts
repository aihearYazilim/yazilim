import { describe, expect, it } from 'vitest';
import * as pauseSheetModule from './pauseSheet';
import {
  armedChoice,
  confirmDeadline,
  confirmPromptSpoken,
  CONFIRM_PROMPT,
  CONFIRM_WINDOW_MS,
  initialPauseSheet,
  type PauseSheetState,
  pauseSheetHold,
  pauseSheetStopSpoken,
  pauseSheetTap,
  type SheetTarget,
  startStopCountdown,
  STOP_COUNT_WORDS,
  STOP_UNDO_MS,
  STOP_UNDO_PROMPT,
  stopCountdownTap,
  stopCountSchedule,
  stopDeadline,
  stopDue,
  stopPromptSpoken,
  stopSecondsLeft
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
  it('baş dönmesi işaretliyken ilk dokunuş ("Devam et" dışında) nereye denk gelirse gelsin "geçti"dir; düğme çalışmaz', () => {
    // "Devam et" her zaman devam eder (yeni kullanıcı turu 3, N2-1); bkz. aşağıdaki N2-1 testleri.
    for (const target of ['unreachable', 'unwell', 'abort', 'background', 'vertigoEnd', 'confirm'] as SheetTarget[]) {
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

describe('yeni kullanıcı turu 3 (N2-1; y06, y07): tek ve sabit dokunuş kuralı', () => {
  const hold = (st: PauseSheetState, now: number, promptMs = 0) => pauseSheetHold(st, { now, patient: true, promptMs });

  it('"Devam et"e tek dokunuş hemen devam eder; çift dokunuşun ikincisi de "kötüyüm" kurmaz (çift dokunuş anlamı ve bekleme yok)', () => {
    const one = pauseSheetTap(initialPauseSheet(), 'resume', patient(0));
    expect(one.action).toEqual({ kind: 'resume' });
    // y06: hızlı çift dokunuş. İlki devam eder (sayfa kapanır); sayfa açık kalsa bile ikincisi yine devamdır.
    const a = taps([
      { target: 'resume', at: 0 },
      { target: 'resume', at: 150 }
    ]);
    expect(a).toEqual([{ kind: 'resume' }, { kind: 'resume' }]);
    // Eski çift dokunuş/erteleme yolları kaldırıldı.
    expect('pauseSheetDoubleTap' in pauseSheetModule).toBe(false);
    expect('deferSheetTap' in pauseSheetModule).toBe(false);
    expect('DOUBLE_TAP_MS' in pauseSheetModule).toBe(false);
  });

  it('baş dönmesi işaretliyken de "Devam et" devam eder; başka yere ilk dokunuş "geçti"', () => {
    expect(pauseSheetTap(initialPauseSheet(), 'resume', patient(0, true)).action).toEqual({ kind: 'resume' });
    expect(pauseSheetTap(initialPauseSheet(), 'background', patient(0, true)).action).toEqual({ kind: 'vertigoEnd' });
  });

  it('boş yere kısa kör dokunuşlar (tek, çift, art arda) hiçbir şey seçmez', () => {
    const a = taps([
      { target: 'background', at: 0 },
      { target: 'background', at: 120 },
      { target: 'background', at: 900 }
    ]);
    expect(a.every((x) => x.kind === 'none')).toBe(true);
  });

  it('2 s basılı tutma HER ZAMAN geri alınabilir durdurma başlatır (kurulu seçim yokken, varken, baş dönmesi işaretliyken)', () => {
    const fresh = hold(initialPauseSheet(), 1000);
    expect(fresh.action).toEqual({ kind: 'stopStart' });
    expect(fresh.state.stopping).toEqual({ at: 1000, promptDoneAt: null, promptMs: 0 });
    // Düğmeyle kurulan seçim varken de durdurur; kurulu seçim kalkar.
    const armed = pauseSheetTap(initialPauseSheet(), 'abort', patient(0)).state;
    const r = hold(armed, 500);
    expect(r.action).toEqual({ kind: 'stopStart' });
    expect(r.state.armed).toBeNull();
    // Süren geri sayımı yeniden başlatmaz.
    expect(hold(fresh.state, 1500)).toEqual({ state: fresh.state, action: { kind: 'none' } });
    // Klinisyende basılı tutma yok.
    expect(pauseSheetHold(initialPauseSheet(), { now: 0, patient: false }).action).toEqual({ kind: 'none' });
  });

  it('y07 senaryosu: iki dokunuş, 30 s sonra 2 s basılı tutma → durdurur (sessizce dolan onay yok, "devam" sayılmaz)', () => {
    let st: PauseSheetState = initialPauseSheet();
    for (const at of [0, 180]) st = pauseSheetTap(st, 'background', patient(at)).state;
    expect(st.armed).toBeNull();
    const r = hold(st, 30180);
    expect(r.action).toEqual({ kind: 'stopStart' });
    expect(stopDue(r.state.stopping, 30180 + STOP_UNDO_MS - 1)).toBe(false);
    expect(stopDue(r.state.stopping, 30180 + STOP_UNDO_MS)).toBe(true);
    // Basılı tutma hiçbir durumda "devam" eylemi vermez.
    expect(r.action.kind).not.toBe('resume');
  });

  it('geri sayım sürerken yalnız "Devam et" geri alır (ve devam eder); başka dokunuş hiçbir şey yapmaz', () => {
    const st = hold(initialPauseSheet(), 0).state;
    for (const target of ['background', 'unwell', 'unreachable', 'abort', 'confirm', 'replay', 'vertigoEnd'] as SheetTarget[]) {
      const r = pauseSheetTap(st, target, patient(1000, target === 'vertigoEnd'));
      expect(r.action, target).toEqual({ kind: 'none' });
      expect(r.state).toBe(st);
    }
    const undo = pauseSheetTap(st, 'resume', patient(4000));
    expect(undo.action).toEqual({ kind: 'resume' });
    expect(undo.state.stopping).toBeNull();
    expect(stopCountdownTap('resume')).toBe('undo');
    expect(stopCountdownTap('other')).toBe('none');
  });

  it('geri sayım geri alma cümlesi bittikten sonra başlar, 5 s sürer; saniyede bir sayı (Beş … Bir)', () => {
    expect(STOP_UNDO_MS).toBe(5000);
    expect(STOP_UNDO_PROMPT).toBe("Durduruyorum. Yanlışsa ekrandaki Devam et'e dokunun.");
    let st = hold(initialPauseSheet(), 1000, 9000).state;
    const c0 = st.stopping!;
    // Bitiş olayı gelmezse tahmin: 1000 + 9000 + 5000.
    expect(stopDeadline(c0)).toBe(15000);
    expect(stopSecondsLeft(c0, 2000)).toBe(5);
    // Cümle 4,2 s'de bitti: sayım oradan başlar.
    st = pauseSheetStopSpoken(st, 1000, 4200);
    const c = st.stopping!;
    expect(stopDeadline(c)).toBe(4200 + STOP_UNDO_MS);
    expect(stopCountSchedule(c)).toEqual([
      { n: 5, at: 4200 },
      { n: 4, at: 5200 },
      { n: 3, at: 6200 },
      { n: 2, at: 7200 },
      { n: 1, at: 8200 }
    ]);
    expect([5, 4, 3, 2, 1].map((n) => STOP_COUNT_WORDS[n])).toEqual(['Beş', 'Dört', 'Üç', 'İki', 'Bir']);
    expect(stopSecondsLeft(c, 4200)).toBe(5);
    expect(stopSecondsLeft(c, 8300)).toBe(1);
    expect(stopSecondsLeft(c, 9200)).toBe(0);
    // İkinci ya da başka sayıma ait bitiş olayı değişiklik yapmaz; süresi dolmuşa da işlemez.
    expect(pauseSheetStopSpoken(st, 1000, 6000)).toBe(st);
    expect(stopPromptSpoken(c0, 999, 3000)).toBe(c0);
    const silent = startStopCountdown(0, 0);
    expect(stopPromptSpoken(silent, 0, STOP_UNDO_MS + 1)).toBe(silent);
    expect(stopDeadline(silent)).toBe(STOP_UNDO_MS);
  });

  it('klinisyende dokunuş davranışı değişmedi: "Devam et" devam, seçim tek dokunuşla', () => {
    const c = { now: 0, vertigoActive: false, patient: false };
    expect(pauseSheetTap(initialPauseSheet(), 'resume', c).action).toEqual({ kind: 'resume' });
    expect(pauseSheetTap(initialPauseSheet(), 'unwell', c).action).toEqual({ kind: 'commit', choice: 'unwell' });
    expect(pauseSheetTap(initialPauseSheet(), 'background', c).action).toEqual({ kind: 'none' });
  });
});
