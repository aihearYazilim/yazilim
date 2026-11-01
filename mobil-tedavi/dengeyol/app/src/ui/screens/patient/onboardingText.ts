/**
 * Hasta kurulumunun (Onboarding) saf metinleri: birim testlerle sınanır, React'e bağlı değildir.
 * Kullanıcı turu 4: uygunluk listesi önce kısa girişle okunur, tam liste "Tekrar dinle"de (k01); "Son 2 hafta içinde"
 * seçiminin tarihi süre dolmadan da görünür (k03); işitme notu yakını modunda yardımcıya göre (k02).
 */
import { CONTRAINDICATIONS } from '../../../core/safety';
import { DX_RECENT_GRACE_DAYS } from '../../../state/dxTiming';
import { formatDate } from '../../../state/episodes';

const ORDINALS = ['Birinci', 'İkinci', 'Üçüncü', 'Dördüncü', 'Beşinci', 'Altıncı', 'Yedinci', 'Sekizinci', 'Dokuzuncu', 'Onuncu', 'On birinci', 'On ikinci', 'On üçüncü', 'On dördüncü'];

/** Eski uygunluk listesinin "hiçbiri" seçeneği (yeniden tasarımda liste isteğe bağlı; seçenek yok, ad uyumluluk için). */
export const noneLabel = (helper: boolean) => (helper ? 'Hiçbiri hastaya uymuyor' : 'Hiçbiri bana uymuyor');

/**
 * Kurulumda "Başla"nın hemen üstündeki kısa onay kutusu (yeni kullanıcı turu 1, L2-3; y01, y03, y06). Onam metninin
 * tamamı ekranda üstte yazılıdır (consentStatement).
 */
export function consentCheckLabel(helper: boolean): string {
  return helper ? 'Hasta adına yukarıdaki metni okudum, kabul ediyorum' : 'Yukarıdaki metni okudum, kabul ediyorum';
}

/**
 * Onaysız (soluk) "Başla"ya dokunulunca kısa ses. "Onay kutusu" denmez (L5-6; y02: "onay kutusu ne, bilmiyorum"): satırın
 * kendisi söylenir.
 */
export const CONSENT_FIRST_SPOKEN = 'Önce Başla düğmesinin hemen üstündeki "Okudum, kabul ediyorum" yazısına dokunun.';

/**
 * Kurulum (onam) ekranı açılınca okunan kısa özet (L5-6; y02, y07: kurulum tamamen sessizdi). Tam metin ekranda; ekran
 * değişince SpeechHush susturur.
 */
export function consentSpoken(helper: boolean): string {
  return [
    'Kurulum. DengeYol, yatarken, kalkarken ya da yatakta dönerken gelen kısa baş dönmesinde testi ve manevrayı sesle adım adım yaptırır.',
    "Durmadan süren baş dönmesi, çift görme, konuşma bozukluğu ya da güçsüzlük varsa uygulamayı bırakıp 112'yi arayın.",
    helper
      ? 'Hasta adına kabul ediyorsanız ekranın altındaki "Okudum, kabul ediyorum" yazısına, sonra Başla düğmesine dokunun.'
      : 'Kabul ediyorsanız ekranın altındaki "Okudum, kabul ediyorum" yazısına, sonra Başla düğmesine dokunun.'
  ].join(' ');
}

/** Karşılama ekranı açılınca okunan kısa ses (L5-6). */
export const WELCOME_SPOKEN =
  'DengeYol. Baş dönmesi yaşıyorsanız üstteki büyük düğmeye dokunun: Baş dönmesi yaşıyorum. Alttaki düğme yalnız hekim ve odyologlar içindir.';

/** "Klinisyenim"e dokununca sorulan onay (L5-5; y02: yanlış dokunuş klinisyen modunu kalıcı açıyordu). */
export const CLINICIAN_CONFIRM_TITLE = 'Hekim ya da odyolog musunuz?';
export const CLINICIAN_CONFIRM_TEXT = 'Klinisyen modu muayene ve reçete içindir. Baş dönmesi yaşıyorsanız "Hayır, hastayım"a dokunun.';
export const CLINICIAN_CONFIRM_SPOKEN = 'Hekim ya da odyolog musunuz? Baş dönmesi yaşıyorsanız üstteki büyük düğmeye dokunun: Hayır, hastayım.';

/** Uygunluk listesinin "Tekrar dinle" düğmesinin etiketi (kısa girişten sonra bütün maddeleri okur). */
export const CONTRA_LISTEN_LABEL = 'Tekrar dinle (bütün maddeler)';

/**
 * Uygunluk listesinin tam sesli metni ("Tekrar dinle"): kısa başlıklar madde madde ("uyuyorsa işaretleyin"); ayrıntılar
 * ekranda (k05). Ekrandaki her maddenin başında da aynı kısa ad kalın yazılır. Yardımcı modunda metin yardımcıya göredir (k02).
 */
export function contraSpeech(helper: boolean): string {
  return [
    helper
      ? 'Hasta için uygun mu? Aşağıdaki durumlardan hastaya uyan varsa işaretleyin; emin olmadığınız bir madde varsa da işaretleyin ve hastanın doktoruna sorun.'
      : 'Sizin için uygun mu? Aşağıdaki durumlardan size uyan varsa işaretleyin; emin olmadığınız bir madde varsa da işaretleyin ve doktorunuza sorun.',
    ...CONTRAINDICATIONS.map((c, i) => `${ORDINALS[i] ?? `${i + 1}.`} madde: ${c.label}.`),
    'Hiçbiri uymuyorsa bir şey işaretlemeniz gerekmez. İşaretlemek manevrayı engellemez; yalnız uyarı gösterilir. Ayrıntılar ekranda yazıyor.'
  ].join(' ');
}

/**
 * Uygunluk adımı açılınca okunan kısa giriş (kullanıcı turu 4, k01: "Yavaş" seste tam liste ~90 s sürüyordu). Tam liste
 * "Tekrar dinle (bütün maddeler)" düğmesinde; okuyamayan kişi (k05) düğmeyi buradan öğrenir. Kullanıcı turu 5 (k05): "emin
 * değilseniz işaretleyin ve doktorunuza sorun" kısa girişte de söylenir.
 */
export function contraSpeechShort(helper: boolean): string {
  return [
    helper ? 'Hasta için uygun mu?' : 'Sizin için uygun mu?',
    helper
      ? 'Ekrandaki durumlardan hastaya uyan varsa işaretleyin; hiçbiri uymuyorsa bir şey işaretlemeniz gerekmez.'
      : 'Ekrandaki durumlardan size uyan varsa işaretleyin; hiçbiri uymuyorsa bir şey işaretlemeniz gerekmez.',
    // Yalnız dinleyen kişi emin olmadığında ne yapacağını da duysun (kullanıcı turu 5, k05).
    helper ? 'Emin değilseniz o maddeyi işaretleyin ve hastanın doktoruna sorun.' : 'Emin değilseniz o maddeyi işaretleyin ve doktorunuza sorun.',
    'Maddelerin hepsini dinlemek için Tekrar dinle düğmesine dokunun.'
  ].join(' ');
}

/** Uygunluk adımındaki işitme notu; yakını modunda yardımcıya göre ("bir yakınınızla yapın" denmez; k02). */
export function contraHearingText(helper: boolean): string {
  return helper
    ? 'Hastanın işitme kaybı varsa da kullanılabilir: manevrada yönergeler size söylenir, hastaya yalnız kıpırdamaması söylenir. Yazılar ekranda da görünür; titreşim ve bip sesleri hastayı ne zaman hareket ettireceğinizi bildirir.'
    : 'İşitme kaybınız varsa da kullanabilirsiniz: işitme cihazınızı ya da kulaklığınızı Bluetooth ile telefona bağlayın, sesi en yükseğe alın ya da bir yakınınızla yapın. Yazılar ekranda da görünür; titreşim ve bip sesleri ne zaman hareket edeceğinizi bildirir.';
}

/**
 * "Son 2 hafta içinde" yanıtının yakın sayıldığı son gün: yanıt gününden 14 + pay takvim günü sonrası (state/dxTiming
 * `dxIsRecent` ile aynı kural; ertesi gün tanı "Daha önce" sayılır).
 */
export function dxRecentLastDay(answeredAt: number): number {
  const d = new Date(answeredAt);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + 14 + DX_RECENT_GRACE_DAYS);
  return d.getTime();
}

/**
 * "Son 2 hafta içinde" seçiminin tarihi (kullanıcı turu 4, k03): süre dolmadan da görünür. Bu oturumda seçildiyse
 * (kaydedilince bugünün tarihi yazılır) "bugün" denir.
 */
export function dxRecentAnsweredText(answeredAt: number, now: number): string {
  const today = formatDate(answeredAt) === formatDate(now);
  return `${today ? `Bugün (${formatDate(answeredAt)})` : `${formatDate(answeredAt)} tarihinde`} seçildi; ${formatDate(dxRecentLastDay(answeredAt))} tarihine kadar "son 2 hafta" sayılır, sonra kendiliğinden "Daha önce" olur.`;
}
