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
    expect(speechText('14 soru · ~8 dk')).toBe('14 soru, yaklaşık 8 dakika');
    expect(speechText('(Veriler yalnızca bu telefonda saklanır.)')).toBe('Veriler yalnızca bu telefonda saklanır.');
  });
  it('kısaltmalar açılır (k07): "ör." → "örneğin", unvanlar, sayıdan sonraki "dk"/"sn"', () => {
    expect(speechText('gelinemedi (ör. baş yeterince geriye sarkamadı)')).toBe('gelinemedi, örneğin baş yeterince geriye sarkamadı');
    expect(speechText('Ör. aspirin, varfarin vb. ilaçlar')).toBe('Örneğin aspirin, varfarin ve benzeri ilaçlar');
    expect(speechText('örn. boyun fıtığı')).toBe('örneğin boyun fıtığı');
    expect(speechText('Doç. Dr. Serkan K.')).toBe('Doçent Doktor Serkan K.');
    expect(speechText('10 dk oturun; 30 sn bekleyin.')).toBe('10 dakika oturun; 30 saniye bekleyin.');
    expect(speechText('~8 dk.')).toBe('yaklaşık 8 dakika.');
    // Sözcüğün parçası olan ya da sayıdan sonra gelmeyen harfler dokunulmaz.
    expect(speechText('Gör. dk sonra snack, 5 dakika, görüş')).toBe('Gör. dk sonra snack, 5 dakika, görüş');
    expect(speechText('Kendi isteğiniz ve görüşünüz önemli.')).toBe('Kendi isteğiniz ve görüşünüz önemli.');
  });
  it('düz metin değişmez', () => {
    const t = 'Şimdi başınızı sağa çevirin ve yavaşça sırtüstü yatın.';
    expect(speechText(t)).toBe(t);
  });
});

describe('saniye kısaltması (kullanıcı turu 4, k07)', () => {
  it('sayıdan sonraki "s" "saniye" okunur; sözcük içindeki s değişmez', () => {
    expect(speechText('72 s içinde gelinemedi')).toBe('72 saniye içinde gelinemedi');
    expect(speechText('45 sn kaldı')).toBe('45 saniye kaldı');
    expect(speechText('2 sağ yan')).toBe('2 sağ yan');
  });
});
