/**
 * Ev reçetesi: odyolog/hekim muayeneden sonra hastaya bağlantı ya da QR kod olarak verir.
 *
 * Biçim: <base64url(JSON)>.<FNV-1a 32 bit sağlama toplamı (hex)>
 * Sağlama toplamı yazım/kopyalama hatalarını yakalar; güvenlik imzası DEĞİLDİR (bağlantıyı elinde tutan herkes
 * benzerini üretebilir). Reçete arka kanal (Epley/Semont) ya da yatay kanal (BBQ roll) manevrasını ve sınırlı dozu
 * açabilir; hasta yine her seansta kırmızı bayrak sorularını yanıtlar.
 *
 * Sürümler (eski bağlantılar çözülmeye devam eder):
 *   v1  ilk biçim.
 *   v2  v1 + isteğe bağlı hasta kodu (`pid`). Hasta kodu yoksa reçete yine v1 olarak üretilir (eski uygulamalar da okur);
 *       hasta kodu varsa v2 üretilir (v1'i bilen eski bir uygulama "güncelleyin" der, kodu sessizce düşürmez).
 *   v3  v2 + yatay kanal (`canal: 'HC'`, `maneuver: 'bbq-roll'`) ve hekimin uyarıya rağmen verdiği reçetenin notu (`ov`).
 *       Yalnız bunlardan biri varsa v3 üretilir; arka kanal reçetesi uyarısızsa v1/v2 kalır (eski uygulamalar okur). v3'ü
 *       bilmeyen eski uygulama "farklı bir sürüm, uygulamayı güncelleyin" der: yatay kanalı arka kanal sanmaz, uyarı
 *       notunu sessizce düşürmez (kullanıcı turu yeni-1, L4-1/L4-2).
 */
import type { ProtocolId, Side } from './protocols';
import { clampDose, type DoseLimits } from './safety';

export type PrescriptionVersion = 1 | 2 | 3;

/** Reçetenin kanalı: arka (Dix-Hallpike → Epley/Semont) ya da yatay (sırtüstü baş çevirme → BBQ roll). */
export type RxCanal = 'PC' | 'HC';
/** Arka kanal reçete manevraları. */
export type RxPcManeuver = 'epley' | 'semont';
/**
 * Yatay kanal reçete manevrası: BBQ roll (hasta modu yatay kanalı geotropik varsayımla BBQ roll ile tedavi eder). Gufoni
 * hasta modunda yok (protocols.ts `patient: 'no'`); eklenirse buraya ve hasta akışının manevra seçimine birlikte girer.
 */
export type RxHcManeuver = 'bbq-roll';
export type RxManeuver = RxPcManeuver | RxHcManeuver;

export const RX_PC_MANEUVERS: readonly RxPcManeuver[] = ['epley', 'semont'];
export const RX_HC_MANEUVERS: readonly RxHcManeuver[] = ['bbq-roll'];

export interface Prescription {
  /** Biçim sürümü; normalizePrescription kanal, uyarı notu ve hasta koduna göre kendisi belirler. */
  v: PrescriptionVersion;
  /** Etkilenen taraf. */
  side: Side;
  /** Kanal (v1/v2'de yalnız 'PC'). Manevrayla tutarlı olmalı (normalizePrescription manevradan çıkarır). */
  canal: RxCanal;
  maneuver: RxManeuver;
  /** Muayene tarihi (YYYY-AA-GG). */
  date: string;
  /** Reçeteyi yazan (isteğe bağlı). */
  by?: string;
  clinic?: string;
  perDay: number;
  days: number;
  note?: string;
  /**
   * Klinisyenin hasta kodu (isteğe bağlı, v2): protokol no ya da baş harfler; ad-soyad yazılmamalı. Hasta raporunun başına
   * yazılır; hekim WhatsApp'tan gelen raporu kendi kaydıyla eşleştirir. En çok PID_MAX_LEN karakter.
   */
  pid?: string;
  /**
   * Hekim reçeteyi bir uyarıya rağmen verdiyse uyarının hastaya yönelik kısa adı (v3; ör. "muayene bulgusu beyin kaynaklı
   * baş dönmesini düşündürüyor"). Hastanın reçete kartında "Hekim uyarıya rağmen verdi: …" satırı olarak görünür.
   */
  ov?: string;
}

/** Hasta kodunun en çok uzunluğu (klinisyen hasta kodu alanıyla aynı). */
export const PID_MAX_LEN = 30;

export function fnv1a(str: string): string {
  let h = 0x811c9dc5;
  const bytes = new TextEncoder().encode(str);
  for (const b of bytes) {
    h ^= b;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

function toBase64Url(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): string {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

const MAX_TEXT = 80;

function cleanText(s: unknown, max: number = MAX_TEXT): string | undefined {
  if (typeof s !== 'string') return undefined;
  const t = s.replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max).trim();
  return t.length ? t : undefined;
}

const isHcManeuver = (m: unknown): m is RxHcManeuver => (RX_HC_MANEUVERS as readonly unknown[]).includes(m);
const isPcManeuver = (m: unknown): m is RxPcManeuver => (RX_PC_MANEUVERS as readonly unknown[]).includes(m);

/** Reçetenin kanalı (manevradan; eski kayıtlarda alan hep 'PC'). */
export function rxCanalOf(p: Pick<Prescription, 'maneuver'>): RxCanal {
  return isHcManeuver(p.maneuver) ? 'HC' : 'PC';
}

/** Reçete manevrasının görünen adı: "Epley", "Semont", "BBQ roll". */
export function rxManeuverName(p: Pick<Prescription, 'maneuver'>): string {
  return p.maneuver === 'epley' ? 'Epley' : p.maneuver === 'semont' ? 'Semont' : 'BBQ roll';
}

/** Reçete kanalının adı: "arka kanal" / "yatay kanal". */
export function rxCanalName(p: Pick<Prescription, 'maneuver'>): string {
  return rxCanalOf(p) === 'HC' ? 'yatay kanal' : 'arka kanal';
}

/** Reçetenin yürütücüdeki protokolü (ProtocolId). */
export function rxProtocolId(p: Pick<Prescription, 'maneuver'>): ProtocolId {
  return p.maneuver;
}

/**
 * Arka kanal manevrası (hasta akışında arka kanal yolu için): reçete arka kanalsa onun manevrası, yatay kanalsa ya da reçete
 * yoksa Epley (arka kanal varsayılanı).
 */
export function rxPcManeuver(p: Pick<Prescription, 'maneuver'> | undefined | null): RxPcManeuver {
  return p && isPcManeuver(p.maneuver) ? p.maneuver : 'epley';
}

/** Ev raporu bağlantısındaki (core/reportShare.ts) tek harfli manevra kodu: e/s (eski), b (BBQ roll). */
export function rxManeuverWire(m: RxManeuver): 'e' | 's' | 'b' {
  return m === 'epley' ? 'e' : m === 'semont' ? 's' : 'b';
}

/** Tek harfli manevra kodundan manevra (bilinmeyen harf eski davranışla Semont sayılır). */
export function rxManeuverFromWire(c: unknown): RxManeuver {
  return c === 'e' ? 'epley' : c === 'b' ? 'bbq-roll' : 'semont';
}

export function normalizePrescription(p: Prescription): Prescription {
  const dose: DoseLimits = clampDose({ maxPerDay: p.perDay, maxDays: p.days });
  const pid = cleanText(p.pid, PID_MAX_LEN);
  const ov = cleanText(p.ov, OV_MAX_LEN);
  const canal = rxCanalOf(p);
  const out: Prescription = {
    v: canal === 'HC' || ov ? 3 : pid ? 2 : 1,
    side: p.side,
    canal,
    maneuver: p.maneuver,
    date: p.date,
    by: cleanText(p.by),
    clinic: cleanText(p.clinic),
    perDay: dose.maxPerDay,
    days: dose.maxDays,
    note: cleanText(p.note)
  };
  if (pid) out.pid = pid;
  if (ov) out.ov = ov;
  return out;
}

/** Uyarı notunun en çok uzunluğu. */
export const OV_MAX_LEN = 120;

export function encodePrescription(p: Prescription): string {
  const json = JSON.stringify(normalizePrescription(p));
  const body = toBase64Url(json);
  return `${body}.${fnv1a(body)}`;
}

export type DecodeError = 'FORMAT' | 'CHECKSUM' | 'VERSION' | 'FIELDS';

export function decodePrescription(token: string): { ok: true; value: Prescription } | { ok: false; error: DecodeError } {
  const parts = token.trim().split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return { ok: false, error: 'FORMAT' };
  const [body, sum] = parts as [string, string];
  if (fnv1a(body) !== sum.toLowerCase()) return { ok: false, error: 'CHECKSUM' };
  let obj: unknown;
  try {
    obj = JSON.parse(fromBase64Url(body));
  } catch {
    return { ok: false, error: 'FORMAT' };
  }
  if (!obj || typeof obj !== 'object') return { ok: false, error: 'FORMAT' };
  const o = obj as Record<string, unknown>;
  if (o.v !== 1 && o.v !== 2 && o.v !== 3) return { ok: false, error: 'VERSION' };
  if (o.side !== 'R' && o.side !== 'L') return { ok: false, error: 'FIELDS' };
  // Kanal ve manevra tutarlı olmalı; yatay kanal yalnız v3'te.
  if (o.canal === 'PC') {
    if (!isPcManeuver(o.maneuver)) return { ok: false, error: 'FIELDS' };
  } else if (o.canal === 'HC' && o.v === 3) {
    if (!isHcManeuver(o.maneuver)) return { ok: false, error: 'FIELDS' };
  } else return { ok: false, error: 'FIELDS' };
  if (typeof o.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(o.date)) return { ok: false, error: 'FIELDS' };
  if (typeof o.perDay !== 'number' || typeof o.days !== 'number') return { ok: false, error: 'FIELDS' };
  return {
    ok: true,
    value: normalizePrescription({
      v: o.v,
      side: o.side,
      canal: o.canal,
      maneuver: o.maneuver as RxManeuver,
      date: o.date,
      by: o.by as string | undefined,
      clinic: o.clinic as string | undefined,
      perDay: o.perDay,
      days: o.days,
      note: o.note as string | undefined,
      // v1 bağlantısında hasta kodu yoktur; olsa da (elle üretilmiş) yok sayılır.
      pid: o.v >= 2 ? (o.pid as string | undefined) : undefined,
      // Uyarı notu yalnız v3'te.
      ov: o.v === 3 ? (o.ov as string | undefined) : undefined
    })
  };
}

// ---- Geçerlilik ----------------------------------------------------------------------------------------------
//
// Tek tanım (reçete kartı, hasta raporu, ana ekran, rxActive ve klinisyen raporu/HBYS notu bunu kullanır):
// D tarihli (yerel takvim günü) reçete, D günü 00:00'dan D+(RX_VALID_DAYS−1) gününün sonuna kadar GEÇERLİDİR (14 takvim
// günü, muayene günü dahil). Ekranda son geçerli gün "… tarihine kadar (dahil)" diye yazılır; D+RX_VALID_DAYS günü 00:00'da
// biter. Gelecek tarihli reçete geçerli sayılmaz. Hesap yerel takvimle yapılır (yaz saati geçişinde gün kaymaz).

/**
 * Reçetenin geçerlilik süresi (muayene günü dahil takvim günü). Reçete o muayenedeki atak içindir: nükste BPPV tipi ve
 * tarafı sıklıkla değişir (Kim HJ ve ark. JAMA Neurol 2023;80:244–250: nükslerin %56'sı ilk tanıdan farklı). Süre dolunca
 * varsayılan doz ve her atakta iki taraflı test uygulanır. Değer klinik danışmanla gözden geçirilmelidir.
 * (state/episodes.ts aynı sabiti yeniden dışa aktarır.)
 */
export const RX_VALID_DAYS = 14;

type RxDate = Pick<Prescription, 'date'> | string;
const dateKeyOf = (p: RxDate): string => (typeof p === 'string' ? p : p.date);

/** YYYY-AA-GG → o günün (+addDays) yerel 00:00'ı; okunamazsa null. */
function localDay(dateKey: string, addDays = 0): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!m) return null;
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const out = new Date(Number(m[1]), mo - 1, d + addDays);
  return Number.isFinite(out.getTime()) ? out : null;
}

/** Reçetenin verildiği günün yerel başlangıcı (ms); okunamazsa null. */
export function rxIssuedAt(p: RxDate): number | null {
  return localDay(dateKeyOf(p))?.getTime() ?? null;
}

/** Son geçerli gün (yerel 00:00): D tarihli reçetede D+13 (o gün dahil geçerlidir). Okunamazsa null. */
export function rxLastValidDay(p: RxDate, validDays: number = RX_VALID_DAYS): Date | null {
  return localDay(dateKeyOf(p), validDays - 1);
}

/** Geçerliliğin bittiği an (ms, dışlayıcı): son geçerli günden sonraki günün 00:00'ı (D+14). Okunamazsa null. */
export function rxValidUntil(p: RxDate, validDays: number = RX_VALID_DAYS): number | null {
  return localDay(dateKeyOf(p), validDays)?.getTime() ?? null;
}

/** `now` anında geçerli mi: D 00:00 ≤ now < D+14 00:00. Gelecek tarihli ya da okunamayan tarih geçersizdir. */
export function rxValidAt(p: RxDate, now: number, validDays: number = RX_VALID_DAYS): boolean {
  const start = rxIssuedAt(p);
  const end = rxValidUntil(p, validDays);
  return start !== null && end !== null && now >= start && now < end;
}

/**
 * Son geçerli günün metni: "12 Kasım 2026 tarihine kadar (dahil)" (long: hasta ekranları) ya da "12.11.2026 tarihine kadar
 * (dahil)" (short: klinisyen raporu/HBYS notu). Hasta ve klinisyen ekranı aynı günü göstersin diye her yerde bu kullanılır.
 */
export function rxValidityLabel(p: RxDate, style: 'long' | 'short' = 'long', validDays: number = RX_VALID_DAYS): string | null {
  const last = rxLastValidDay(p, validDays);
  if (!last) return null;
  // Uzun biçimde gün başında sıfır yok ("8 Kasım 2026"; kullanıcı turu 5, k03); kısa biçim "08.11.2026" kalır.
  const txt = last.toLocaleDateString('tr-TR', style === 'short' ? { day: '2-digit', month: '2-digit', year: 'numeric' } : { day: 'numeric', month: 'long', year: 'numeric' });
  return `${txt} tarihine kadar (dahil)`;
}

/**
 * Reçete kodu: bağlantıdaki sağlama toplamı (8 hex, "." sonrası). Klinisyen raporu/HBYS notu ve hasta raporu aynı kodu
 * yazar; hekim gelen raporu kendi reçetesiyle eşleştirir. Bağlantı (token) verilirse ondan okunur; reçete nesnesi verilirse
 * yeniden kodlanır (encodePrescription normalleştirdiği için aynı uygulamanın ürettiği bağlantıyla aynı kod çıkar). Hasta
 * tarafında içe aktarılan bağlantı profilde saklanır (PatientProfile.prescriptionToken) ve önce o kullanılır.
 */
export function rxCode(x: string | Prescription): string {
  const token = typeof x === 'string' ? x.trim() : encodePrescription(x);
  return (token.split('.')[1] ?? '').toLowerCase();
}

/** Uygulamanın kendi adresine göre reçete bağlantısı üretir. */
export function prescriptionUrl(baseUrl: string, p: Prescription): string {
  const base = baseUrl.split('#')[0]!;
  return `${base}#/recete/${encodePrescription(p)}`;
}

export const DECODE_ERROR_TEXT: Record<DecodeError, string> = {
  FORMAT: 'Reçete bağlantısı okunamadı. Bağlantının tamamını kopyaladığınızdan emin olun.',
  CHECKSUM: 'Reçete bağlantısı bozulmuş ya da eksik. Hekiminizden ya da odyoloğunuzdan yeni bağlantı isteyin.',
  VERSION:
    'Bu reçete, uygulamanın daha yeni bir sürümüyle oluşturulmuş. Uygulamayı güncelleyin (kapatıp yeniden açın), sonra bağlantıyı yeniden açın ya da QR kodu yeniden okutun.',
  FIELDS: 'Reçetede eksik ya da geçersiz bilgi var. Hekiminizden ya da odyoloğunuzdan yeni bağlantı isteyin.'
};
