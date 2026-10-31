import { describe, expect, it } from 'vitest';
import { RED_FLAGS } from '../../../core/safety';
import {
  AFTER_SEVERE_SPOKEN,
  AFTER_SPOKEN_MAX_CHARS,
  afterManeuverSpoken,
  choiceSpeechParts,
  CONFIRM_GAP_PX,
  confirmBackPad,
  confirmPlacement,
  prepItems,
  prepSpokenFull,
  prepSpokenShort,
  redFlagConfirmHeadline,
  verticalOverlap
} from './flowText';

describe('seçenekli ekranın sesli biçimi (kullanıcı turu 3, k01, k04, k05)', () => {
  const opts = [
    { label: 'Hayır, muayeneden beri hiç geçmedi', sub: 'Reçetedeki tarafa doğrudan manevra.' },
    { label: 'Evet, geçmişti; yeniden başladı', sub: 'Kısa sorular ve iki taraflı test.' },
    { label: 'İkisi de / emin değilim' }
  ];
  it('varsayılan okunuş: soru ve seçenek adları; alt açıklamalar ve açıklama satırı yalnız "Tekrar dinle"de', () => {
    const { short, full } = choiceSpeechParts({ title: 'Soru?', lead: 'Uzun açıklama.' }, opts);
    expect(short).toBe('Soru? Birinci: Hayır, muayeneden beri hiç geçmedi. İkinci: Evet, geçmişti; yeniden başladı. Üçüncü: İkisi de ya da emin değilim.');
    expect(short).not.toMatch(/Reçetedeki|Kısa sorular|Uzun açıklama/);
    expect(full).toMatch(/^Soru\? Uzun açıklama\. Birinci: Hayır, muayeneden beri hiç geçmedi\. Reçetedeki tarafa doğrudan manevra\./);
    expect(full).toMatch(/Kısa sorular ve iki taraflı test\./);
    // Hiçbir seçenek düşmez.
    for (const o of opts) expect(short).toContain(o.label.replace(' / ', ' ya da '));
  });
  it('kısa soru başlığı ve kısa açıklama verilebilir; tam okunuşta asıl metin kalır', () => {
    const { short, full } = choiceSpeechParts(
      { title: 'Hangi yanınıza yatınca (hangi kulağınız alttayken) olur?', spokenTitle: 'Hangi yanınıza yatınca olur?', lead: 'Uzun.', spokenLead: 'Kısa.' },
      [{ label: 'Sağ' }]
    );
    expect(short).toBe('Hangi yanınıza yatınca olur? Kısa. Birinci: Sağ.');
    expect(full).toBe('Hangi yanınıza yatınca (hangi kulağınız alttayken) olur? Uzun. Birinci: Sağ.');
  });
  it('güvenlik için gerekli alt açıklama (subAlways) varsayılan okunuşta da okunur', () => {
    const { short } = choiceSpeechParts({ title: 'Şu an nasılsınız?' }, [
      { label: 'Hafif baş dönmesi var', sub: 'Birkaç dakika sürebilir.' },
      { label: 'Yeni belirti var', sub: 'Konuşma bozukluğu, yüzde/kolda güçsüzlük.', subAlways: true }
    ]);
    expect(short).not.toMatch(/Birkaç dakika/);
    expect(short).toMatch(/Yeni belirti var: Konuşma bozukluğu, yüzde ya da kolda güçsüzlük\./);
  });
});

describe('"Doğru mu?" onayı (kullanıcı turu 3, k05, k06)', () => {
  it('güvenlik sorusunun onay başlığı belirtinin kısa adını söyler', () => {
    const neuro = RED_FLAGS.find((q) => q.id === 'neuro')!;
    expect(redFlagConfirmHeadline(neuro)).toBe('Çift görme, konuşma ya da yutma bozukluğu var');
    for (const q of RED_FLAGS) expect(redFlagConfirmHeadline(q)).toMatch(/^\p{Lu}.* var$/u);
  });
  it('"Evet" kartın altına ancak dokunulan yerin en az boşluk kadar üstünde biterse konur', () => {
    expect(confirmPlacement(400, 300)).toBe('yesAbove');
    expect(confirmPlacement(332, 300)).toBe('yesAbove');
    expect(confirmPlacement(331, 300)).toBe('yesBelow');
    expect(confirmPlacement(120, 300)).toBe('yesBelow');
  });
  it('"Yanlış dokundum" dokunulan yere iner; doğal yeri aşağıdaysa boşluk eklenmez', () => {
    expect(confirmBackPad(400, 250)).toBe(150);
    expect(confirmBackPad(200, 250)).toBe(0);
  });
  it('iki yerleşimde de "Evet" dokunulan yerle çakışmaz (çift kör dokunuş onay vermez)', () => {
    const yesH = 64;
    const cardBottom = 200;
    for (const tapTop of [80, 150, 230, 260, 296, 297, 400, 600]) {
      const tapH = 64;
      const tap = { top: tapTop, bottom: tapTop + tapH };
      const yesAboveBottom = cardBottom + 12 + yesH;
      if (confirmPlacement(tapTop, yesAboveBottom) === 'yesAbove') {
        const yes = { top: yesAboveBottom - yesH, bottom: yesAboveBottom };
        const backTop = yesAboveBottom + 12 + confirmBackPad(tapTop, yesAboveBottom + 12);
        expect(backTop).toBe(tapTop);
        expect(verticalOverlap(yes, tap, CONFIRM_GAP_PX - 1)).toBe(false);
      } else {
        // Kart en üstte, "Yanlış dokundum" dokunulan yerde ya da kartın hemen altında, "Evet" ondan sonra.
        const backTop = cardBottom + 12 + confirmBackPad(tapTop, cardBottom + 12);
        const backBottom = backTop + Math.max(56, tapH);
        const yes = { top: backBottom + 12 + CONFIRM_GAP_PX, bottom: backBottom + 12 + CONFIRM_GAP_PX + yesH };
        expect(verticalOverlap(yes, tap, CONFIRM_GAP_PX - 1)).toBe(false);
      }
    }
  });
});

describe('hazırlık ekranı (kullanıcı turu 3, k02, k05)', () => {
  const self = { helper: false, semontOnly: false, semontAfterTests: false };
  const helper = { ...self, helper: true };
  it('yakını modunda maddeler yardımcıya göre; madde sayısı aynı', () => {
    const a = prepItems(self);
    const b = prepItems(helper);
    expect(b.length).toBe(a.length);
    expect(a[0]).toMatch(/^Yatağın üzerine oturun/);
    expect(b[0]).toMatch(/^Hastayı yatağın üzerine oturtun/);
    expect(b.join(' ')).toMatch(/hastanın alnına/);
    expect(b.join(' ')).toMatch(/siz dokunun/);
    expect(b.join(' ')).not.toMatch(/alnınıza|oturun;/);
    expect(prepItems({ ...helper, semontOnly: true })[0]).toMatch(/^Hastayı yatağın uzun kenarının/);
    expect(prepItems({ ...self, semontAfterTests: true })).toHaveLength(a.length + 1);
  });
  it('açılışta okunan kısa hâl gerçekten kısa; tam hâl bütün maddeleri içerir', () => {
    for (const x of [self, helper, { ...self, semontOnly: true }]) {
      const short = prepSpokenShort(x);
      expect(short.length).toBeLessThan(140);
      expect(short).toMatch(/Hazırım/);
      expect(short).toMatch(/Sesi açın/);
      const full = prepSpokenFull(x);
      for (const it of prepItems(x)) expect(full).toContain(it);
    }
    expect(prepSpokenShort(helper)).toMatch(/Hastayı/);
  });
});

describe('manevra sonu sesli metni ≤ ~10 s (kullanıcı turu 3, k01, k05)', () => {
  it('kısa: dinlenme, tutunarak kalkma ve tekrar testi saati', () => {
    for (const sev of ['none', 'mild'] as const) {
      for (const night of [false, true]) {
        const t = afterManeuverSpoken(sev, '15:03', night);
        expect(t.length).toBeLessThanOrEqual(AFTER_SPOKEN_MAX_CHARS);
        expect(t).toMatch(/On dakika oturun/);
        expect(t).toMatch(/tutunarak/);
        expect(t).toContain('15:03');
      }
    }
    expect(afterManeuverSpoken('mild', '15:03', false)).toMatch(/^Hafif baş dönmesi normaldir/);
    expect(afterManeuverSpoken('none', '02:10', true)).toMatch(/uyanınca/);
  });
  it('kusma yanıtında 112 uyarısı seste kalır', () => {
    expect(AFTER_SEVERE_SPOKEN).toMatch(/112/);
    expect(AFTER_SEVERE_SPOKEN).toMatch(/tekrarlamayın/);
  });
});
