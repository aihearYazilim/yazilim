/**
 * Hasta kurulumunun (Onboarding) saf metinleri: birim testlerle sınanır, React'e bağlı değildir.
 * Kullanıcı turu 4: uygunluk listesi önce kısa girişle okunur, tam liste "Tekrar dinle"de (k01); "Son 2 hafta içinde"
 * seçiminin tarihi süre dolmadan da görünür (k03); işitme notu yakını modunda yardımcıya göre (k02).
 */
import { CONTRAINDICATIONS } from '../../../core/safety';
import { DX_RECENT_GRACE_DAYS } from '../../../state/dxTiming';
import { formatDate } from '../../../state/episodes';

const ORDINALS = ['Birinci', 'İkinci', 'Üçüncü', 'Dördüncü', 'Beşinci', 'Altıncı', 'Yedinci', 'Sekizinci', 'Dokuzuncu', 'Onuncu', 'On birinci', 'On ikinci', 'On üçüncü', 'On dördüncü'];

/** Uygunluk listesinin en alttaki "hiçbiri" seçeneği. */
export const noneLabel = (helper: boolean) => (helper ? 'Hiçbiri hastaya uymuyor' : 'Hiçbiri bana uymuyor');

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
    `Hiçbiri uymuyorsa en alttaki "${noneLabel(helper)}" seçeneğini işaretleyin. Ayrıntılar ekranda yazıyor.`
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
      ? 'Ekrandaki durumlardan hastaya uyan varsa işaretleyin; hiçbiri uymuyorsa en alttaki seçeneği işaretleyin.'
      : 'Ekrandaki durumlardan size uyan varsa işaretleyin; hiçbiri uymuyorsa en alttaki seçeneği işaretleyin.',
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
