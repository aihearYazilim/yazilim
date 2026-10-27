/**
 * Ev reçetesi: odyolog/hekim muayeneden sonra hastaya bağlantı ya da QR kod olarak verir.
 *
 * Biçim: <base64url(JSON)>.<FNV-1a 32 bit sağlama toplamı (hex)>
 * Sağlama toplamı yazım/kopyalama hatalarını yakalar; güvenlik imzası DEĞİLDİR (bağlantıyı elinde tutan herkes
 * benzerini üretebilir). Reçete yalnızca arka kanal manevralarını (Epley/Semont) ve sınırlı dozu açabilir;
 * hasta yine her seansta kırmızı bayrak sorularını yanıtlar.
 */
import type { Side } from './protocols';
import { clampDose, type DoseLimits } from './safety';

export interface Prescription {
  v: 1;
  /** Etkilenen taraf. */
  side: Side;
  canal: 'PC';
  maneuver: 'epley' | 'semont';
  /** Muayene tarihi (YYYY-AA-GG). */
  date: string;
  /** Reçeteyi yazan (isteğe bağlı). */
  by?: string;
  clinic?: string;
  perDay: number;
  days: number;
  note?: string;
}

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

function cleanText(s: unknown): string | undefined {
  if (typeof s !== 'string') return undefined;
  const t = s.replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, MAX_TEXT);
  return t.length ? t : undefined;
}

export function normalizePrescription(p: Prescription): Prescription {
  const dose: DoseLimits = clampDose({ maxPerDay: p.perDay, maxDays: p.days });
  return {
    v: 1,
    side: p.side,
    canal: 'PC',
    maneuver: p.maneuver,
    date: p.date,
    by: cleanText(p.by),
    clinic: cleanText(p.clinic),
    perDay: dose.maxPerDay,
    days: dose.maxDays,
    note: cleanText(p.note)
  };
}

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
  if (o.v !== 1) return { ok: false, error: 'VERSION' };
  if (o.side !== 'R' && o.side !== 'L') return { ok: false, error: 'FIELDS' };
  if (o.canal !== 'PC') return { ok: false, error: 'FIELDS' };
  if (o.maneuver !== 'epley' && o.maneuver !== 'semont') return { ok: false, error: 'FIELDS' };
  if (typeof o.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(o.date)) return { ok: false, error: 'FIELDS' };
  if (typeof o.perDay !== 'number' || typeof o.days !== 'number') return { ok: false, error: 'FIELDS' };
  return {
    ok: true,
    value: normalizePrescription({
      v: 1,
      side: o.side,
      canal: 'PC',
      maneuver: o.maneuver,
      date: o.date,
      by: o.by as string | undefined,
      clinic: o.clinic as string | undefined,
      perDay: o.perDay,
      days: o.days,
      note: o.note as string | undefined
    })
  };
}

/** Uygulamanın kendi adresine göre reçete bağlantısı üretir. */
export function prescriptionUrl(baseUrl: string, p: Prescription): string {
  const base = baseUrl.split('#')[0]!;
  return `${base}#/recete/${encodePrescription(p)}`;
}

export const DECODE_ERROR_TEXT: Record<DecodeError, string> = {
  FORMAT: 'Reçete bağlantısı okunamadı. Bağlantının tamamını kopyaladığınızdan emin olun.',
  CHECKSUM: 'Reçete bağlantısı bozulmuş ya da eksik. Odyologunuzdan yeni bağlantı isteyin.',
  VERSION: 'Bu reçete, uygulamanın farklı bir sürümüyle oluşturulmuş. Uygulamayı güncelleyin.',
  FIELDS: 'Reçetede eksik ya da geçersiz bilgi var. Odyologunuzdan yeni bağlantı isteyin.'
};
