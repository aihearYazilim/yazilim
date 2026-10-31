/**
 * Duraklatma sayfası dokunuş kuralı (saf; arayüzden bağımsız, birim testli).
 *
 * Hasta ekranı göremez; sesin "geçtiyse ekrana bir kez dokunun" dediği anda kör dokunuş bir düğmeye denk gelebilir (k01, tur 3).
 *   - Baş dönmesi işaretliyken sayfadaki İLK kısa dokunuş, nereye denk gelirse gelsin "geçti" sayılır; hiçbir düğmeyi
 *     çalıştırmaz.
 *   - Kalıcı sonuçlu düğmeler ("Kendimi kötü hissediyorum", "Pozisyona gelemiyorum", "Şimdilik bırak") tek dokunuşla
 *     çalışmaz: ilk dokunuş düğmeyi "kurar"; sayfanın ÜSTÜNDE beliren "Evet, … — eminim" düğmesine CONFIRM_WINDOW_MS
 *     içinde dokunmak onaylar. Kurulan düğmenin yerinde dokunulamayan bir not durur: aynı yere ikinci kör dokunuş hiçbir
 *     şey yapmaz. Süre dolunca onay kendiliğinden kalkar.
 *   - "Devam" ekranın herhangi bir yerine 2 s basılı tutmakla (arayüz) ya da "Devam et" düğmesiyle; geri alınabilir.
 * Klinisyen ekranı görür: onay istenmez.
 */

/** Kalıcı sonuçlu seçimler. */
export type PauseChoice = 'unwell' | 'unreachable' | 'abort';

/** Onay düğmesinin görünür kalma süresi (ms). */
export const CONFIRM_WINDOW_MS = 5000;

/** Seçim kurulunca söylenen söz (ekrana bakmadan dokunan da bir şey olduğunu bilsin; önce eylem). */
export const CONFIRM_PROMPT =
  'Emin misiniz? Onaylamak için ekranın üstündeki "Evet" düğmesine dokunun. Yanlışlıkla dokunulduysa bir şey yapmayın.';

export interface PauseSheetState {
  armed: PauseChoice | null;
  armedAt: number | null;
}

export const initialPauseSheet = (): PauseSheetState => ({ armed: null, armedAt: null });

/** Dokunulan yer: bir seçim düğmesi, onay düğmesi, "Devam et", "Baş dönmesi geçti" ya da sayfanın boş bir yeri. */
export type SheetTarget = PauseChoice | 'confirm' | 'resume' | 'vertigoEnd' | 'background';

export type SheetAction =
  | { kind: 'none' }
  | { kind: 'vertigoEnd' }
  | { kind: 'resume' }
  | { kind: 'arm'; choice: PauseChoice }
  | { kind: 'commit'; choice: PauseChoice };

/** Onay hâlâ geçerli mi (süresi dolmadı)? */
export function armedChoice(st: PauseSheetState, now: number): PauseChoice | null {
  if (st.armed === null || st.armedAt === null) return null;
  return now - st.armedAt < CONFIRM_WINDOW_MS ? st.armed : null;
}

/**
 * Bir kısa dokunuşun sonucu. (Uzun basış hiçbir düğmeyi seçmez; onu arayüz ayıklar.)
 * `patient`: hasta modu (onay ve "ilk dokunuş geçti" kuralları yalnız burada).
 */
export function pauseSheetTap(
  st: PauseSheetState,
  target: SheetTarget,
  ctx: { now: number; vertigoActive: boolean; patient: boolean }
): { state: PauseSheetState; action: SheetAction } {
  const cleared = initialPauseSheet();
  if (!ctx.patient) {
    if (target === 'resume') return { state: cleared, action: { kind: 'resume' } };
    if (target === 'vertigoEnd') return { state: cleared, action: { kind: 'vertigoEnd' } };
    if (target === 'unwell' || target === 'unreachable' || target === 'abort') {
      return { state: cleared, action: { kind: 'commit', choice: target } };
    }
    return { state: st, action: { kind: 'none' } };
  }
  // Baş dönmesi işaretliyken ilk dokunuş her yerde "geçti"dir; kurulmuş bir onay da kalkar.
  if (ctx.vertigoActive) return { state: cleared, action: { kind: 'vertigoEnd' } };
  const armed = armedChoice(st, ctx.now);
  switch (target) {
    case 'confirm':
      return armed ? { state: cleared, action: { kind: 'commit', choice: armed } } : { state: cleared, action: { kind: 'none' } };
    case 'resume':
      return { state: cleared, action: { kind: 'resume' } };
    case 'vertigoEnd':
      // Baş dönmesi işaretli değilken bu düğme görünmez; gelen dokunuş yok sayılır.
      return { state: st, action: { kind: 'none' } };
    case 'background':
      return { state: armed ? st : cleared, action: { kind: 'none' } };
    default:
      // Kurulmuş düğmenin yerine ikinci dokunuş onaylamaz (orada artık dokunulamayan not var).
      if (armed === target) return { state: st, action: { kind: 'none' } };
      return { state: { armed: target, armedAt: ctx.now }, action: { kind: 'arm', choice: target } };
  }
}
