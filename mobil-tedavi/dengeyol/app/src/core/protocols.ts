/**
 * Manevra ve test protokolleri.
 *
 * Bütün protokoller SAĞ taraf için yazılır; sol taraf `resolveProtocol` ile aynalanır (θ → −θ, metinde sağ↔sol).
 * Açı tanımları için bkz. geometry.ts. Kaynaklar ve gerekçeler: ../../docs/KLINIK-PROTOKOL.md
 *
 * Metin belirteçleri:
 *   {A}   etkilenen taraf sıfatı  (sağ / sol)
 *   {Aya} etkilenen tarafa yön    (sağa / sola)
 *   {H}   sağlam taraf sıfatı     (sol / sağ)
 *   {Hya} sağlam tarafa yön       (sola / sağa)
 *   {Aına} hastanın etkilenen yanına (sağına / soluna) — yardımcı metinleri
 *   {Hına} hastanın sağlam yanına    (soluna / sağına)
 */
import { wrapDeg } from './geometry';

export type Side = 'R' | 'L';
export type Canal = 'PC' | 'HC' | 'AC';
export type ProtocolId =
  | 'dix-hallpike'
  | 'supine-roll'
  | 'epley'
  | 'semont'
  | 'bbq-roll'
  | 'gufoni-geo'
  | 'gufoni-apo'
  | 'yacovino';

export type FindingKey = 'dhR' | 'dhL' | 'rollR' | 'rollL' | 'rollCenter';

export type Target =
  | {
      kind: 'sitting';
      /** Öne eğilme aralığı (+ = çene göğse). */
      psiMin: number;
      psiMax: number;
    }
  | {
      kind: 'lying';
      /** Hedef baş dönüşü (+ = sağ kulak altta). */
      theta: number;
      thetaTol: number;
      /** Ekstansiyon aralığı (+ = baş geriye sarkık). */
      phiMin: number;
      phiMax: number;
      /**
       * Bu hedefe gövdeyle dönülerek gelinir (Epley 3: sırtüstünden yüz yere). Baş hedefle aynı yanda kalıp gövde dönmemişse
       * "başınızı çevirin" yerine "bütün vücudunuzla dönün" ipucu verilir (boyun zorlanmasın).
       */
      bodyTurn?: boolean;
      /**
       * Bu yan yatış hedefine yüzüstünden geçilerek gelinir (BBQ roll 4. adım). Yoksa yan yatış hedeflerinde karşı yandaki
       * hastaya "önce sırtüstüne dönün" denir ve hedefe yüzüstü üzerinden gelinmesi kabul edilmez (bkz. evaluator `sideGuarded`).
       */
      viaProne?: boolean;
    };

export interface StepDef {
  id: string;
  title: string;
  /** Hastaya söylenen ve gösterilen yönerge (ikinci şahıs, nazik). */
  say: string;
  /** Odyolog/hekime gösterilen yönerge. */
  clinician: string;
  target: Target;
  /** Pozisyona ulaşıldıktan sonra en az bekleme (s). */
  minHoldSec: number;
  /**
   * Klinisyen modunda en az bekleme (yoksa minHoldSec). Klinikte nistagmus gözlenir; kılavuz 20–30 s ya da nistagmus
   * sönene kadar der (AAO-HNSF 2017). Hasta modu (belirti gözlenemez) değişmez.
   */
  clinicianMinHoldSec?: number;
  /** Baş dönmesi işaretlendiyse, bittikten sonra en az bu kadar daha beklenir (s). */
  afterVertigoSec: number;
  /** Hasta modunda bu süreyi aşan baş dönmesi güvenlik durdurmasına yol açar (s). null = sınır yok. */
  maxVertigoSec: number | null;
  /** Bu adımda nistagmus/baş dönmesi gözlenir mi (test adımı ya da manevra sırasında kayıt). */
  observe: boolean;
  /** Bu adımın sonucu hangi bulgu alanına yazılır (yalnızca test protokolleri). */
  finding?: FindingKey;
  /** Bu adıma geçiş hızlı olmalı (Semont). Saniye cinsinden hedef üst sınır. */
  fastTransitionSec?: number;
  /** Sensörle doğrulanamayan kısım için not (ör. otururken başın sağa çevrilmesi). */
  unverifiable?: string;
  /**
   * Doğrulanamayan adımda pozisyon (yalnız oturuş) doğrulanınca "Tamam, böyle kalın" yerine söylenen dürüst cümle:
   * baş çevrilmesi ölçülemez, hasta "doğru yaptım" sanmasın.
   */
  reachedSay?: string;
  /** Ekranda başlığın hemen altında görünen tek satırlık eylem özeti (çevrik/uzaktan bakışta da okunsun). */
  short?: string;
  /** Yardımcı modu: başlık, sesli yönerge, özet ve doğrulama cümlesi yardımcıya ("hastanın sağı/solu"). */
  helperTitle?: string;
  helperSay?: string;
  helperShort?: string;
  helperReachedSay?: string;
}

export interface ProtocolDef {
  id: ProtocolId;
  name: string;
  shortName: string;
  kind: 'test' | 'maneuver';
  canal: Canal | 'ANY';
  /** Etkilenen tarafa göre aynalanır mı? */
  sided: boolean;
  /** Hasta modunda kullanılabilir mi; yalnızca reçeteyle mi? */
  patient: 'yes' | 'prescription' | 'no';
  summary: string;
  /** Hasta için sade dilli özet (yoksa `summary`). */
  patientSummary?: string;
  steps: StepDef[];
  sources: string[];
  cautions: string[];
  /** Klinik doğrulama durumu (bağımsız inceleme sonrası güncellenir). */
  evidenceNote: string;
}

/** Ortak sınır değerleri (gerekçe: docs/KLINIK-PROTOKOL.md). */
export const LIMITS = {
  /** Dix-Hallpike ve Epley sarkık baş: kılavuz 20–30°; ölçüm ve alın eğimi payı ile 15–40° kabul. */
  hangPhiMin: 15,
  hangPhiMax: 40,
  /** Başın kritik dönüşü için tolerans (Sci Rep 2023 IMU güdümlü hata ~7–9°; <15° sapma sonucu değiştirmedi). */
  thetaTol: 10,
  /** Yüz yere 45° adımı en zor adım: tolerans biraz daha geniş. */
  thetaTolFaceDown: 15,
  /** Hasta modunda tek pozisyonda kesintisiz baş dönmesi üst sınırı (atipik → dur, hekime). */
  maxVertigoSec: 120
} as const;

const sit = (psiMin: number, psiMax: number): Target => ({ kind: 'sitting', psiMin, psiMax });
const lie = (
  theta: number,
  thetaTol: number,
  phiMin: number,
  phiMax: number,
  bodyTurn?: boolean,
  viaProne?: boolean
): Target => ({
  kind: 'lying',
  theta,
  thetaTol,
  phiMin,
  phiMax,
  ...(bodyTurn ? { bodyTurn } : {}),
  ...(viaProne ? { viaProne } : {})
});

const SIT_NEUTRAL = sit(-25, 35);

// ---------------------------------------------------------------------------------------------
// TESTLER
// ---------------------------------------------------------------------------------------------

const DIX_HALLPIKE: ProtocolDef = {
  id: 'dix-hallpike',
  name: 'Dix-Hallpike testi',
  shortName: 'Dix-Hallpike',
  kind: 'test',
  canal: 'PC',
  sided: true,
  patient: 'yes',
  summary:
    'Arka kanal BPPV için tanı testi. Baş 45° test tarafına çevrili ve 20–30° sarkıkken sırtüstü yatılır; baş dönmesi/nistagmus gözlenir.',
  patientSummary:
    'Kısa bir test: başınızı bir yana çevirip hızla sırtüstü yatacaksınız, baş yastıktan biraz geriye sarkacak. Baş dönmesi olup olmadığına bakıyoruz. Yaklaşık 2 dakika.',
  steps: [
    {
      id: 'dh-sit',
      title: 'Oturuş, baş {Aya} 45°',
      say: 'Oturun ve başınızı {Aya} çevirin: çeneniz {A} omzunuza doğru yarıya kadar gelsin.',
      clinician: 'Hasta yatakta oturur; yastık yatınca omuzların altına gelecek yerde. Baş {Aya} 45° çevrilir.',
      target: SIT_NEUTRAL,
      // Baş çevirme ölçülemez: yönergeden sonra çevirmeye zaman tanınır (k01, k02; tur 1).
      minHoldSec: 7,
      clinicianMinHoldSec: 4,
      afterVertigoSec: 0,
      maxVertigoSec: null,
      observe: false,
      unverifiable: 'Otururken başın {Aya} 45° çevrilmesi sensörle doğrulanamaz; bir sonraki adımda yatınca doğrulanır.',
      reachedSay: 'Başınızı {Aya} çevirdiyseniz öyle kalın; birazdan yatacağız.',
      short: 'Oturun; baş {Aya} 45° çevrili.',
      helperTitle: 'Oturuş, baş hastanın {Aına} 45°',
      helperSay:
        'Hasta yatakta otursun; yastık, yatınca omuzlarının altına gelecek yerde olsun. Başını iki elinizle tutup hastanın {Aına} çevirin: çenesi {A} omzuna doğru yarıya kadar gelsin.',
      helperShort: 'Hasta oturuyor; baş hastanın {Aına} 45°.',
      helperReachedSay: 'Başı hastanın {Aına} çevirdiyseniz öyle tutun; birazdan yatıracağız.'
    },
    {
      id: 'dh-lie',
      title: 'Sırtüstü, baş {Aya} 45° ve sarkık',
      say: 'Başınız {Aya} dönük kalsın; hızla sırtüstü yatın. Başınız yastıktan geriye hafifçe sarksın. Baş dönmesi başlarsa ekrana dokunun, geçince yeniden dokunun.',
      clinician:
        'Baş {Aya} 45° çevrili kalarak hasta hızla sırtüstü yatırılır; baş yatak düzleminin 20–30° altına sarkar. Nistagmusu gözleyin; başlangıç ve bitişi işaretleyin.',
      target: lie(45, LIMITS.thetaTol, LIMITS.hangPhiMin, LIMITS.hangPhiMax),
      // Gecikme nadiren 1 dakikaya uzayabilir (AAO-HNSF 2017) → gözlem penceresi 60 s.
      minHoldSec: 60,
      afterVertigoSec: 10,
      maxVertigoSec: LIMITS.maxVertigoSec,
      observe: true,
      finding: 'dhR',
      short: 'Hızla sırtüstü yatın; baş {Aya} dönük, geriye sarkık.',
      helperTitle: 'Sırtüstü, baş hastanın {Aına} 45° ve sarkık',
      helperSay:
        'Baş hastanın {Aına} dönük kalsın; hastayı hızla sırtüstü yatırın. Baş yastıktan geriye hafifçe sarksın. Hasta "dönüyor" derse ekrana siz dokunun; geçince yeniden dokunun.',
      helperShort: 'Hızla sırtüstü yatırın; baş hastanın {Aına} dönük, geriye sarkık.'
    },
    {
      id: 'dh-up',
      title: 'Oturuş',
      say: 'Yavaşça doğrulup oturun ve başınızı düz tutun. Yaklaşık 20 saniye böyle kalın.',
      clinician: 'Hasta yavaşça oturtulur; geri dönüş (ters yönlü) nistagmusu gözlenebilir.',
      target: sit(-20, 35),
      minHoldSec: 20,
      afterVertigoSec: 5,
      maxVertigoSec: null,
      observe: true,
      short: 'Yavaşça oturun; baş düz.',
      helperTitle: 'Oturuş',
      helperSay: 'Hastayı yavaşça doğrultup oturtun; başı düz dursun. Yaklaşık 20 saniye böyle kalsın.',
      helperShort: 'Yavaşça oturtun; baş düz.'
    }
  ],
  sources: [
    'Dix MR, Hallpike CS. Proc R Soc Med 1952;45:341–354.',
    'Bhattacharyya N ve ark. Clinical Practice Guideline: BPPV (Update). Otolaryngol Head Neck Surg 2017;156(3_suppl):S1–S47.',
    'von Brevern M ve ark. BPPV: Diagnostic criteria (Bárány Society ICVD). J Vestib Res 2015;25:105–117.'
  ],
  cautions: [
    'Boyun hareket kısıtlılığı ya da boyun hastalığı varsa test hekim gözetiminde ve değiştirilmiş biçimde (yan yatış testi) yapılmalıdır.'
  ],
  evidenceNote: 'Kılavuz tanımı.'
};

const SUPINE_ROLL: ProtocolDef = {
  id: 'supine-roll',
  name: 'Sırtüstü baş çevirme (supine roll) testi',
  shortName: 'Supine roll',
  kind: 'test',
  canal: 'HC',
  sided: false,
  patient: 'no',
  summary:
    'Yatay kanal BPPV için tanı testi. Sırtüstü, baş ~30° fleksiyonda; baş hızla sağa ve sola 90° çevrilir; yatay nistagmusun yönü (geotropik/apogeotropik) ve şiddeti karşılaştırılır.',
  steps: [
    {
      id: 'roll-center',
      title: 'Sırtüstü, baş hafif öne eğik',
      say: 'Sırtüstü yatın, başınızın altında yastık olsun; başınız hafifçe öne eğik dursun.',
      clinician: 'Hasta sırtüstü; baş ~30° fleksiyonda (yastıkla). Spontan nistagmus var mı bakın.',
      target: lie(0, 15, -42, -10),
      minHoldSec: 10,
      afterVertigoSec: 0,
      maxVertigoSec: null,
      observe: true,
      finding: 'rollCenter'
    },
    {
      id: 'roll-right',
      title: 'Baş sağa 90°',
      say: 'Başınızı hızla sağa doğru çevirin; sağ kulağınız yastığa değsin.',
      clinician: 'Başı hızla sağa 90° çevirin. Yatay nistagmusun yönünü (yere doğru = geotropik, tavana = apogeotropik), şiddetini ve süresini kaydedin.',
      target: lie(90, 15, -42, 15),
      minHoldSec: 45,
      afterVertigoSec: 10,
      maxVertigoSec: null,
      observe: true,
      finding: 'rollR'
    },
    {
      id: 'roll-back1',
      title: 'Baş ortada',
      say: 'Başınızı yavaşça ortaya getirin ve baş dönmesi geçene kadar bekleyin.',
      clinician: 'Başı ortaya getirin; nistagmus ve baş dönmesi tamamen sönene kadar bekleyin.',
      target: lie(0, 15, -42, 10),
      minHoldSec: 30,
      afterVertigoSec: 10,
      maxVertigoSec: null,
      observe: false
    },
    {
      id: 'roll-left',
      title: 'Baş sola 90°',
      say: 'Başınızı hızla sola doğru çevirin; sol kulağınız yastığa değsin.',
      clinician: 'Başı hızla sola 90° çevirin. Nistagmusun yönünü, şiddetini ve süresini kaydedin.',
      target: lie(-90, 15, -42, 15),
      minHoldSec: 45,
      afterVertigoSec: 10,
      maxVertigoSec: null,
      observe: true,
      finding: 'rollL'
    },
    {
      id: 'roll-back2',
      title: 'Baş ortada',
      say: 'Başınızı yavaşça ortaya getirin.',
      clinician: 'Başı ortaya getirin.',
      target: lie(0, 15, -42, 10),
      minHoldSec: 10,
      afterVertigoSec: 5,
      maxVertigoSec: null,
      observe: false
    }
  ],
  sources: [
    'Bhattacharyya N ve ark. Otolaryngol Head Neck Surg 2017 (supine roll test).',
    'von Brevern M ve ark. J Vestib Res 2015 (yatay kanal tanı ölçütleri).'
  ],
  cautions: ['Yalnızca klinisyen tarafından yapılır.'],
  evidenceNote: 'Kılavuz tanımı.'
};

// ---------------------------------------------------------------------------------------------
// MANEVRALAR
// ---------------------------------------------------------------------------------------------

const EPLEY: ProtocolDef = {
  id: 'epley',
  name: 'Epley manevrası (kanalit repozisyon)',
  shortName: 'Epley',
  kind: 'maneuver',
  canal: 'PC',
  sided: true,
  patient: 'yes',
  summary:
    'Arka kanal BPPV tedavisi. Dix-Hallpike pozisyonundan başlayarak baş 90° karşı tarafa, ardından gövdeyle birlikte yüz yere 45° bakacak şekilde döndürülür ve oturulur.',
  patientSummary:
    'Kulaktaki kristalleri yerine götüren 5 adımlı hareket: başınızı çevirip sırtüstü yatma, başı öbür yana çevirme, yan dönüp yere bakma ve oturma. Her adımda yaklaşık 1 dakika kalacaksınız; toplam 5 dakika.',
  steps: [
    {
      id: 'ep-sit',
      title: 'Oturuş, baş {Aya} 45°',
      say: 'Oturun ve başınızı {Aya} çevirin: çeneniz {A} omzunuza doğru yarıya kadar gelsin.',
      clinician: 'Hasta yatakta oturur; yastık yatınca omuzların altına gelecek yerde. Baş {Aya} (etkilenen taraf) 45° çevrilir.',
      target: SIT_NEUTRAL,
      minHoldSec: 7,
      clinicianMinHoldSec: 5,
      afterVertigoSec: 0,
      maxVertigoSec: null,
      observe: false,
      unverifiable: 'Otururken başın {Aya} 45° çevrilmesi sensörle doğrulanamaz; bir sonraki adımda yatınca doğrulanır.',
      reachedSay: 'Başınızı {Aya} çevirdiyseniz öyle kalın; birazdan yatacağız.',
      short: 'Oturun; baş {Aya} 45° çevrili.',
      helperTitle: 'Oturuş, baş hastanın {Aına} 45°',
      helperSay:
        'Hasta yatakta otursun; yastık, yatınca omuzlarının altına gelecek yerde olsun. Başını iki elinizle tutup hastanın {Aına} çevirin: çenesi {A} omzuna doğru yarıya kadar gelsin.',
      helperShort: 'Hasta oturuyor; baş hastanın {Aına} 45°.',
      helperReachedSay: 'Başı hastanın {Aına} çevirdiyseniz öyle tutun; birazdan yatıracağız.'
    },
    {
      id: 'ep-1',
      title: 'Sırtüstü, baş {Aya} 45° ve sarkık',
      // Önce kısa eylem cümlesi, ayrıntı sonra; ~11 s (k05, k04; tur 2). Ayrıntı ekranda ve kısa satırda.
      say: 'Başınız {Aya} dönük kalsın; hızla sırtüstü yatın. Başınız yastıktan geriye hafifçe sarksın. Baş dönmesi olabilir; başlarsa ekrana dokunun.',
      clinician: 'Baş {Aya} 45° çevrili kalarak hasta hızla sırtüstü yatırılır; baş yatak düzleminin 20–30° altına sarkar.',
      target: lie(45, LIMITS.thetaTol, LIMITS.hangPhiMin, LIMITS.hangPhiMax),
      minHoldSec: 45,
      clinicianMinHoldSec: 30,
      afterVertigoSec: 30,
      maxVertigoSec: LIMITS.maxVertigoSec,
      observe: true,
      short: 'Hızla sırtüstü yatın; baş {Aya} dönük, geriye sarkık.',
      helperTitle: 'Sırtüstü, baş hastanın {Aına} 45° ve sarkık',
      helperSay:
        'Baş hastanın {Aına} dönük kalsın; hastayı hızla sırtüstü yatırın. Baş yastıktan geriye hafifçe sarksın. Baş dönmesi olabilir; hasta "dönüyor" derse ekrana siz dokunun.',
      helperShort: 'Hızla sırtüstü yatırın; baş hastanın {Aına} dönük, geriye sarkık.'
    },
    {
      id: 'ep-2',
      title: 'Sırtüstü, baş {Hya} 45°',
      say: 'Başınızı kaldırmadan yavaşça {Hya} çevirin. Başınız {H} tarafa yarıya kadar dönük ve geriye hafifçe sarkık kalsın.',
      clinician: 'Ekstansiyon korunarak baş {Hya} 90° çevrilir; baş {H} tarafa 45° bakar.',
      target: lie(-45, LIMITS.thetaTol, LIMITS.hangPhiMin, LIMITS.hangPhiMax),
      minHoldSec: 45,
      clinicianMinHoldSec: 30,
      afterVertigoSec: 30,
      maxVertigoSec: LIMITS.maxVertigoSec,
      observe: true,
      short: 'Baş sarkık kalsın; yavaşça {Hya} 45° çevirin.',
      helperTitle: 'Sırtüstü, baş hastanın {Hına} 45°',
      helperSay:
        'Başı kaldırmadan yavaşça hastanın {Hına} doğru çevirin. Baş hastanın {H} tarafına yarıya kadar dönük ve geriye hafifçe sarkık kalsın.',
      helperShort: 'Baş sarkık kalsın; yavaşça hastanın {Hına} 45° çevirin.'
    },
    {
      id: 'ep-3',
      title: '{H} yan, burun yere',
      say: 'Bütün vücudunuzla {H} yanınıza dönün. Başınızı da biraz daha çevirin; burnunuz yarıya kadar yere baksın.',
      clinician: 'Hasta {H} yanına döner; baş gövdeyle birlikte dönerek yüz yere 45° bakar (başlangıca göre toplam 180°).',
      target: lie(-135, LIMITS.thetaTolFaceDown, -25, 30, true),
      minHoldSec: 45,
      clinicianMinHoldSec: 30,
      afterVertigoSec: 30,
      maxVertigoSec: LIMITS.maxVertigoSec,
      observe: true,
      short: 'Bütün vücutla {H} yanınıza dönün; burun yere.',
      helperTitle: 'Hastanın {H} yanı, burun yere',
      helperSay:
        'Hastayı bütün vücuduyla {H} yanına çevirin; başı da biraz daha dönsün, burnu yarıya kadar yere baksın. Bu adımda ekranı göremezsiniz; sesi dinleyin.',
      helperShort: 'Hastayı bütün vücuduyla {H} yanına çevirin; burun yere. Ekranı göremezsiniz, sesi dinleyin.'
    },
    {
      id: 'ep-4',
      title: 'Oturuş, çene hafif aşağı',
      say: 'Yavaşça {H} tarafınızdan doğrulup yatağın kenarına oturun. Çenenizi hafifçe göğsünüze doğru eğin. Acele etmeyin.',
      clinician: 'Hasta {H} taraftan yavaşça oturtulur; çene hafif fleksiyonda.',
      target: sit(5, 45),
      minHoldSec: 60,
      clinicianMinHoldSec: 30,
      afterVertigoSec: 15,
      maxVertigoSec: null,
      observe: false,
      short: 'Yavaşça oturun; çene hafif aşağı.',
      helperTitle: 'Oturuş, çene hafif aşağı',
      helperSay: 'Hastayı {H} tarafından yavaşça doğrultup yatağın kenarına oturtun. Çenesi hafifçe göğsüne doğru eğik olsun. Acele etmeyin.',
      helperShort: 'Yavaşça oturtun; çene hafif aşağı.'
    }
  ],
  sources: [
    'Epley JM. The canalith repositioning procedure. Otolaryngol Head Neck Surg 1992;107:399–404.',
    'Bhattacharyya N ve ark. Otolaryngol Head Neck Surg 2017 (CRP tanımı).',
    'Hilton MP, Pinder DK. Cochrane Database Syst Rev 2014;CD003162.',
    'Radtke A ve ark. Neurology 2004;63:150–152 (ev Epley).',
    'Kim HJ ve ark. JAMA Neurol 2023;80:244–250 (kendi kendine manevra RKÇ).'
  ],
  cautions: [
    'Boyun hastalığı, yakın boyun cerrahisi/travması, ciddi karotis darlığı, kararsız kalp hastalığı olanlarda hekim kararı gerekir.'
  ],
  evidenceNote: 'Kılavuz ve RKÇ kanıtı güçlü.'
};

const SEMONT: ProtocolDef = {
  id: 'semont',
  name: 'Semont (serbestleştirici) manevrası',
  shortName: 'Semont',
  kind: 'maneuver',
  canal: 'PC',
  sided: true,
  patient: 'prescription',
  summary:
    'Arka kanal BPPV tedavisi. Baş sağlam tarafa 45° çevrilmişken etkilenen tarafa yan yatılır, ardından tek hızlı hareketle karşı tarafa geçilir.',
  patientSummary:
    'Kristalleri yerine götüren hızlı bir hareket: başınız çevrili otururken bir yana yatacak, sonra tek hamlede öbür yana geçeceksiniz. Toplam yaklaşık 4 dakika.',
  steps: [
    {
      id: 'se-sit',
      title: 'Oturuş, baş {Hya} 45°',
      say: 'Yatağın uzun kenarının ortasına oturun; bacaklarınız aşağı sarksın, iki yanınızda yatacak yer olsun. Başınızı {Hya} yarıya kadar çevirin.',
      clinician: 'Hasta yatak kenarında, iki yana yatabilecek şekilde oturur. Baş {Hya} (sağlam taraf) 45° çevrilir.',
      target: SIT_NEUTRAL,
      minHoldSec: 7,
      clinicianMinHoldSec: 5,
      afterVertigoSec: 0,
      maxVertigoSec: null,
      observe: false,
      unverifiable: 'Otururken başın {Hya} 45° çevrilmesi sensörle doğrulanamaz; bir sonraki adımda yatınca doğrulanır.',
      reachedSay: 'Başınızı {Hya} çevirdiyseniz öyle kalın; birazdan yatacağız.',
      short: 'Yatak kenarında oturun; baş {Hya} 45° çevrili.',
      helperTitle: 'Oturuş, baş hastanın {Hına} 45°',
      helperSay:
        'Hasta yatağın uzun kenarının ortasına otursun; bacakları aşağı sarksın, iki yanında yatacak yer olsun. Başını hastanın {Hına} yarıya kadar çevirin.',
      helperShort: 'Hasta yatak kenarında; baş hastanın {Hına} 45°.',
      helperReachedSay: 'Başı hastanın {Hına} çevirdiyseniz öyle tutun; birazdan yatıracağız.'
    },
    {
      id: 'se-1',
      title: '{A} yan, burun yukarı',
      say: 'Başınızın yönü değişmesin; hızla {A} yanınıza yatın. Burnunuz yarıya kadar tavana baksın. Baş dönmesi başlarsa ekrana dokunun, geçince yeniden dokunun.',
      clinician: 'Hasta hızla {A} yanına (etkilenen taraf) yatırılır; baş sağlam tarafa 45° çevrili kalır, burun yukarı 45°.',
      target: lie(45, 12, -30, 30),
      minHoldSec: 60,
      afterVertigoSec: 30,
      maxVertigoSec: LIMITS.maxVertigoSec,
      observe: true,
      short: 'Hızla {A} yanınıza yatın; burun yukarı.',
      helperTitle: 'Hastanın {A} yanı, burun yukarı',
      helperSay:
        'Başın yönü değişmesin; hastayı hızla {A} yanına yatırın. Burnu yarıya kadar tavana baksın. Hasta "dönüyor" derse ekrana siz dokunun; geçince yeniden dokunun.',
      helperShort: 'Hızla {A} yanına yatırın; burun yukarı.'
    },
    {
      id: 'se-2',
      title: '{H} yan, burun yere (tek hızlı hareket)',
      // Hasta modunda yönergeden sonra "Üç, iki, bir, şimdi!" sayılır; geçiş o komutla yapılır (k10, tur 1). Yönerge
      // "Kıpırdamayın." ile başlar: hasta ilk sözü duyar duymaz hareket etmesin (k10, tur 2).
      say: 'Kıpırdamayın; "şimdi" dediğimde hareket edeceksiniz. O zaman tek, hızlı bir hamlede oturarak geçip {H} yanınıza yatın. Başınızın yönü değişmesin; burnunuz yarıya kadar yere baksın.',
      clinician:
        'Baş-gövde ilişkisi bozulmadan hasta tek hızlı hareketle karşı ({H}) yana geçirilir; burun yere 45° bakar.',
      target: lie(-135, LIMITS.thetaTolFaceDown, -30, 30),
      minHoldSec: 60,
      afterVertigoSec: 30,
      maxVertigoSec: LIMITS.maxVertigoSec,
      observe: true,
      fastTransitionSec: 2,
      short: '"Şimdi" deyince tek hamlede {H} yanınıza; burun yere.',
      helperTitle: 'Hastanın {H} yanı, burun yere (tek hızlı hareket)',
      helperSay:
        'Şimdilik bekleyin; "şimdi" dediğimde hareket ettireceksiniz. O zaman hastayı tek, hızlı bir hamlede oturuştan geçirip {H} yanına yatırın. Başın yönü değişmesin; burnu yarıya kadar yere baksın. Bu adımda ekranı göremezsiniz; sesi dinleyin.',
      helperShort: '"Şimdi" deyince tek hamlede hastanın {H} yanına; burun yere.'
    },
    {
      id: 'se-3',
      title: 'Oturuş',
      say: 'Yavaşça doğrulup oturun. Başınızı dik tutun ve birkaç dakika oturarak dinlenin.',
      clinician: 'Hasta yavaşça oturtulur; baş dik.',
      target: sit(-15, 35),
      minHoldSec: 60,
      afterVertigoSec: 15,
      maxVertigoSec: null,
      observe: false,
      short: 'Yavaşça oturun; baş dik.',
      helperTitle: 'Oturuş',
      helperSay: 'Hastayı yavaşça doğrultup oturtun. Başı dik dursun; birkaç dakika oturarak dinlensin.',
      helperShort: 'Yavaşça oturtun; baş dik.'
    }
  ],
  sources: [
    'Semont A ve ark. Adv Otorhinolaryngol 1988;42:290–293.',
    'Mandalà M ve ark. J Neurol 2012;259:882–885 (sham kontrollü RKÇ).',
    'Radtke A ve ark. Neurology 2004;63:150–152 (evde kendi kendine Semont, Epley\'den daha az etkili).'
  ],
  cautions: [
    'Hızlı geçiş gerektirir; yaşlı ya da hareket kısıtlılığı olan hastada yardımcı gerekir.',
    'Hasta modunda yalnızca odyolog/hekim reçetesiyle açılır.'
  ],
  evidenceNote:
    'Klinisyen uygulamasında Sınıf I kanıt (Mandalà 2012). Evde kendi kendine uygulamada Epley\'den daha az etkili (Radtke 2004: 1. hafta %58\'e karşı %95); ev reçetesinde varsayılan Epley\'dir.'
};

const BBQ_ROLL: ProtocolDef = {
  id: 'bbq-roll',
  name: 'Barbekü (Lempert) roll manevrası',
  shortName: 'BBQ roll',
  kind: 'maneuver',
  canal: 'HC',
  sided: true,
  patient: 'no',
  summary:
    'Yatay kanal (geotropik) BPPV tedavisi. Etkilenen kulak altta başlanır; sağlam tarafa doğru 90°lik adımlarla toplam 360° dönülür.',
  // Klinisyende adım başına 30 s (k08, tur 1): 7 adım × 45 s klinikte 6 dakikayı aşıyordu.
  steps: [
    {
      id: 'bbq-0',
      title: 'Sırtüstü, baş {Aya} 90°',
      say: 'Sırtüstü yatın ve başınızı {Aya} 90 derece çevirin; {A} kulağınız yastığa değsin.',
      clinician: 'Hasta sırtüstü; baş {Aya} 90° çevrili ({A} kulak altta).',
      target: lie(90, 15, -42, 20),
      minHoldSec: 45,
      clinicianMinHoldSec: 30,
      afterVertigoSec: 15,
      maxVertigoSec: null,
      observe: true
    },
    {
      id: 'bbq-1',
      title: 'Yüz tavana',
      say: 'Başınızı hızla ortaya getirin; yüzünüz tavana baksın.',
      clinician: 'Baş ortaya getirilir (yüz tavana).',
      target: lie(0, 15, -42, 20),
      minHoldSec: 45,
      clinicianMinHoldSec: 30,
      afterVertigoSec: 15,
      maxVertigoSec: null,
      observe: true
    },
    {
      id: 'bbq-2',
      title: 'Baş {Hya} 90°',
      say: 'Başınızı {Hya} 90 derece çevirin; {H} kulağınız yastığa değsin.',
      clinician: 'Baş {Hya} 90° çevrilir ({H} kulak altta).',
      target: lie(-90, 15, -42, 20),
      minHoldSec: 45,
      clinicianMinHoldSec: 30,
      afterVertigoSec: 15,
      maxVertigoSec: null,
      observe: true
    },
    {
      id: 'bbq-3',
      title: 'Yüzüstü, dirsekler üzerinde',
      say: '{H} yanınızdan dönerek yüzüstü gelin, dirseklerinizin üzerinde durun; yüzünüz yere baksın.',
      clinician: 'Hasta aynı yönde dönerek yüzüstü, dirsekler üzerinde; yüz yere.',
      target: lie(180, 20, -42, 30),
      minHoldSec: 45,
      clinicianMinHoldSec: 30,
      afterVertigoSec: 15,
      maxVertigoSec: null,
      observe: true
    },
    {
      id: 'bbq-4',
      title: '{A} yanına (sırtüstünden 270°)',
      say: 'Aynı yönde dönmeye devam ederek {A} yanınıza gelin; {A} kulağınız yastığa değsin.',
      clinician: 'Aynı yönde dönülerek {A} yan pozisyona gelinir ({A} kulak altta; toplam 270°).',
      // Yüzüstünden gelinir: yanlış taraf denetimi uygulanmaz.
      target: lie(90, 15, -42, 20, false, true),
      minHoldSec: 45,
      clinicianMinHoldSec: 30,
      afterVertigoSec: 15,
      maxVertigoSec: null,
      observe: true
    },
    {
      id: 'bbq-5',
      title: 'Sırtüstü (sırtüstünden 360°)',
      say: 'Aynı yönde dönerek sırtüstü gelin; yüzünüz tavana baksın.',
      clinician: 'Aynı yönde sırtüstüne dönülür (toplam 360°).',
      target: lie(0, 15, -42, 20),
      minHoldSec: 30,
      afterVertigoSec: 15,
      maxVertigoSec: null,
      observe: true
    },
    {
      id: 'bbq-6',
      title: 'Oturuş',
      say: 'Yavaşça oturun ve başınızı dik tutun.',
      clinician: 'Hasta yavaşça oturtulur.',
      target: sit(-15, 35),
      minHoldSec: 60,
      clinicianMinHoldSec: 30,
      afterVertigoSec: 15,
      maxVertigoSec: null,
      observe: false
    }
  ],
  sources: [
    'Lempert T, Tiel-Wilck K. Laryngoscope 1996;106:476–478.',
    'Kim JS ve ark. Neurology 2012;79(7):700–707 (geotropik yatay kanal RKÇ: BBQ, Gufoni, sham; PMID 22855868).'
  ],
  cautions: ['Yalnızca klinisyen modunda. Yüzüstü adım hastanın hareket kapasitesine göre uyarlanmalıdır.'],
  evidenceNote: 'Sınıf I kanıt (Kim 2012).'
};

const GUFONI_GEO: ProtocolDef = {
  id: 'gufoni-geo',
  name: 'Gufoni manevrası (geotropik yatay kanal)',
  shortName: 'Gufoni-geo',
  kind: 'maneuver',
  canal: 'HC',
  sided: true,
  patient: 'no',
  summary:
    'Yatay kanal geotropik (kanalolitiazis) tedavisi. Sağlam tarafa hızla yan yatılır, ardından baş 45° yere doğru çevrilir.',
  steps: [
    {
      id: 'gg-sit',
      title: 'Yatak kenarında oturuş',
      say: 'Yatağın kenarında, başınız dik ve düz olacak şekilde oturun.',
      clinician: 'Hasta yatak kenarında oturur; baş düz.',
      target: sit(-20, 30),
      minHoldSec: 5,
      afterVertigoSec: 0,
      maxVertigoSec: null,
      observe: false
    },
    {
      id: 'gg-1',
      title: '{H} yan',
      say: 'Hızla {H} yanınıza yatın; başınız gövdenizle aynı hizada, yüzünüz karşıya baksın.',
      clinician: 'Hasta hızla {H} yanına (sağlam taraf) yatırılır; baş gövdeyle aynı hizada.',
      target: lie(-90, 12, -30, 30),
      minHoldSec: 60,
      afterVertigoSec: 60,
      maxVertigoSec: null,
      observe: true
    },
    {
      id: 'gg-2',
      title: '{H} yan, baş 45° yere',
      say: 'Başınızı hızla yere doğru, yarı yola kadar, yaklaşık 45 derece çevirin; burnunuz yere doğru eğik baksın.',
      clinician: 'Baş hızla 45–60° yere doğru çevrilir (burun yere eğik).',
      target: lie(-140, 12, -30, 30),
      minHoldSec: 120,
      afterVertigoSec: 30,
      maxVertigoSec: null,
      observe: true
    },
    {
      id: 'gg-3',
      title: 'Oturuş',
      say: 'Başınız aynı yöne çevrili kalarak yavaşça oturun. Oturduktan sonra başınızı yavaşça düzeltin.',
      clinician: 'Baş sağlam omza çevrili kalarak hasta yavaşça oturtulur; oturduktan sonra baş düzeltilir.',
      target: sit(-15, 35),
      minHoldSec: 60,
      afterVertigoSec: 15,
      maxVertigoSec: null,
      observe: false
    }
  ],
  sources: [
    'Gufoni M ve ark. Acta Otorhinolaryngol Ital 1998;18:363–367.',
    'Kim JS ve ark. Neurology 2012;79(7):700–707 (geotropik yatay kanal RKÇ; PMID 22855868).',
    'Bhattacharyya N ve ark. AAO-HNSF BPPV kılavuzu 2017, Tablo 14.'
  ],
  cautions: ['Yalnızca klinisyen modunda.'],
  evidenceNote: 'Sınıf I kanıt (Kim 2012).'
};

const GUFONI_APO: ProtocolDef = {
  id: 'gufoni-apo',
  name: 'Gufoni manevrası (apogeotropik yatay kanal) — burun-yukarı (Appiani / Kim) varyantı',
  shortName: 'Gufoni-apo',
  kind: 'maneuver',
  canal: 'HC',
  sided: true,
  patient: 'no',
  summary:
    'Yatay kanal apogeotropik tedavisi, burun-yukarı varyantı (Appiani 2005; Kim 2012 RKÇ protokolü). Etkilenen tarafa hızla yan yatılır, 1 dk sonra baş 45° tavana doğru çevrilir ve ~2 dk beklenir. Kılavuzdaki burun-yere varyantı bu uygulamada yoktur.',
  steps: [
    {
      id: 'ga-sit',
      title: 'Yatak kenarında oturuş',
      say: 'Yatağın kenarında, başınız dik ve düz olacak şekilde oturun.',
      clinician: 'Hasta yatak kenarında oturur; baş düz.',
      target: sit(-20, 30),
      minHoldSec: 5,
      afterVertigoSec: 0,
      maxVertigoSec: null,
      observe: false
    },
    {
      id: 'ga-1',
      title: '{A} yan',
      say: 'Hızla {A} yanınıza yatın; başınız gövdenizle aynı hizada olsun.',
      clinician: 'Hasta hızla {A} yanına (etkilenen taraf) yatırılır; baş gövdeyle aynı hizada. Sabit süre: 1 dk.',
      target: lie(90, 12, -30, 30),
      minHoldSec: 60,
      afterVertigoSec: 0,
      maxVertigoSec: null,
      observe: true
    },
    {
      id: 'ga-2',
      title: '{A} yan, baş 45° tavana',
      say: 'Başınızı hızla tavana doğru, yarı yola kadar, yaklaşık 45 derece çevirin; burnunuz yukarı doğru eğik baksın.',
      clinician: 'Baş hızla 45° tavana doğru çevrilir (burun yukarı). Sabit süre: ~2 dk.',
      target: lie(45, 12, -30, 30),
      minHoldSec: 120,
      afterVertigoSec: 0,
      maxVertigoSec: null,
      observe: true
    },
    {
      id: 'ga-3',
      title: 'Oturuş',
      say: 'Yavaşça oturun ve başınızı dik tutun.',
      clinician: 'Hasta yavaşça oturtulur.',
      target: sit(-15, 35),
      minHoldSec: 60,
      afterVertigoSec: 15,
      maxVertigoSec: null,
      observe: false
    }
  ],
  sources: [
    'Appiani GC ve ark. Otol Neurotol 2005;26:257–260.',
    'Kim JS ve ark. Neurology 2012;78(3):159–166 (apogeotropik yatay kanal RKÇ; PMID 22170885; protokol NCT00810641).',
    'Bhattacharyya N ve ark. AAO-HNSF BPPV kılavuzu 2017, Tablo 15 (iki varyant; burun-yukarı varyantı RKÇ ile sınanmıştır).'
  ],
  cautions: [
    'Yalnızca klinisyen modunda. Anlık etkinlik tutarsızdır; apogeotropik formun geotropiğe dönüşmesi beklenebilir.'
  ],
  evidenceNote: 'RKÇ kanıtı var; manevra varyantları kaynaklar arasında farklılık gösterir.'
};

const YACOVINO: ProtocolDef = {
  id: 'yacovino',
  name: 'Yacovino (derin baş sarkıtma) manevrası',
  shortName: 'Yacovino',
  kind: 'maneuver',
  canal: 'AC',
  sided: false,
  patient: 'no',
  summary:
    'Ön kanal BPPV için taraf gerektirmeyen manevra: derin baş sarkıtma, sırtüstü çene göğse, çene göğüste oturma.',
  steps: [
    {
      id: 'ya-sit',
      title: 'Oturuş',
      say: 'Yatağın üzerinde oturun; başınız düz olsun.',
      clinician: 'Hasta oturur; yatınca başı yatak kenarından sarkabilecek şekilde konumlanır.',
      target: sit(-20, 30),
      minHoldSec: 5,
      afterVertigoSec: 0,
      maxVertigoSec: null,
      observe: false
    },
    {
      id: 'ya-1',
      title: 'Derin baş sarkıtma',
      say: 'Sırtüstü yatın; başınız tam ortada ve en az 30 derece geriye sarkık olsun.',
      clinician: 'Hasta hızla sırtüstü; baş orta hatta, yatak düzleminin en az 30° altına sarkar.',
      target: lie(0, 15, 30, 65),
      minHoldSec: 30,
      afterVertigoSec: 30,
      maxVertigoSec: null,
      observe: true
    },
    {
      id: 'ya-2',
      title: 'Sırtüstü, çene göğse',
      say: 'Sırtüstü kalarak başınızı kaldırın ve çenenizi göğsünüze doğru getirin.',
      clinician: 'Sırtüstüyken baş kaldırılarak çene göğse doğru getirilir (sensör aralığı 15–42° fleksiyon).',
      target: lie(0, 15, -42, -15),
      minHoldSec: 30,
      afterVertigoSec: 0,
      maxVertigoSec: null,
      observe: true
    },
    {
      id: 'ya-3',
      title: 'Oturuş, çene göğüste',
      say: 'Çeneniz göğsünüzde kalarak yavaşça oturun.',
      clinician: 'Çene göğüste kalarak hasta oturtulur.',
      target: sit(15, 60),
      minHoldSec: 30,
      afterVertigoSec: 15,
      maxVertigoSec: null,
      observe: false
    }
  ],
  sources: ['Yacovino DA ve ark. J Neurol 2009;256:1851–1855 (vaka serisi).'],
  cautions: [
    'Yalnızca klinisyen modunda. Kanıt düşük (vaka serisi); aşağı vuran pozisyonel nistagmusta santral nedenler dışlanmalıdır.',
    'Kanal dönüşümü (ön kanal → arka kanal) olabilir.'
  ],
  evidenceNote: 'Düşük kanıt; konsensüs yok.'
};

export const PROTOCOLS: Record<ProtocolId, ProtocolDef> = {
  'dix-hallpike': DIX_HALLPIKE,
  'supine-roll': SUPINE_ROLL,
  epley: EPLEY,
  semont: SEMONT,
  'bbq-roll': BBQ_ROLL,
  'gufoni-geo': GUFONI_GEO,
  'gufoni-apo': GUFONI_APO,
  yacovino: YACOVINO
};

export const sideName = (s: Side): string => (s === 'R' ? 'sağ' : 'sol');
export const sideDative = (s: Side): string => (s === 'R' ? 'sağa' : 'sola');
/** "hastanın sağına / soluna" kalıbı için iyelikli yönelme. */
export const sidePossDative = (s: Side): string => (s === 'R' ? 'sağına' : 'soluna');
export const otherSide = (s: Side): Side => (s === 'R' ? 'L' : 'R');

export function fillText(text: string, side: Side): string {
  const h = otherSide(side);
  return text
    .replace(/\{Aına\}/g, sidePossDative(side))
    .replace(/\{Hına\}/g, sidePossDative(h))
    .replace(/\{Aya\}/g, sideDative(side))
    .replace(/\{Hya\}/g, sideDative(h))
    .replace(/\{A\}/g, sideName(side))
    .replace(/\{H\}/g, sideName(h));
}

/** İlk harfi büyüt (Türkçe yerel ayarıyla). */
export function capitalizeTr(s: string): string {
  return s.length ? s.charAt(0).toLocaleUpperCase('tr-TR') + s.slice(1) : s;
}

export interface ResolvedProtocol extends Omit<ProtocolDef, 'steps'> {
  side: Side | null;
  steps: StepDef[];
}

const opt = (t: string | undefined, s: Side): string | undefined => (t ? fillText(t, s) : undefined);

function mirrorTarget(t: Target): Target {
  if (t.kind === 'sitting') return t;
  return { ...t, theta: wrapDeg(-t.theta) };
}

function mirrorFinding(f: FindingKey | undefined): FindingKey | undefined {
  if (f === 'dhR') return 'dhL';
  return f;
}

/**
 * Protokolü belirli bir taraf için çözer: metinleri doldurur, sol taraf için hedefleri aynalar.
 * Tarafsız protokollerde `side` yok sayılır (metinde taraf belirteci bulunmamalıdır).
 */
export function resolveProtocol(id: ProtocolId, side: Side | null): ResolvedProtocol {
  const def = PROTOCOLS[id];
  if (def.sided && !side) throw new Error(`${def.name} için taraf gerekli`);
  const s: Side = def.sided ? (side as Side) : 'R';
  const steps = def.steps.map((st) => {
    const left = def.sided && s === 'L';
    return {
      ...st,
      title: capitalizeTr(fillText(st.title, s)),
      say: fillText(st.say, s),
      clinician: fillText(st.clinician, s),
      unverifiable: st.unverifiable ? fillText(st.unverifiable, s) : undefined,
      reachedSay: opt(st.reachedSay, s),
      short: opt(st.short, s),
      helperTitle: st.helperTitle ? capitalizeTr(fillText(st.helperTitle, s)) : undefined,
      helperSay: opt(st.helperSay, s),
      helperShort: opt(st.helperShort, s),
      helperReachedSay: opt(st.helperReachedSay, s),
      target: left ? mirrorTarget(st.target) : st.target,
      finding: left ? mirrorFinding(st.finding) : st.finding
    };
  });
  return { ...def, side: def.sided ? s : null, steps };
}

/** Yürütme kipine göre protokol: klinisyende varsa `clinicianMinHoldSec` en az bekleme olur (hasta modu değişmez). */
export function protocolForMode(p: ResolvedProtocol, mode: 'patient' | 'clinician'): ResolvedProtocol {
  if (mode !== 'clinician') return p;
  return { ...p, steps: p.steps.map((st) => (st.clinicianMinHoldSec !== undefined ? { ...st, minHoldSec: st.clinicianMinHoldSec } : st)) };
}

/** Tanıya göre önerilen manevralar (ilk eleman varsayılan). */
export function maneuversFor(canal: Canal, mechanism: 'canalithiasis' | 'cupulolithiasis' | 'unknown'): ProtocolId[] {
  // Arka kanal kupulolitiazisinde Semont önce önerilir (kupuladaki debrisi serbestleştirme amacı; düşük kanıt).
  if (canal === 'PC') return mechanism === 'cupulolithiasis' ? ['semont', 'epley'] : ['epley', 'semont'];
  if (canal === 'HC') return mechanism === 'cupulolithiasis' ? ['gufoni-apo'] : ['bbq-roll', 'gufoni-geo'];
  return ['yacovino'];
}
