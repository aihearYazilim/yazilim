/**
 * Sesli yönerge (Web Speech API, Türkçe). Ses yoksa sessizce görsel moda düşer.
 * Not: Yerel uygulama sürümünde önceden kaydedilmiş insan sesi kullanılması önerilir (docs/YOL-HARITASI.md).
 */
/**
 * Konuşma hızı seçenekleri (Ayarlar ve kurulum). "Çok yavaş", ağır işiten/yavaş okuyan kullanıcılar içindir (k04, k01);
 * yürütücü süreleri hıza göre tahmin edildiğinden (estimateSpeechSec) ek ayar gerekmez.
 */
export const SPEECH_RATES: { value: number; label: string }[] = [
  { value: 0.65, label: 'Çok yavaş' },
  { value: 0.8, label: 'Yavaş' },
  { value: 1, label: 'Normal' },
  { value: 1.15, label: 'Hızlı' }
];

/** Hız denemesinde okunan örnek yönerge (gerçek bir manevra cümlesine benzer). */
export const SPEECH_SAMPLE =
  'Ses denemesi. Manevrada yönergeleri bu hızda duyacaksınız. Örneğin: Şimdi başınızı sağa çevirin ve yavaşça sırtüstü yatın.';

/**
 * Konuşma metnini sesli okumaya uygun hâle getirir (ekrandaki metin değişmez). Türkçe sesler "/" işaretini "bölü" diye,
 * okları ve "·" işaretini adıyla okuyabilir (k01, k03, k05):
 * - sözcükler arasındaki "/" → " ya da " ("aspirin/Coraspin" → "aspirin ya da Coraspin"); sayı/sayı (1/15) ve adresler korunur,
 * - ayraçlar virgüllü duraklamaya çevrilir ("(hangi kulağınız alttayken)" → ", hangi kulağınız alttayken,"),
 * - oklar ve köşeli ayraç işaretleri ("[←]", "→") atılır; "·" virgül olur; "~" → "yaklaşık ",
 * - yaygın kısaltmalar açılır (kullanıcı turu 3, k07: ses "ör." için "ör" diyordu): bkz. expandAbbreviations.
 */
export function speechText(text: string): string {
  return (
    expandAbbreviations(text)
      // Ok işaretleri ve köşeli ayraçlı ok etiketleri
      .replace(/\[\s*[←→↑↓]\s*\]/g, ' ')
      .replace(/[←→↑↓⟵⟶]/g, ' ')
      // Sözcükler arası eğik çizgi (sayı/sayı ve "https://" dokunulmaz)
      .replace(/(^|[^\d:/])\s*\/\s*(?=[^\d/]|$)/g, '$1 ya da ')
      .replace(/~\s*/g, 'yaklaşık ')
      .replace(/\s*·\s*/g, ', ')
      // Ayraçlar: duraklama
      .replace(/\s*\(\s*/g, ', ')
      .replace(/\s*\)\s*(?=[.,;:!?]|$)/g, '')
      .replace(/\s*\)\s*/g, ', ')
      // Art arda noktalama ve boşluk temizliği
      .replace(/\s+([.,;:!?])/g, '$1')
      .replace(/,\s*([.,;:!?])/g, '$1')
      .replace(/^[\s,]+/, '')
      .replace(/\s{2,}/g, ' ')
      .trim()
  );
}

/** Harf olmayan (ya da metnin başı/sonu) sınır: kısaltma bir sözcüğün parçası değilse açılır. */
const B = '(^|[^\\p{L}\\p{N}])';
const E = '(?![\\p{L}\\p{N}])';

/**
 * Sesli okumada açılan kısaltmalar. Yalnız anlamı tek ve yanlış okunma olasılığı yüksek olanlar: noktalı kısaltmalar
 * ("ör.", "vb.", "Dr.") her yerde; birim kısaltmaları ("dk", "sn") yalnız bir sayıdan sonra (başka bir sözcükle
 * karışmasın). Büyük harfle başlayan kısaltma büyük harfle açılır ("Ör." → "Örneğin").
 */
const ABBREVIATIONS: { re: RegExp; to: string }[] = [
  { re: new RegExp(`${B}(ö)rn?\\.${E}`, 'giu'), to: 'rneğin' },
  { re: new RegExp(`${B}vb\\.${E}`, 'gu'), to: 've benzeri' },
  { re: new RegExp(`${B}vs\\.${E}`, 'gu'), to: 've saire' },
  { re: new RegExp(`${B}bkz\\.${E}`, 'giu'), to: 'bakınız' },
  { re: new RegExp(`${B}Prof\\.\\s*`, 'gu'), to: 'Profesör ' },
  { re: new RegExp(`${B}Doç\\.\\s*`, 'gu'), to: 'Doçent ' },
  { re: new RegExp(`${B}Uzm\\.\\s*`, 'gu'), to: 'Uzman ' },
  { re: new RegExp(`${B}Dr\\.\\s*`, 'gu'), to: 'Doktor ' },
  { re: new RegExp(`(\\d)\\s*dk${E}`, 'gu'), to: ' dakika' },
  { re: new RegExp(`(\\d)\\s*sn${E}`, 'gu'), to: ' saniye' },
];

/** Kısaltmaları sesli okunacak biçimde açar (ekrandaki metin değişmez). */
export function expandAbbreviations(text: string): string {
  let s = text;
  for (const { re, to } of ABBREVIATIONS) {
    if (to === 'rneğin') {
      // "ör." / "örn." → "örneğin"; ilk harfin büyüklüğü korunur.
      s = s.replace(re, (_m, pre: string, o: string) => `${pre}${o}${to}`);
    } else {
      s = s.replace(re, (_m, pre: string) => `${pre}${to}`);
    }
  }
  return s;
}

export class Speech {
  enabled = true;
  rate = 1;
  private voice: SpeechSynthesisVoice | null = null;
  private queueLen = 0;

  constructor() {
    if (!Speech.supported()) return;
    const pick = () => {
      const voices = window.speechSynthesis.getVoices();
      this.voice =
        voices.find((v) => v.lang?.toLowerCase().startsWith('tr') && v.localService) ??
        voices.find((v) => v.lang?.toLowerCase().startsWith('tr')) ??
        null;
    };
    pick();
    window.speechSynthesis.addEventListener?.('voiceschanged', pick);
  }

  static supported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  }

  hasTurkishVoice(): boolean {
    return !!this.voice;
  }

  /** iOS/Safari: ilk konuşma kullanıcı dokunuşu içinde başlatılmalıdır. */
  unlock(): void {
    if (!Speech.supported()) return;
    try {
      const u = new SpeechSynthesisUtterance(' ');
      u.volume = 0;
      u.lang = 'tr-TR';
      window.speechSynthesis.speak(u);
    } catch {
      /* yok say */
    }
  }

  /** Türkçe sesli okuma gerçekten kullanılabilir mi? (ses kapalıysa ya da Türkçe ses yoksa false) */
  usable(): boolean {
    return this.enabled && Speech.supported() && !!this.voice;
  }

  /**
   * Söyler ve konuşma bitince çözülür (onend/onerror). Ses yoksa hemen; olay hiç gelmezse `maxMs` sonra çözülür.
   * Ölçüm yönergenin bitmesini beklesin diye: yavaş bir ses tahmini süreyi aşabilir.
   */
  speakAsync(text: string, maxMs: number): Promise<void> {
    if (!this.enabled || !Speech.supported() || !text) return Promise.resolve();
    return new Promise((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        resolve();
      };
      setTimeout(finish, maxMs);
      this.speak(text, 'high', finish);
    });
  }

  speak(text: string, priority: 'high' | 'normal' = 'normal', onDone?: () => void): void {
    try {
      this.speakInner(text, priority, onDone);
    } catch {
      // Konuşma motoru hatası uygulamayı düşürmesin: sesi kapat, görsel/ton yönlendirmeyle devam et.
      this.enabled = false;
      onDone?.();
    }
  }

  private speakInner(text: string, priority: 'high' | 'normal', onDone?: () => void): void {
    if (!this.enabled || !Speech.supported() || !text) return;
    // Okunacak biçim ("/" → "ya da", ayraç → duraklama); ekrandaki metin değişmez.
    const said = speechText(text);
    if (!said) {
      onDone?.();
      return;
    }
    const synth = window.speechSynthesis;
    if (priority === 'high') {
      synth.cancel();
      this.queueLen = 0;
    } else if (this.queueLen >= 2) {
      // Eski ipuçlarını biriktirme
      return;
    }
    const u = new SpeechSynthesisUtterance(said);
    u.lang = 'tr-TR';
    if (this.voice) u.voice = this.voice;
    u.rate = this.rate;
    this.queueLen++;
    const done = () => {
      this.queueLen = Math.max(0, this.queueLen - 1);
      onDone?.();
    };
    u.onend = done;
    u.onerror = done;
    synth.speak(u);
  }

  cancel(): void {
    if (!Speech.supported()) return;
    window.speechSynthesis.cancel();
    this.queueLen = 0;
  }
}

export const speech = new Speech();
