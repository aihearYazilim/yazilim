/**
 * Duraklatma sayfası dokunuş kuralı (saf; arayüzden bağımsız, birim testli).
 *
 * Hasta ekranı göremez; sesin "geçtiyse ekrana bir kez dokunun" dediği anda kör dokunuş bir düğmeye denk gelebilir (k01, tur 3).
 *   - Baş dönmesi işaretliyken sayfadaki İLK kısa dokunuş, nereye denk gelirse gelsin "geçti" sayılır; hiçbir düğmeyi
 *     çalıştırmaz.
 *   - Kalıcı sonuçlu düğmeler ("Kendimi kötü hissediyorum", "Pozisyona gelemiyorum", "Şimdilik bırak") tek dokunuşla
 *     çalışmaz: ilk dokunuş düğmeyi "kurar" ve kısa onay cümlesi söylenir; sayfanın ÜSTÜNDE beliren "Evet, … — eminim"
 *     düğmesine dokunmak onaylar. Onay süresi cümle BİTTİKTEN sonra başlar ve CONFIRM_WINDOW_MS sürer (yavaş seste cümleyi
 *     sonuna kadar dinleyen hasta da yetişsin; k01, tur 4). Bitiş olayı gelmezse arayüzün verdiği tahmini süre kullanılır.
 *     Kurulan düğmenin yerinde dokunulamayan bir not durur: aynı yere ikinci kör dokunuş hiçbir şey yapmaz. Süre dolunca
 *     onay kendiliğinden kalkar.
 *   - "Devam" ekranın herhangi bir yerine 2 s basılı tutmakla (arayüz) ya da "Devam et" düğmesiyle; geri alınabilir.
 *   - "Tekrar dinle" (ayrıntılı duraklatma sesi) kalıcı sonuç doğurmaz: kurulmuş onayı bozmaz.
 * Klinisyen ekranı görür: onay istenmez.
 */

/** Kalıcı sonuçlu seçimler. */
export type PauseChoice = 'unwell' | 'unreachable' | 'abort';

/** Onay düğmesinin, onay cümlesi bittikten sonra görünür kalma süresi (ms; en az 15 s; k01, tur 4). */
export const CONFIRM_WINDOW_MS = 15000;

/**
 * Seçim kurulunca söylenen söz: kısa, yalnız eylem (yavaş seste de birkaç saniye; k01, tur 4). Vazgeçme yolu ekranda yazılı
 * ("Vazgeçmek için bir şey yapmayın").
 */
export const CONFIRM_PROMPT = 'Eminseniz üstteki "Evet"e dokunun.';

export interface PauseSheetState {
  armed: PauseChoice | null;
  /** Kurulma anı (ms); onay cümlesinin bitiş olayını bu kuruluşa bağlamak için de kullanılır. */
  armedAt: number | null;
  /** Onay cümlesinin gerçekten bittiği (ya da kesildiği) an (ms); bilinmiyorsa null. */
  promptDoneAt: number | null;
  /** Bitiş olayı gelmezse cümlenin bittiği varsayılan süre (kurulmadan sonra, ms; tahmin). */
  promptMs: number;
}

export const initialPauseSheet = (): PauseSheetState => ({ armed: null, armedAt: null, promptDoneAt: null, promptMs: 0 });

/** Dokunulan yer: bir seçim düğmesi, onay düğmesi, "Devam et", "Baş dönmesi geçti", "Tekrar dinle" ya da boş bir yer. */
export type SheetTarget = PauseChoice | 'confirm' | 'resume' | 'vertigoEnd' | 'replay' | 'background';

export type SheetAction =
  | { kind: 'none' }
  | { kind: 'vertigoEnd' }
  | { kind: 'resume' }
  | { kind: 'replay' }
  | { kind: 'arm'; choice: PauseChoice }
  | { kind: 'commit'; choice: PauseChoice };

/**
 * Onay penceresinin kapandığı an (ms): onay cümlesinin bitişi (gerçek ya da tahmini) + CONFIRM_WINDOW_MS. Kurulu seçim
 * yoksa null.
 */
export function confirmDeadline(st: PauseSheetState): number | null {
  if (st.armed === null || st.armedAt === null) return null;
  const spokenEnd = st.promptDoneAt ?? st.armedAt + Math.max(0, st.promptMs);
  return spokenEnd + CONFIRM_WINDOW_MS;
}

/** Onay hâlâ geçerli mi (süresi dolmadı)? */
export function armedChoice(st: PauseSheetState, now: number): PauseChoice | null {
  const deadline = confirmDeadline(st);
  return deadline !== null && now < deadline ? st.armed : null;
}

/**
 * Onay cümlesi bitti (arayüz, konuşmanın bitiş geri çağrısından): pencere bu andan başlar. Yalnız aynı kuruluşa ait olay
 * işlenir (`armedAt` eşleşmeli); geç gelen eski olay ya da ikinci bitiş olayı yok sayılır.
 */
export function confirmPromptSpoken(st: PauseSheetState, armedAt: number, now: number): PauseSheetState {
  if (st.armed === null || st.armedAt !== armedAt || st.promptDoneAt !== null) return st;
  // Pencere kapanmışsa (tahmin + süre doldu) geç gelen olay onu yeniden açmaz.
  if (armedChoice(st, now) === null) return st;
  return { ...st, promptDoneAt: Math.max(armedAt, now) };
}

/**
 * Bir kısa dokunuşun sonucu. (Uzun basış hiçbir düğmeyi seçmez; onu arayüz ayıklar.)
 * `patient`: hasta modu (onay ve "ilk dokunuş geçti" kuralları yalnız burada).
 * `promptMs`: kurulunca söylenecek onay cümlesinin tahmini süresi (bitiş olayı gelmezse; ses yoksa 0).
 */
export function pauseSheetTap(
  st: PauseSheetState,
  target: SheetTarget,
  ctx: { now: number; vertigoActive: boolean; patient: boolean; promptMs?: number }
): { state: PauseSheetState; action: SheetAction } {
  const cleared = initialPauseSheet();
  if (!ctx.patient) {
    if (target === 'resume') return { state: cleared, action: { kind: 'resume' } };
    if (target === 'vertigoEnd') return { state: cleared, action: { kind: 'vertigoEnd' } };
    if (target === 'replay') return { state: st, action: { kind: 'replay' } };
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
    case 'replay':
      // Yalnız ses: kurulmuş onay (varsa) aynen kalır.
      return { state: armed ? st : cleared, action: { kind: 'replay' } };
    case 'background':
      return { state: armed ? st : cleared, action: { kind: 'none' } };
    default:
      // Kurulmuş düğmenin yerine ikinci dokunuş onaylamaz (orada artık dokunulamayan not var).
      if (armed === target) return { state: st, action: { kind: 'none' } };
      return {
        state: { armed: target, armedAt: ctx.now, promptDoneAt: null, promptMs: Math.max(0, ctx.promptMs ?? 0) },
        action: { kind: 'arm', choice: target }
      };
  }
}
