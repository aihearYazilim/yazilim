import { describe, expect, it } from 'vitest';
import {
  armedChoice,
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

  it('kurulunca söylenen söz önce eylemi söyler', () => {
    expect(CONFIRM_PROMPT.startsWith('Emin misiniz? Onaylamak için ekranın üstündeki "Evet" düğmesine dokunun.')).toBe(true);
  });
});
