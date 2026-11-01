import { describe, expect, it } from 'vitest';
import { SAFETY_STOP_TEXT, type StepRecord, stopTextFor } from '../../../core/runner';
import { RED_FLAGS, REFER_TEXT, STOP_SPOKEN_MAX_CHARS } from '../../../core/safety';
import {
  AFTER_SEVERE_SPOKEN,
  AFTER_SPOKEN_MAX_CHARS,
  afterManeuverSpoken,
  choiceSpeechParts,
  CONFIRM_GAP_PX,
  confirmBackPad,
  confirmPlacement,
  LONG_IN_MANEUVER_NOTE,
  PREP_HELPER_ITEMS,
  prepHearingText,
  prepItems,
  prepSpokenFull,
  prepSpokenShort,
  redFlagConfirmHeadline,
  RETEST_LONG_SPOKEN,
  RETEST_LONG_TEXT,
  SAFETY_STOP_TEXT_HELPER,
  safetyStopSpoken,
  safetyStopTextFor,
  unreachableStopSpoken,
  UNWELL_END_TITLE,
  unwellEndSpoken,
  unwellEndText,
  verticalOverlap,
  withoutBppv,
  chainGateText,
  contraWarnText,
  decisionScreen,
  nextSideGateText,
  planWarn,
  RED_FLAG_CHECK_TEXT,
  redFlagAnswers,
  redFlagCheckText,
  RED_FLAGS_SPOKEN,
  redFlagsSpokenFull,
  redFlagsSpokenShort,
  RED_FLAG_SHORT,
  RED_FLAGS_SHORT_MAX_CHARS,
  nextStepLine,
  endSentence,
  resumeAskText,
  NEURO_START_TITLE,
  NEURO_START_TEXT,
  vasText,
  redFlagWarnSpoken,
  EMERGENCY_REMINDER_SPOKEN,
  NEURO_END_SPOKEN,
  NEURO_END_TEXT,
  NOT_TRIGGERED_NOTE,
  overrideCountdownLabel,
  RED_FLAG_ICON,
  redFlagIcon,
  redFlagToggleSpoken,
  feelCheckLead,
  feelCheckSpoken,
  feelCheckTitle,
  FOREHEAD_TAP_SPOKEN,
  HOME_VOMIT_TEXT,
  resumeManeuverNote,
  resumeSideNote,
  RETRY_AFTER_LONG_NOTE,
  singleSideNote,
  VOMIT_WARN_TITLE,
  vomitWarnSpoken,
  vomitWarnText
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

describe('yakını modunda hazırlık işitme notu ve durdurma bitiş ekranı (kullanıcı turu 4, k02)', () => {
  it('işitme cihazı notu yardımcıya göre; "bir yakınınızla yapın" denmez', () => {
    expect(prepHearingText(true)).toMatch(/^Hastanın işitme cihazı varsa/);
    expect(prepHearingText(true)).not.toMatch(/yakınınızla|kullanıyorsanız/);
    expect(prepHearingText(false)).toMatch(/^İşitme cihazı kullanıyorsanız.*bir yakınınızla yapın/);
  });
  it('yanlış taraf bitiş ekranı yakını modunda "Hastayı önce sırtüstüne getirin, sonra yavaşça oturtun"', () => {
    const recs = [{ unreachable: true, wrongSideStop: true } as unknown as StepRecord];
    const base = stopTextFor('POSITION_UNREACHABLE', recs);
    expect(base).toBe(SAFETY_STOP_TEXT.WRONG_SIDE);
    const helper = safetyStopTextFor(base, true);
    expect(helper).toBe(SAFETY_STOP_TEXT_HELPER.WRONG_SIDE);
    expect(helper).toMatch(/Hastayı önce sırtüstüne getirin, sonra yavaşça oturtun/);
    expect(helper).toMatch(/boyun ya da bel sorunu olduğu anlamına gelmez/);
    expect(helper).not.toMatch(/dönün|oturun\b/);
    // Hasta modunda metin değişmez.
    expect(safetyStopTextFor(base, false)).toBe(base);
  });
  it('diğer güvenlik durdurmaları da yakını modunda hastaya göre; bilinmeyen metin aynen döner', () => {
    for (const k of Object.keys(SAFETY_STOP_TEXT) as (keyof typeof SAFETY_STOP_TEXT)[]) {
      expect(safetyStopTextFor(SAFETY_STOP_TEXT[k], true)).toBe(SAFETY_STOP_TEXT_HELPER[k]);
      expect(SAFETY_STOP_TEXT_HELPER[k]).toMatch(/[Hh]asta/);
    }
    expect(SAFETY_STOP_TEXT_HELPER.VERTIGO_TOO_LONG).toMatch(/112/);
    expect(safetyStopTextFor('başka metin', true)).toBe('başka metin');
  });
});

describe('kullanıcı turu 5–6 (k01, k02, k05)', () => {
  it('"Şu an nasılsınız?" varsayılan okunuşu kısa ama sıra sayılı (tur 6, k05); "Yeni belirti" listesi kalır, tam hâl değişmez', () => {
    const opts = [
      { label: 'İyiyim' },
      { label: 'Hafif baş dönmesi ya da bulantı var', spokenLabel: 'Hafif baş dönmesi ya da bulantı', sub: 'Manevradan sonra birkaç dakika sürebilir.' },
      { label: 'Kusma ya da şiddetli bulantı var', spokenLabel: 'Kusma ya da şiddetli bulantı' },
      { label: 'Yeni belirti var', spokenLabel: 'Yeni belirti', sub: 'Konuşma bozukluğu, yüzde/kolda güçsüzlük, çift görme ya da şiddetli baş ağrısı.', subAlways: true }
    ];
    const q = { title: 'Şu an nasılsınız?', lead: 'Oturmaya devam edin; kalkarken dikkatli olun.' };
    const { short, full } = choiceSpeechParts(q, opts);
    expect(short).toBe(
      'Şu an nasılsınız? Birinci: İyiyim. İkinci: Hafif baş dönmesi ya da bulantı. Üçüncü: Kusma ya da şiddetli bulantı. Dördüncü: Yeni belirti: Konuşma bozukluğu, yüzde ya da kolda güçsüzlük, çift görme ya da şiddetli baş ağrısı.'
    );
    // Açıklama satırı ve "birkaç dakika" yalnız "Tekrar dinle"de.
    expect(short).not.toMatch(/Oturmaya|birkaç dakika/);
    // "Tekrar dinle"de ekrandaki adlar ve bütün alt açıklamalar.
    expect(full).toMatch(/^Şu an nasılsınız\? Oturmaya devam edin; kalkarken dikkatli olun\. Birinci: İyiyim\. İkinci: Hafif baş dönmesi ya da bulantı var\. Manevradan sonra/);
    // Kısa ad olmadan (5. tur öncesi) okunuştan kısa kalır.
    const withoutShortNames = choiceSpeechParts(q, opts.map(({ spokenLabel: _s, ...o }) => o)).short;
    expect(short.length).toBeLessThan(withoutShortNames.length);
    // Normal hızda (~13 karakter/s) ~17 s'yi aşmaz.
    expect(short.length).toBeLessThanOrEqual(225);
  });
  it('"Dinlenin" metni manevrada ve testte aynı yönlendirme (dinlenme, su, hekim, 112)', () => {
    expect(UNWELL_END_TITLE).toBe('Dinlenin');
    for (const w of ['maneuver', 'test'] as const) {
      expect(unwellEndText(w)).toMatch(/dinlenin ve su için.*hekiminize başvurun; acil belirtilerde 112'yi arayın\.$/);
    }
    expect(unwellEndText('maneuver')).toMatch(/^Manevrayı durdurdunuz\./);
    expect(unwellEndText('test')).toMatch(/^Testi durdurdunuz\./);
  });
  it('hazırlıktaki yardımcı kartı listedeki yastık ve tutuş maddesini tekrarlamaz', () => {
    const items = prepItems({ helper: true, semontOnly: false, semontAfterTests: false });
    expect(items.join(' ')).toMatch(/yastık/i);
    for (const t of PREP_HELPER_ITEMS) {
      expect(t).not.toMatch(/yastı/i);
      expect(t).not.toMatch(/parmak uç/);
    }
    const card = PREP_HELPER_ITEMS.join(' ');
    expect(card).toMatch(/başucunda/);
    expect(card).toMatch(/iki elle/);
    expect(card).toMatch(/geçince yeniden dokunun/);
  });
});

describe('kullanıcı turu 6: durdurma ekranlarının sesi önce kısa (k05, k07)', () => {
  const kinds = Object.keys(SAFETY_STOP_TEXT) as (keyof typeof SAFETY_STOP_TEXT)[];
  const shorts = [
    RETEST_LONG_SPOKEN,
    ...kinds.flatMap((k) => [safetyStopSpoken(k, false), safetyStopSpoken(k, true)]),
    unwellEndSpoken('maneuver'),
    unwellEndSpoken('test')
  ];
  it('kısa biçimler normal hızda ≤ ~12 s, hekime yönlendirir ve "BPPV" demez', () => {
    for (const t of shorts) {
      expect(t.length, t).toBeLessThanOrEqual(STOP_SPOKEN_MAX_CHARS);
      expect(t).toMatch(/hekim/i);
      expect(t).not.toMatch(/BPPV/);
    }
    // Kısa biçim tam metinden kısa; tam metin "Ayrıntıyı dinle"de.
    expect(RETEST_LONG_SPOKEN.length).toBeLessThan(RETEST_LONG_TEXT.length);
    for (const k of kinds) expect(safetyStopSpoken(k, false).length).toBeLessThan(SAFETY_STOP_TEXT[k].length);
    expect(unwellEndSpoken('test').length).toBeLessThan(unwellEndText('test').length);
    // Uzun baş dönmesinde acil belirtiler seste kalır.
    for (const t of [RETEST_LONG_TEXT, LONG_IN_MANEUVER_NOTE, safetyStopSpoken('VERTIGO_TOO_LONG', false)]) {
      expect(t).toMatch(/Konuşma bozukluğu, güçsüzlük ya da çift görme olursa 112'yi arayın\.$/);
    }
  });
  it('pozisyona gelinemedi: "Durduk. … oturun. Hekiminize …"; durulan yer ve açı seste yok (k07); yanlış taraf ayrı; yakını modu', () => {
    const t = safetyStopSpoken('POSITION_UNREACHABLE', false);
    expect(t).toMatch(/^Durduk\. Zorlamayın; yavaşça oturun\. Hekiminize/);
    expect(t).not.toMatch(/Durulan yer|°/);
    expect(unreachableStopSpoken(SAFETY_STOP_TEXT.POSITION_UNREACHABLE, false)).toBe(t);
    expect(unreachableStopSpoken(SAFETY_STOP_TEXT.WRONG_SIDE, false)).toBe(safetyStopSpoken('WRONG_SIDE', false));
    expect(safetyStopSpoken('WRONG_SIDE', false)).toMatch(/sırtüstüne gelin, sonra yavaşça oturun/);
    for (const k of kinds) expect(safetyStopSpoken(k, true)).toMatch(/[Hh]asta/);
  });
  it('seste "BPPV" yerine "kristal oynaması"; ayraçlı kısaltma atılır, ek korunur', () => {
    expect(withoutBppv('Bu, kristal oynamasına (BPPV) bağlı değildir.')).toBe('Bu, kristal oynamasına bağlı değildir.');
    expect(withoutBppv("Bu, tipik arka kanal BPPV'ye uymuyor.")).toBe('Bu, tipik arka kanal kristal oynamasına uymuyor.');
    expect(withoutBppv('evde tedavi edilemeyen yatay kanal BPPV olabilir.')).toBe('evde tedavi edilemeyen yatay kanal kristal oynaması olabilir.');
    expect(withoutBppv('Yatay kanal tipi kristal oynamasının (yatay kanal BPPV) evde')).toBe('Yatay kanal tipi kristal oynamasının evde');
    expect(withoutBppv('BPPV baş dönmesi yalnızca baş hareketiyle başlar.')).toBe('Kristal oynamasında baş dönmesi yalnızca baş hareketiyle başlar.');
    expect(withoutBppv("Sürer. BPPV'nin tedavisi")).toBe('Sürer. Kristal oynamasının tedavisi');
    for (const q of RED_FLAGS) expect(withoutBppv(q.why)).not.toMatch(/BPPV/);
    for (const k of Object.keys(REFER_TEXT) as (keyof typeof REFER_TEXT)[]) expect(withoutBppv(REFER_TEXT[k])).not.toMatch(/BPPV/);
    expect(withoutBppv(SAFETY_STOP_TEXT.VERTIGO_TOO_LONG)).not.toMatch(/BPPV/);
  });
});

describe('yeniden tasarım: tek ekran güvenlik listesi', () => {
  it('her güvenlik sorusunun kısa madde metni var; "Listeyi dinle" bütün maddeleri okur ve "BPPV" demez', () => {
    for (const q of RED_FLAGS) expect(RED_FLAG_CHECK_TEXT[q.id], q.id).toBeTruthy();
    const full = redFlagsSpokenFull(RED_FLAGS);
    for (const q of RED_FLAGS) expect(full).toContain(redFlagCheckText(q).replace(/"/g, ''));
    expect(full).not.toMatch(/BPPV/);
    expect(redFlagCheckText({ id: 'yeni', label: 'yeni bir belirti' })).toBe('Yeni bir belirti');
    // Kısa açılış sesi gerçekten kısa.
    expect(RED_FLAGS_SPOKEN.length).toBeLessThanOrEqual(STOP_SPOKEN_MAX_CHARS);
  });

  it('açılış sesi maddelerin kısa adlarını sayar (~20 s); kusma uyarısı listedeki gündelik cümleyle (M1-9; y07, y01)', () => {
    const short = redFlagsSpokenShort(RED_FLAGS);
    for (const q of RED_FLAGS) expect(RED_FLAG_SHORT[q.id], q.id).toBeTruthy();
    for (const q of RED_FLAGS) expect(short).toContain(RED_FLAG_SHORT[q.id]!);
    expect(short.length).toBeLessThanOrEqual(RED_FLAGS_SHORT_MAX_CHARS);
    expect(short).toMatch(/Hiçbiri yok düğmesine dokunun\.$/);
    expect(short).not.toMatch(/BPPV/);
    const fever = RED_FLAGS.find((q) => q.id === 'fever')!;
    expect(fever.why).toMatch(/^Ateşiniz var ya da kusmaktan su bile içemiyorsunuz/);
    expect(fever.why).not.toMatch(/su bile içilemeyecek kadar/);
  });

  it('sonraki adım tek satır, saat bir kez; seste cümleler noktayla ayrılır (M1-8; y01, y02)', () => {
    expect(nextStepLine('early-retest', '05:55', true)).toBe('Tekrar testi 05:55 — uyanınca "Başım dönüyor"a basın');
    expect(nextStepLine('early-retest', '15:03', false)).toBe('Tekrar testi 15:03 — saati gelince "Başım dönüyor"a basın');
    expect(nextStepLine('morning-retest', '1 Kasım 06:00', false)).toMatch(/^Sabah testi 1 Kasım 06:00 — uyanınca/);
    const { short } = choiceSpeechParts({ title: 'Testte baş dönmesi başlamadı', spokenLead: 'Test baş dönmesi yapmadı' }, [{ label: 'Durdur' }]);
    expect(short).toBe('Testte baş dönmesi başlamadı. Test baş dönmesi yapmadı. Birinci: Durdur.');
    expect(endSentence('Bitti?')).toBe('Bitti?');
  });

  it('yarıda kalan manevra sorusu adımı ve tarafı söyler; yeni belirtiden sonra manevra önerilmez metni; şiddet sorusu (M1-7, M1-5, M1-11)', () => {
    expect(resumeAskText(3, 'L').title).toBe('Manevra 3. adımda yarıda kaldı');
    expect(resumeAskText(3, 'L').text).toMatch(/^Sol taraf manevrasını baştan yapalım mı\?/);
    expect(NEURO_START_TITLE).toBe('Yeni belirti bildirdiniz: manevra önerilmiyor');
    expect(NEURO_START_TEXT).toMatch(/Önce 112'yi arayın ya da hekime başvurun/);
    expect(vasText('before').spoken).toMatch(/Sıfır yok, on en kötü/);
  });

  it('her maddenin simgesi var (L2-6); işaretleme sesi maddeyi ve düğmenin değiştiğini söyler (y02)', () => {
    for (const q of RED_FLAGS) expect(RED_FLAG_ICON[q.id], q.id).toBeTruthy();
    expect(redFlagIcon({ id: 'yeni' })).toBe('⚠️');
    expect(redFlagToggleSpoken('Çift görme', true, 1)).toBe('İşaretlendi: Çift görme. Alttaki düğme şimdi: İşaretlediklerimle devam.');
    expect(redFlagToggleSpoken('Kulak', true, 2)).toBe('İşaretlendi: Kulak.');
    expect(redFlagToggleSpoken('Kulak', false, 1)).toBe('İşaret kaldırıldı: Kulak.');
    expect(redFlagToggleSpoken('Kulak', false, 0)).toBe('İşaret kaldırıldı: Kulak. Alttaki düğme yine: Hiçbiri yok.');
    expect(redFlagToggleSpoken(RED_FLAG_CHECK_TEXT.same!, true, 1)).not.toMatch(/BPPV|"/);
  });

  it('gündelik dil (L2-6; y03): anlaşılmayan sözcükler madde metinlerinde yok', () => {
    const all = Object.values(RED_FLAG_CHECK_TEXT).join(' ');
    for (const w of ['Kıpırdamadan', 'kıpırdamadan', 'yutma bozukluğu', 'Kan sulandırıcı', 'kendiliğinden', 'akıntı', 'travması', 'göz kararması']) expect(all).not.toContain(w);
  });

  it('kırmızı bayrak aşma geri sayımı, manevra sonrası yeni belirti ekranı (L2-1, L2-2)', () => {
    expect(overrideCountdownLabel('Yine de devam et', 3)).toBe('Yine de devam et (3)');
    expect(overrideCountdownLabel('Yine de devam et', 0)).toBe('Yine de devam et');
    expect(NEURO_END_TEXT).toMatch(/112/);
    expect(NEURO_END_TEXT).not.toMatch(/normal|beklenen|tekrar testi/i);
    expect(NEURO_END_SPOKEN).toMatch(/112/);
    expect(EMERGENCY_REMINDER_SPOKEN.length).toBeLessThanOrEqual(STOP_SPOKEN_MAX_CHARS);
  });

  it('işaret listesinden yanıt kaydı: işaretli = durduran yanıt, diğerleri güvenli yanıt', () => {
    const a = redFlagAnswers(RED_FLAGS, ['neuro', 'same']);
    expect(a.neuro).toBe('yes');
    expect(a.same).toBe('yes');
    expect(a.continuous).toBe('no');
    expect(Object.keys(a)).toHaveLength(RED_FLAGS.length);
  });

  it('kırmızı bayrak uyarısının sesi kısa; acilde 112, hekimde kısa neden', () => {
    const neuro = RED_FLAGS.find((q) => q.id === 'neuro')!;
    const ear = RED_FLAGS.find((q) => q.id === 'ear')!;
    const em = redFlagWarnSpoken('emergency', [neuro]);
    expect(em).toMatch(/112/);
    expect(em.length).toBeLessThanOrEqual(STOP_SPOKEN_MAX_CHARS);
    expect(redFlagWarnSpoken('doctor', [ear])).toMatch(/KBB/);
    expect(redFlagWarnSpoken('emergency', [], 'Yeni belirti.')).toMatch(/Yeni belirti\. Hemen 112/);
    for (const q of RED_FLAGS) expect(redFlagWarnSpoken(q.action, [q])).not.toMatch(/BPPV/);
  });
});

describe('yeniden tasarım: uyarı ekranları kilitlemez', () => {
  const base = { canal: 'PC' as const, reason: 'Gerekçe.' };
  const values = (d: Parameters<typeof decisionScreen>[0]) => decisionScreen(d).options.map((o) => o.value);
  const ids = (d: Parameters<typeof decisionScreen>[0]) => decisionScreen(d).options.map((o) => o.testid);

  it('her karar ekranında ilk seçenek devam (manevra), sonuncusu Durdur; "yalnız geri dön" yok', () => {
    const all = [
      { ...base, side: 'R' as const, warn: 'ATYPICAL_LONG' as const },
      { ...base, side: 'L' as const, warn: 'BOTH_SIDES' as const },
      { ...base, side: 'R' as const, both: true, warn: 'BOTH_SIDES' as const },
      { ...base, side: 'R' as const, doctorSide: 'L' as const, warn: 'SIDE_CONFLICT' as const },
      { ...base, side: 'R' as const, warn: 'NOT_TRIGGERED' as const },
      { ...base, side: null, warn: 'NOT_TRIGGERED' as const },
      { ...base, canal: 'HC' as const, side: null, warn: 'BOTH_SIDES' as const },
      { ...base, side: 'R' as const, warn: null }
    ];
    for (const d of all) {
      const v = values(d);
      expect(v[0] === 'go:R' || v[0] === 'go:L' || v[0] === 'both', JSON.stringify(d)).toBe(true);
      expect(v[v.length - 1]).toBe('end');
    }
  });

  it('taraf çelişkisi: "Test tarafına devam" / "Hekimin dediği tarafa devam"', () => {
    const d = { ...base, side: 'R' as const, doctorSide: 'L' as const, warn: 'SIDE_CONFLICT' as const };
    const sc = decisionScreen(d);
    expect(ids(d)).toEqual(['decision-test-side', 'decision-doctor-side', 'decision-stop']);
    expect(sc.options[0]!.label).toBe('Test tarafına devam (sağ)');
    expect(sc.options[1]!.label).toBe('Hekimin dediği tarafa devam (sol)');
  });

  it('tetiklenmedi: bilinen tarafa manevra önerilen (dolu) düğme; taraf yoksa önerilen "iki tarafa sırayla"; öbür kanalın testi', () => {
    const known = decisionScreen({ ...base, side: 'L', warn: 'NOT_TRIGGERED' });
    expect(ids({ ...base, side: 'L', warn: 'NOT_TRIGGERED' })).toEqual(['decision-continue', 'decision-other', 'decision-both', 'decision-test-hc', 'decision-stop']);
    expect(known.options[0]).toMatchObject({ label: 'Sol tarafa manevra yap', primary: true });
    expect(known.options.filter((o) => o.primary)).toHaveLength(1);
    // y01: hangi yan bilinmiyorsa tek büyük önerilen düğme "iki tarafa sırayla"; ses önce bunu söyler.
    const unknown = decisionScreen({ ...base, side: null, warn: 'NOT_TRIGGERED' });
    expect(ids({ ...base, side: null, warn: 'NOT_TRIGGERED' })).toEqual(['decision-both', 'decision-R', 'decision-L', 'decision-test-hc', 'decision-stop']);
    expect(unknown.options[0]).toMatchObject({ value: 'both', primary: true, label: 'Hangi yan bilmiyorum: iki tarafa sırayla manevra' });
    expect(unknown.options.filter((o) => o.primary)).toHaveLength(1);
    // M1-3 (y01): ilk ses "Önerim: …"; seçenekler tek tek okunmaz, diğerleri katlı (M1-6).
    expect(unknown.spoken).toMatch(/^Önerim: iki tarafa sırayla manevra\. Test baş dönmesi yapmadı; kristal oynaması olmayabilir\. Büyük düğmeye/);
    expect(unknown.fold).toBe(true);
    expect(known.spoken).toMatch(/^Önerim: sol tarafa manevra\./);
    // Yatay kanalda iki yöne BBQ önerilmez; öbür test arka kanal testi.
    expect(values({ ...base, canal: 'HC', side: null, warn: 'NOT_TRIGGERED' })).toEqual(['go:R', 'go:L', 'test:PC', 'end']);
  });

  it('tetiklenmedi (L2-7; y05): "kristal oynamasından olmayabilir" ve sürekli baş dönmesinde hekim/112 tek cümle; seste de', () => {
    expect(NOT_TRIGGERED_NOTE).toMatch(/^Test baş dönmesi yapmadı; baş dönmeniz kristal oynamasından olmayabilir\./);
    expect(NOT_TRIGGERED_NOTE).toMatch(/sürekliyse ya da yürüyemiyorsanız hekime/);
    expect(NOT_TRIGGERED_NOTE).toMatch(/112/);
    for (const side of ['R', null] as const) {
      const sc = decisionScreen({ ...base, side, warn: 'NOT_TRIGGERED' });
      expect(sc.lead.startsWith(NOT_TRIGGERED_NOTE)).toBe(true);
      expect(sc.lead).not.toMatch(/Kristaller yerine oturmuş/);
      expect(sc.spokenLead).toMatch(/kristal oynaması olmayabilir/);
    }
  });

  it('önerilen yol işareti: temiz kararda "Öneriyle devam", iki tarafta "Devam et"; atipik süre ve taraf çelişkisinde önerilen yok', () => {
    const primaryOf = (d: Parameters<typeof decisionScreen>[0]) => decisionScreen(d).options.filter((o) => o.primary).map((o) => o.testid);
    expect(primaryOf({ ...base, side: 'R', warn: null })).toEqual(['decision-continue']);
    expect(primaryOf({ ...base, side: 'R', both: true, warn: 'BOTH_SIDES' })).toEqual(['decision-continue']);
    expect(primaryOf({ ...base, side: 'L', warn: 'BOTH_SIDES' })).toEqual(['decision-continue']);
    expect(primaryOf({ ...base, side: 'R', warn: 'ATYPICAL_LONG' })).toEqual([]);
    expect(primaryOf({ ...base, side: 'R', doctorSide: 'L', warn: 'SIDE_CONFLICT' })).toEqual([]);
  });

  it('atipik süre: "Yine de devam et" uygulamanın tarafına; ekranda 112 bilgisi', () => {
    const sc = decisionScreen({ ...base, side: 'R', warn: 'ATYPICAL_LONG' });
    expect(sc.options[0]).toMatchObject({ value: 'go:R', testid: 'decision-continue', label: 'Yine de devam et: sağ taraf manevrası' });
    expect(sc.lead).toMatch(/112/);
  });

  it('yatay kanal geçişi varsayımı söyler; arka kanalda eski tanı uyarısı geçişte okunur', () => {
    expect(chainGateText({ canal: 'HC', side: 'L' }).text).toMatch(/Yatay kanal, sol taraf kabul ediyoruz; en sık biçim/);
    expect(chainGateText({ canal: 'PC', side: 'R' }, 'Hekiminiz sol demişti.').text).toMatch(/^Hekiminiz sol demişti\. Şimdi sağ taraf/);
    expect(nextSideGateText('L').text).toMatch(/sol taraf için manevrayı/);
  });

  it('erken tekrar ve kontrendikasyon uyarıları devam etmeyi söyler', () => {
    expect(planWarn('early-retest', false, '15:03').text).toMatch(/15:03.*yine de yapabilirsiniz/);
    expect(planWarn('early-retest', true, null).retestReady).toBe(true);
    expect(planWarn('resolved-suggest', false, null).title).toBe('Düzelmiş görünüyor');
    expect(contraWarnText(['Boyun sorunu'])).toMatch(/Boyun sorunu.*Devam ederseniz/);
  });

  it('yatay kanal hazırlığı: yastık başın altında; iki yana ve yüzüstü dönecek yer', () => {
    const items = prepItems({ helper: false, semontOnly: false, semontAfterTests: false, hc: true });
    expect(items[0]).toMatch(/başınızın altına/);
    expect(items[0]).toMatch(/yüzüstü/);
    expect(prepSpokenShort({ helper: true, semontOnly: false, semontAfterTests: false, hc: true })).toMatch(/Hastayı yatağın ortasına/);
  });
});

describe('yeni kullanıcı turu 1, L5: kötü an sonrası metinler', () => {
  it('kusma uyarısı kusmayı söyler (doz/sayı değil); sabah saati verilen saattir; ana ekran metni "manevra yok, sabah test" (L5-1)', () => {
    const t = vomitWarnText('2 Kasım 06:00');
    expect(VOMIT_WARN_TITLE).toMatch(/kusma/);
    expect(t).toMatch(/Kusmadan sonra aynı gün manevra önerilmez/);
    expect(t).toContain('2 Kasım 06:00');
    expect(t).not.toMatch(/manevra sayısı|sınır/);
    expect(vomitWarnSpoken('2 Kasım 06:00', true)).toMatch(/^Telefonu alnınızdan alın.*kusma/);
    expect(HOME_VOMIT_TEXT).toMatch(/kusma bildirdiniz: bugün manevra yok.*Sabah kısa bir test/);
    expect(HOME_VOMIT_TEXT).not.toMatch(/baş dönmesi gelmedi/);
  });
  it('"Geçti mi?" sorusu kötü anın türüne göre; uzun baş dönmesinden sonra "Yeniden dene" uyarısı (L5-2)', () => {
    expect(feelCheckTitle('unwell')).toBe('Kusma ya da kötü hissetme geçti mi?');
    expect(feelCheckTitle('vertigoLong')).toMatch(/baş dönmesi geçti mi/);
    expect(feelCheckLead('unwell', 'maneuver')).toMatch(/^Son manevra, siz kötü hissettiğiniz için/);
    expect(feelCheckLead('unwell', 'side')).toMatch(/^Son test/);
    expect(feelCheckSpoken('unwell')).toMatch(/büyük düğmeye/);
    expect(RETRY_AFTER_LONG_NOTE).toMatch(/tamamen geçmesini bekleyin/);
  });
  it('kaldığınız yerden ve tek taraf notları (L5-3, L5-7)', () => {
    expect(resumeSideNote('L', 'R')).toBe('Kaldığınız yerden: sol taraf testi yapılmıştı; sağ taraf testiyle sürüyoruz.');
    expect(resumeManeuverNote('R')).toMatch(/yarıda kalan sağ taraf manevrasını baştan/);
    expect(singleSideNote('R')).toMatch(/sağ tarafı test/);
  });
  it('güvenlik listesinde kusma maddesi gündelik dille (L5-4)', () => {
    expect(RED_FLAG_CHECK_TEXT.fever).toBe('Ateşim var ya da kusmaktan su bile içemiyorum');
    expect(FOREHEAD_TAP_SPOKEN).toMatch(/ekranın herhangi bir yerine dokunun/);
  });
  it('tek taraf testi tetiklemediyse karar ekranında "öbür tarafı da test et"; iki taraflı testte yok (L5-7)', () => {
    const d = { canal: 'PC' as const, side: 'R' as const, warn: 'NOT_TRIGGERED' as const, reason: 'Testte baş dönmesi başlamadı; bilinen taraf sağ.' };
    const one = decisionScreen(d, { otherSide: 'L' });
    // Yeni kullanıcı turu 2 (M1-2; y02): önerilen tek büyük düğme öbür tarafın testi; bilinen tarafa manevra ikincil.
    expect(one.options[0]).toMatchObject({ value: 'test:other', primary: true, label: 'Sol tarafı da test et', testid: 'decision-test-other' });
    expect(one.options.filter((o) => o.primary)).toHaveLength(1);
    expect(one.options.find((o) => o.value === 'go:R')).toMatchObject({ label: 'Yine de sağ tarafa manevra yap', testid: 'decision-continue' });
    expect(one.options.find((o) => o.value === 'go:R')!.primary).toBeFalsy();
    expect(one.spoken).toMatch(/^Önerim: sol tarafı da test etmek\./);
    expect(one.fold).toBe(true);
    expect(decisionScreen(d).options.find((o) => o.value === 'test:other')).toBeUndefined();
    // Karar kendisi öbür tarafın testini taşıyorsa (patientDecision testOther) seçenek de gelir.
    expect(decisionScreen({ ...d, testOther: 'L' }).options[0]).toMatchObject({ value: 'test:other', primary: true });
  });
});
