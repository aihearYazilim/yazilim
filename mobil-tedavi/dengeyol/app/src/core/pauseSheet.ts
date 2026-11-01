/**
 * Duraklatma sayfası ve güvenlik uyarısı dokunuş kuralı (saf; arayüzden bağımsız, birim testli).
 *
 * Tek ve sabit kural (yeni kullanıcı turu 3, N2-1; y06, y07): hasta modunda
 *   - "Devam et" düğmesine her kısa dokunuş (tek ya da çift) HEMEN devam eder; bekleme ve çift dokunuş anlamı yoktur.
 *   - Ekrana (neresi olursa olsun, düğmenin üstü de) 2 s basılı tutmak HER ZAMAN durdurur: duraklatma sayfasında
 *     "kendini iyi hissetmedi" (USER_FEELS_UNWELL), uzun baş dönmesi uyarısında VERTIGO_TOO_LONG (pozisyon uyarısında
 *     POSITION_UNREACHABLE). Durdurma 5 s sesli geri sayımla geri alınabilir: "Durduruyorum. Yanlışsa ekrandaki Devam et'e
 *     dokunun." Bu sürede yalnız "Devam et" geri alır (ve devam eder); süre dolunca durur ve kayda geçer. Geri sayım
 *     cümle bittikten sonra başlar (yavaş seste de cümle sonuna dek duyulsun).
 *   - Kısa kör dokunuş hiçbir şey seçmez. Baş dönmesi işaretliyken sayfadaki ilk kısa dokunuş ("Devam et" dışında,
 *     nereye denk gelirse gelsin) "geçti" sayılır; hiçbir düğmeyi çalıştırmaz (k01, tur 3).
 *   - Kalıcı sonuçlu düğmeler ("Kendimi kötü hissediyorum", "Pozisyona gelemiyorum", "Şimdilik bırak") tek dokunuşla
 *     çalışmaz: ilk dokunuş düğmeyi "kurar" ve kısa onay cümlesi söylenir; sayfanın ÜSTÜNDE beliren "Evet, … — eminim"
 *     düğmesine dokunmak onaylar. Onay süresi cümle BİTTİKTEN sonra başlar ve CONFIRM_WINDOW_MS sürer (k01, tur 4).
 *     Kurulan düğmenin yerinde dokunulamayan bir not durur: aynı yere ikinci kör dokunuş hiçbir şey yapmaz.
 *   - "Tekrar dinle" (ayrıntılı duraklatma sesi) kalıcı sonuç doğurmaz: kurulmuş onayı bozmaz.
 * Tur 2'deki "iki kez hızlı dokunuş = Kendimi kötü hissediyorum" ve 400 ms tek dokunuş gecikmesi kaldırıldı: hızlı dokunan
 * kişinin "Devam et"i "kötüyüm" sayılıyor, aynı basılı tutma bir ekranda "devam", bir sonrakinde "durdur" oluyordu (y06);
 * onay süresi sessizce dolunca geç gelen basılı tutma manevrayı sürdürüyordu (y07).
 * Klinisyen ekranı görür: onay istenmez, basılı tutma ve geri sayım yoktur (davranışı değişmedi).
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

/** Basılı tutmayla başlayan durdurmanın geri alınabildiği süre (ms; geri alma cümlesi bittikten sonra; N2-1). */
export const STOP_UNDO_MS = 5000;

/** Basılı tutunca hemen söylenen söz (N2-1): ne olduğu ve nasıl geri alınacağı. Ardından 5'ten geriye sayılır. */
export const STOP_UNDO_PROMPT = "Durduruyorum. Yanlışsa ekrandaki Devam et'e dokunun.";

/** Geri sayımda söylenen sayılar (5 … 1; her saniye bir). */
export const STOP_COUNT_WORDS: Record<number, string> = { 5: 'Beş', 4: 'Dört', 3: 'Üç', 2: 'İki', 1: 'Bir' };

/** Basılı tutmayla başlayan, geri alınabilir durdurma. */
export interface StopCountdown {
  /** Basılı tutmanın tanındığı an (ms). */
  at: number;
  /** Geri alma cümlesinin gerçekten bittiği (ya da kesildiği) an (ms); bilinmiyorsa null. */
  promptDoneAt: number | null;
  /** Bitiş olayı gelmezse cümlenin bittiği varsayılan süre (ms; tahmin; ses yoksa 0). */
  promptMs: number;
}

export function startStopCountdown(now: number, promptMs = 0): StopCountdown {
  return { at: now, promptDoneAt: null, promptMs: Math.max(0, promptMs) };
}

/** Geri sayımın başladığı an: geri alma cümlesinin bitişi (gerçek ya da tahmini). */
export function stopCountStart(c: StopCountdown): number {
  return c.promptDoneAt ?? c.at + c.promptMs;
}

/** Durdurmanın kesinleştiği an (ms). */
export function stopDeadline(c: StopCountdown): number {
  return stopCountStart(c) + STOP_UNDO_MS;
}

/** Ekranda kalan saniye (5 … 0); cümle sürerken 5. */
export function stopSecondsLeft(c: StopCountdown, now: number): number {
  const left = Math.ceil((stopDeadline(c) - now) / 1000);
  return Math.max(0, Math.min(STOP_UNDO_MS / 1000, left));
}

/** Durdurma kesinleşti mi (süre doldu)? */
export function stopDue(c: StopCountdown | null | undefined, now: number): boolean {
  return !!c && now >= stopDeadline(c);
}

/**
 * Geri alma cümlesi bitti (arayüz, konuşmanın bitiş geri çağrısından): sayım bu andan başlar. Yalnız aynı geri sayıma ait olay
 * işlenir (`at` eşleşmeli); ikinci bitiş olayı ve süresi dolmuş sayım değişmez.
 */
export function stopPromptSpoken(c: StopCountdown, at: number, now: number): StopCountdown {
  if (c.at !== at || c.promptDoneAt !== null || stopDue(c, now)) return c;
  return { ...c, promptDoneAt: Math.max(at, now) };
}

/** Geri sayımın sayı takvimi: her sayı ("Beş" … "Bir") hangi anda söylenir. Sayım cümleden sonra başlar; saniyede bir. */
export function stopCountSchedule(c: StopCountdown): { n: number; at: number }[] {
  const start = stopCountStart(c);
  const out: { n: number; at: number }[] = [];
  for (let n = STOP_UNDO_MS / 1000, i = 0; n >= 1; n--, i++) out.push({ n, at: start + i * 1000 });
  return out;
}

/**
 * Geri sayım sürerken kısa dokunuş: yalnız "Devam et" geri alır (ve devam eder); başka her dokunuş hiçbir şey yapmaz.
 * Güvenlik uyarısında da aynı (arayüz "Devam et"i `resume` olarak verir).
 */
export function stopCountdownTap(target: 'resume' | 'other'): 'undo' | 'none' {
  return target === 'resume' ? 'undo' : 'none';
}

export interface PauseSheetState {
  armed: PauseChoice | null;
  /** Kurulma anı (ms); onay cümlesinin bitiş olayını bu kuruluşa bağlamak için de kullanılır. */
  armedAt: number | null;
  /** Onay cümlesinin gerçekten bittiği (ya da kesildiği) an (ms); bilinmiyorsa null. */
  promptDoneAt: number | null;
  /** Bitiş olayı gelmezse cümlenin bittiği varsayılan süre (kurulmadan sonra, ms; tahmin). */
  promptMs: number;
  /** Basılı tutmayla başlayan, geri alınabilir durdurma (hasta modu; N2-1). Sürerken kurulu seçim yoktur. */
  stopping?: StopCountdown | null;
}

export const initialPauseSheet = (): PauseSheetState => ({ armed: null, armedAt: null, promptDoneAt: null, promptMs: 0, stopping: null });

/** Dokunulan yer: bir seçim düğmesi, onay düğmesi, "Devam et", "Baş dönmesi geçti", "Tekrar dinle" ya da boş bir yer. */
export type SheetTarget = PauseChoice | 'confirm' | 'resume' | 'vertigoEnd' | 'replay' | 'background';

export type SheetAction =
  | { kind: 'none' }
  | { kind: 'vertigoEnd' }
  | { kind: 'resume' }
  | { kind: 'replay' }
  | { kind: 'arm'; choice: PauseChoice }
  | { kind: 'commit'; choice: PauseChoice }
  /** Basılı tutma: geri alınabilir durdurma başladı (arayüz geri alma cümlesini söyler ve sayar). */
  | { kind: 'stopStart' };

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
 * `patient`: hasta modu (onay, geri sayım ve "ilk dokunuş geçti" kuralları yalnız burada).
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
  // Geri alınabilir durdurma sürüyor: yalnız "Devam et" geri alır (ve devam eder); başka dokunuş hiçbir şey yapmaz.
  if (st.stopping) {
    return stopCountdownTap(target === 'resume' ? 'resume' : 'other') === 'undo'
      ? { state: cleared, action: { kind: 'resume' } }
      : { state: st, action: { kind: 'none' } };
  }
  // "Devam et" her zaman hemen devam eder (baş dönmesi işaretliyken de; N2-1). İşaret açık kalır; yürütücü sesle hatırlatır.
  if (target === 'resume') return { state: cleared, action: { kind: 'resume' } };
  // Baş dönmesi işaretliyken ilk dokunuş ("Devam et" dışında) her yerde "geçti"dir; kurulmuş bir onay da kalkar.
  if (ctx.vertigoActive) return { state: cleared, action: { kind: 'vertigoEnd' } };
  const armed = armedChoice(st, ctx.now);
  switch (target) {
    case 'confirm':
      return armed ? { state: cleared, action: { kind: 'commit', choice: armed } } : { state: cleared, action: { kind: 'none' } };
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
        state: { armed: target, armedAt: ctx.now, promptDoneAt: null, promptMs: Math.max(0, ctx.promptMs ?? 0), stopping: null },
        action: { kind: 'arm', choice: target }
      };
  }
}

/**
 * Duraklatma sayfasında ekrana 2 s basılı tutmanın sonucu (hasta modu): HER ZAMAN geri alınabilir durdurma başlar — kurulu
 * seçim, baş dönmesi işareti ya da önceki dokunuşlar ne olursa olsun, ne kadar sonra gelirse gelsin (N2-1; y07). Süren bir
 * geri sayımı yeniden başlatmaz. Klinisyende hiçbir şey yapmaz. `promptMs`: geri alma cümlesinin tahmini süresi (ses yoksa 0).
 */
export function pauseSheetHold(
  st: PauseSheetState,
  ctx: { now: number; patient: boolean; promptMs?: number }
): { state: PauseSheetState; action: SheetAction } {
  if (!ctx.patient || st.stopping) return { state: st, action: { kind: 'none' } };
  return { state: { ...initialPauseSheet(), stopping: startStopCountdown(ctx.now, ctx.promptMs) }, action: { kind: 'stopStart' } };
}

/** Duraklatma sayfasında geri alma cümlesi bitti: sayım bu andan başlar (bkz. `stopPromptSpoken`). */
export function pauseSheetStopSpoken(st: PauseSheetState, at: number, now: number): PauseSheetState {
  if (!st.stopping) return st;
  const next = stopPromptSpoken(st.stopping, at, now);
  return next === st.stopping ? st : { ...st, stopping: next };
}
