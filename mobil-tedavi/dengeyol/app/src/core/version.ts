/**
 * Sürümler (yeni kullanıcı turu 1, y04 #6): her atağa ve ev raporuna yazılır; araştırmada hangi kaydın hangi uygulama ve
 * karar kurallarıyla üretildiği bilinsin.
 */

/** Uygulama sürümü (package.json; vite `define`). Tanımlı değilse '0'. */
export const APP_VERSION: string = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '0';

/**
 * Hasta modundaki karar kurallarının sürümü (core/patientDecision.ts, core/safety.ts). Taraf/kanal kararı, uyarı eşikleri ya da
 * güvenlik sorularının anlamı değişince artırılır.
 */
export const DECISION_RULES_VERSION = 'k1';
