import { describe, expect, it } from 'vitest';
import { speechText } from './speech';

describe('konuşma metni (speechText)', () => {
  it('sözcükler arasındaki "/" "ya da" okunur; sayı/sayı ve adres korunur', () => {
    expect(speechText('aspirin/Coraspin dahil')).toBe('aspirin ya da Coraspin dahil');
    expect(speechText('yüzde/kolda güçsüzlük')).toBe('yüzde ya da kolda güçsüzlük');
    expect(speechText('Hayır / emin değilim')).toBe('Hayır ya da emin değilim');
    expect(speechText('bu dönemde 1/15 manevra')).toBe('bu dönemde 1/15 manevra');
    expect(speechText('https://ornek.org adresinden')).toBe('https://ornek.org adresinden');
  });
  it('ayraçlar duraklamaya döner; oklar, "·" ve "~" okunabilir olur', () => {
    expect(speechText('Hangi yanınıza yatınca (hangi kulağınız alttayken)?')).toBe('Hangi yanınıza yatınca, hangi kulağınız alttayken?');
    expect(speechText('Bel/sırt (omurga) sorunu.')).toBe('Bel ya da sırt, omurga, sorunu.');
    expect(speechText('[←] Başı HASTANIN SOLUNA çevirin →')).toBe('Başı HASTANIN SOLUNA çevirin');
    expect(speechText('14 soru · ~8 dk')).toBe('14 soru, yaklaşık 8 dk');
    expect(speechText('(Veriler yalnızca bu telefonda saklanır.)')).toBe('Veriler yalnızca bu telefonda saklanır.');
  });
  it('düz metin değişmez', () => {
    const t = 'Şimdi başınızı sağa çevirin ve yavaşça sırtüstü yatın.';
    expect(speechText(t)).toBe(t);
  });
});
