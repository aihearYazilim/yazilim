/**
 * Bilgilendirme ve onam metni (kurulumun ilk adımı). Metin değişince CONSENT_VERSION artırılır; onaylanan sürüm profile
 * (consentVersion) ve hasta raporuna yazılır. Sürümü olmayan eski onamlar 1. sürüm sayılır.
 *   1  ilk metin ("kullanımı kendi sorumluluğumdadır").
 *   2  olası yan etkiler (geçici baş dönmesi/bulantı, düşme, kanal değişimi) ve seçenekler (muayenede manevra, bekleme)
 *      eklendi; "hasta adına yakını" kurulumu.
 */
import { formatDate } from '../../../state/episodes';
import type { PatientProfile } from '../../../state/types';

export const CONSENT_VERSION = '2';

/** Olası yan etkiler ve riskler (gündelik dil; KBB danışmanı geri bildirimi k09). */
export const CONSENT_RISKS: string[] = [
  'Manevra sırasında ve sonrasında birkaç saat geçici baş dönmesi, dengesizlik ve bulantı olabilir; nadiren kusma olur.',
  'Baş dönmesi sırasında düşebilirsiniz: manevrayı yatakta yapın, kalkarken önce oturun ve bir yere tutunun; mümkünse yanınızda biri olsun.',
  'Kristaller nadiren başka bir kanala geçebilir (kanal değişimi): baş dönmesi farklılaşırsa ya da geçmezse uygulama sizi hekime yönlendirir.',
  'Boynunuzu zorlamayın; ağrı olursa durun.'
];

/** Ev manevrasının seçenekleri. */
export const CONSENT_OPTIONS: string[] = [
  'Manevrayı muayenede hekiminize ya da odyoloğunuza (işitme uzmanı) yaptırabilirsiniz; çoğu kişi bir iki seansta düzelir.',
  'Kristal oynaması çoğu zaman haftalar içinde kendiliğinden de geçer; beklemek de bir seçenektir.',
  'Uygulamayı istediğiniz an bırakabilirsiniz.'
];

/**
 * Katlanabilir kutuların kapalıyken de görünen tek satırlık özeti (kullanıcı turu 3, k03: onam ekranı kısalsın ama
 * yan etkilerin ve seçeneklerin ne olduğu ilk bakışta görülsün). Metin anlamı değişmediği için onam sürümü değişmez.
 */
export const CONSENT_RISKS_GIST = 'Geçici baş dönmesi ve bulantı, düşme, nadiren kanal değişimi. Ayrıntı için dokunun.';
export const CONSENT_OPTIONS_GIST = 'Muayenede manevra, beklemek ya da istediğiniz an bırakmak. Ayrıntı için dokunun.';

/** Onay kutusunun metni. Yakını hasta adına kuruyorsa öznesi değişir. */
export function consentStatement(helper: boolean): string {
  const who = helper ? 'Hasta adına, onun bilgisi ve isteğiyle okudum ve anladım' : 'Okudum ve anladım';
  return `${who}: DengeYol tanı koymaz, doktorun yerine geçmez ve yalnız hekim tanısıyla kullanılabilir. Tıbbi cihaz onayı olmayan, deneme aşamasındaki bir araştırma uygulamasıdır. Olası yan etkileri ve diğer seçenekleri okudum; ev manevrasını hekimin önerdiği biçimde, isteğe bağlı olarak yapmayı kabul ediyorum. (Veriler yalnızca bu telefonda saklanır.)`;
}

/** Rapor satırı: "31 Ekim 2026 · metin sürümü 2 · hasta adına yakını". Onam yoksa null. */
export function consentLine(p: PatientProfile | undefined): string | null {
  if (!p?.consentAt) return null;
  const t = Date.parse(p.consentAt);
  const parts = [Number.isFinite(t) ? formatDate(t) : p.consentAt, `metin sürümü ${p.consentVersion ?? '1'}`];
  if (p.consentBy === 'helper') parts.push('hasta adına yakını onayladı');
  return parts.join(' · ');
}
