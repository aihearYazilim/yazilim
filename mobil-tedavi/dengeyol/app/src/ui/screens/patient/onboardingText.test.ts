import { describe, expect, it } from 'vitest';
import { CONTRA_NOT_BLOCKING_TEXT, CONTRA_NOT_BLOCKING_TEXT_HELPER, CONTRAINDICATIONS } from '../../../core/safety';
import { dxIsRecent } from '../../../state/dxTiming';
import {
  CLINICIAN_CONFIRM_SPOKEN,
  CLINICIAN_CONFIRM_TEXT,
  CLINICIAN_CONFIRM_TITLE,
  CONSENT_FIRST_SPOKEN,
  consentSpoken,
  contraHearingText,
  contraSpeech,
  contraSpeechShort,
  dxRecentAnsweredText,
  dxRecentLastDay,
  noneLabel,
  WELCOME_SPOKEN
} from './onboardingText';

describe('uygunluk listesinin sesli okunuşu (kullanıcı turu 4, k01, k05)', () => {
  it('açılışta kısa giriş: madde okunmaz, "hiçbiri" ve "Tekrar dinle" söylenir', () => {
    for (const helper of [false, true]) {
      const s = contraSpeechShort(helper);
      expect(s).toMatch(/hiçbiri uymuyorsa bir şey işaretlemeniz gerekmez/);
      expect(s).toMatch(/Tekrar dinle/);
      for (const c of CONTRAINDICATIONS) expect(s).not.toContain(`madde: ${c.label}`);
      // Tam listenin küçük bir parçası (normal hızda ~20 s).
      expect(s.length).toBeLessThan(300);
      // Kullanıcı turu 5 (k05): emin olmayan ne yapacağını kısa girişte de duyar.
      expect(s).toMatch(/Emin değilseniz o maddeyi işaretleyin ve (hastanın )?doktoru(nuza|na) sorun\./);
      expect(s.length * 3).toBeLessThan(contraSpeech(helper).length);
    }
    expect(contraSpeechShort(true)).toMatch(/^Hasta için uygun mu\?/);
    expect(contraSpeechShort(false)).toMatch(/^Sizin için uygun mu\?/);
    expect(contraSpeechShort(false)).toContain('Emin değilseniz o maddeyi işaretleyin ve doktorunuza sorun.');
    expect(contraSpeechShort(true)).toContain('Emin değilseniz o maddeyi işaretleyin ve hastanın doktoruna sorun.');
  });
  it('"Tekrar dinle"de bütün maddeler; liste isteğe bağlı ve engellemez (yeniden tasarım)', () => {
    const s = contraSpeech(false);
    for (const c of CONTRAINDICATIONS) expect(s).toContain(c.label);
    expect(s).not.toContain(noneLabel(false));
    expect(s).toMatch(/İşaretlemek manevrayı engellemez/);
    expect(contraSpeech(true)).toMatch(/^Hasta için uygun mu\?/);
  });
});

describe('yakını modunda işitme notu (kullanıcı turu 4, k02)', () => {
  it('yardımcıya "bir yakınınızla yapın" denmez', () => {
    expect(contraHearingText(true)).not.toMatch(/yakınınızla/);
    expect(contraHearingText(true)).toMatch(/^Hastanın işitme kaybı/);
    expect(contraHearingText(false)).toMatch(/yakınınızla yapın/);
  });
});

describe('"Son 2 hafta içinde" seçiminin tarihi (kullanıcı turu 4, k03)', () => {
  const at = new Date('2026-10-31T10:00:00').getTime();
  const day = 24 * 3600_000;
  it('seçim günü ve yakın sayıldığı son gün yazılır; son gün dxIsRecent ile aynı', () => {
    const t = dxRecentAnsweredText(at, at + 3 * day);
    expect(t).toMatch(/^31 Ekim 2026 tarihinde seçildi; 15 Kasım 2026 tarihine kadar "son 2 hafta" sayılır/);
    const last = dxRecentLastDay(at);
    expect(dxIsRecent({ dxWhen: 'recent', dxWhenAt: at }, last)).toBe(true);
    expect(dxIsRecent({ dxWhen: 'recent', dxWhenAt: at }, last + day)).toBe(false);
  });
  it('bugün seçildiyse "Bugün" denir', () => {
    expect(dxRecentAnsweredText(at, at + 3600_000)).toMatch(/^Bugün \(31 Ekim 2026\) seçildi/);
  });
});

describe('tansiyon ilacı notu (kullanıcı turu 4, k07)', () => {
  it('ayağa kalkınca göz kararmasında uygulamanın uyaracağı ve hekime önceden sorulması söylenir', () => {
    expect(CONTRA_NOT_BLOCKING_TEXT).toMatch(/Tansiyon ilacı kullanıyorsanız.*ayağa kalkınca göz kararması.*uyarır.*hekiminize önceden sorun/);
    expect(CONTRA_NOT_BLOCKING_TEXT_HELPER).toMatch(
      /Hasta tansiyon ilacı kullanıyorsa.*ayağa kalkınca göz kararması.*uyarır.*hastanın hekimine önceden sorun/
    );
  });
});

describe('tarihte gün başında sıfır yok (kullanıcı turu 5, k03)', () => {
  it('"8 Kasım 2026", "08 Kasım" değil', () => {
    const at = new Date('2026-10-24T10:00:00').getTime();
    const t = dxRecentAnsweredText(at, at + 7 * 24 * 3600_000);
    expect(t).toMatch(/^24 Ekim 2026 tarihinde seçildi; 8 Kasım 2026 tarihine kadar/);
    expect(t).not.toMatch(/\b08 /);
  });
});

describe('yeni kullanıcı turu 1, L5-5 ve L5-6: karşılama ve kurulum sesi', () => {
  it('kurulum kısa sesli özet: ne yaptığı, 112, nereye dokunulacağı; "onay kutusu" denmez', () => {
    for (const helper of [false, true]) {
      const s = consentSpoken(helper);
      expect(s).toMatch(/testi ve manevrayı sesle/);
      expect(s).toMatch(/112/);
      expect(s).toMatch(/"Okudum, kabul ediyorum" yazısına, sonra Başla/);
      expect(s).not.toMatch(/onay kutusu/);
      expect(s.length).toBeLessThan(420);
    }
    expect(consentSpoken(true)).toMatch(/Hasta adına/);
    expect(CONSENT_FIRST_SPOKEN).not.toMatch(/onay kutusu/);
    expect(CONSENT_FIRST_SPOKEN).toMatch(/Okudum, kabul ediyorum/);
  });
  it('karşılama sesi büyük düğmeyi söyler; klinisyen onayı "Hayır, hastayım"ı önerir', () => {
    expect(WELCOME_SPOKEN).toMatch(/Baş dönmesi yaşıyorum/);
    expect(CLINICIAN_CONFIRM_TITLE).toBe('Hekim ya da odyolog musunuz?');
    expect(CLINICIAN_CONFIRM_SPOKEN).toMatch(/Hayır, hastayım/);
    expect(CLINICIAN_CONFIRM_TEXT).toMatch(/Hayır, hastayım/);
  });
});
