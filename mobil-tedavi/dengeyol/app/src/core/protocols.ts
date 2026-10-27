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
const lie = (theta: number, thetaTol: number, phiMin: number, phiMax: number): Target => ({
  kind: 'lying',
  theta,
  thetaTol,
  phiMin,
  phiMax
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
  steps: [
    {
      id: 'dh-sit',
      title: 'Otur, başını {Aya} çevir',
      say: 'Yatağın üzerinde oturun. Yastığı, yattığınızda omuzlarınızın altına gelecek yere koyun. Başınızı {Aya} doğru yaklaşık 45 derece çevirin.',
      clinician: 'Hasta yatakta oturur; yastık yatınca omuzların altına gelecek yerde. Baş {Aya} 45° çevrilir.',
      target: SIT_NEUTRAL,
      minHoldSec: 4,
      afterVertigoSec: 0,
      maxVertigoSec: null,
      observe: false,
      unverifiable: 'Otururken başın {Aya} 45° çevrilmesi sensörle doğrulanamaz; bir sonraki adımda yatınca doğrulanır.'
    },
    {
      id: 'dh-lie',
      title: 'Sırtüstü yat, baş {Aya} çevrili ve sarkık',
      say: 'Başınızın yönünü bozmadan sırtüstü yatın. Başınız yastıktan geriye doğru hafifçe sarksın ve {Aya} çevrili kalsın. Baş dönmesi başlarsa ekrana dokunun, geçince yeniden dokunun.',
      clinician:
        'Baş {Aya} 45° çevrili kalarak hasta hızla sırtüstü yatırılır; baş yatak düzleminin 20–30° altına sarkar. Nistagmusu gözleyin; başlangıç ve bitişi işaretleyin.',
      target: lie(45, LIMITS.thetaTol, LIMITS.hangPhiMin, LIMITS.hangPhiMax),
      minHoldSec: 45,
      afterVertigoSec: 10,
      maxVertigoSec: LIMITS.maxVertigoSec,
      observe: true,
      finding: 'dhR'
    },
    {
      id: 'dh-up',
      title: 'Yavaşça otur',
      say: 'Yavaşça doğrulup oturun ve başınızı düz tutun. Birkaç saniye böyle kalın.',
      clinician: 'Hasta yavaşça oturtulur; geri dönüş (ters yönlü) nistagmusu gözlenebilir.',
      target: sit(-20, 35),
      minHoldSec: 20,
      afterVertigoSec: 5,
      maxVertigoSec: null,
      observe: true
    }
  ],
  sources: [
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
      target: lie(0, 15, -45, -10),
      minHoldSec: 10,
      afterVertigoSec: 0,
      maxVertigoSec: null,
      observe: true,
      finding: 'rollCenter'
    },
    {
      id: 'roll-right',
      title: 'Başı hızla sağa 90° çevir',
      say: 'Başınızı hızla sağa doğru çevirin; sağ kulağınız yastığa değsin.',
      clinician: 'Başı hızla sağa 90° çevirin. Yatay nistagmusun yönünü (yere doğru = geotropik, tavana = apogeotropik), şiddetini ve süresini kaydedin.',
      target: lie(90, 15, -50, 15),
      minHoldSec: 45,
      afterVertigoSec: 10,
      maxVertigoSec: null,
      observe: true,
      finding: 'rollR'
    },
    {
      id: 'roll-back1',
      title: 'Başı ortaya getir',
      say: 'Başınızı yavaşça ortaya getirin ve baş dönmesi geçene kadar bekleyin.',
      clinician: 'Başı ortaya getirin; nistagmus ve baş dönmesi tamamen sönene kadar bekleyin.',
      target: lie(0, 15, -50, 10),
      minHoldSec: 30,
      afterVertigoSec: 10,
      maxVertigoSec: null,
      observe: false
    },
    {
      id: 'roll-left',
      title: 'Başı hızla sola 90° çevir',
      say: 'Başınızı hızla sola doğru çevirin; sol kulağınız yastığa değsin.',
      clinician: 'Başı hızla sola 90° çevirin. Nistagmusun yönünü, şiddetini ve süresini kaydedin.',
      target: lie(-90, 15, -50, 15),
      minHoldSec: 45,
      afterVertigoSec: 10,
      maxVertigoSec: null,
      observe: true,
      finding: 'rollL'
    },
    {
      id: 'roll-back2',
      title: 'Başı ortaya getir',
      say: 'Başınızı yavaşça ortaya getirin.',
      clinician: 'Başı ortaya getirin.',
      target: lie(0, 15, -50, 10),
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
  steps: [
    {
      id: 'ep-sit',
      title: 'Otur, başını {Aya} çevir',
      say: 'Yatağın üzerinde oturun. Yastığı, sırtüstü yattığınızda omuzlarınızın altına gelecek yere koyun. Başınızı {Aya} doğru yaklaşık 45 derece çevirin: çeneniz {A} omzunuza doğru yarı yolda olsun.',
      clinician: 'Hasta yatakta oturur; yastık yatınca omuzların altına gelecek yerde. Baş {Aya} (etkilenen taraf) 45° çevrilir.',
      target: SIT_NEUTRAL,
      minHoldSec: 5,
      afterVertigoSec: 0,
      maxVertigoSec: null,
      observe: false,
      unverifiable: 'Otururken başın {Aya} 45° çevrilmesi sensörle doğrulanamaz; bir sonraki adımda yatınca doğrulanır.'
    },
    {
      id: 'ep-1',
      title: 'Sırtüstü yat, baş {Aya} çevrili ve sarkık',
      say: 'Başınızın yönünü bozmadan hızla sırtüstü yatın. Başınız yastıktan geriye doğru hafifçe sarksın ve hâlâ {Aya} çevrili kalsın. Baş dönmesi olabilir, bu beklenen bir durumdur. Başlarsa ekrana dokunun, geçince yeniden dokunun.',
      clinician: 'Baş {Aya} 45° çevrili kalarak hasta hızla sırtüstü yatırılır; baş yatak düzleminin 20–30° altına sarkar.',
      target: lie(45, LIMITS.thetaTol, LIMITS.hangPhiMin, LIMITS.hangPhiMax),
      minHoldSec: 45,
      afterVertigoSec: 30,
      maxVertigoSec: LIMITS.maxVertigoSec,
      observe: true
    },
    {
      id: 'ep-2',
      title: 'Başını {Hya} çevir',
      say: 'Başınızı yastıktan kaldırmadan, yavaşça {Hya} doğru çevirin. Şimdi başınız {H} tarafa 45 derece baksın ve hafifçe sarkık kalsın.',
      clinician: 'Ekstansiyon korunarak baş {Hya} 90° çevrilir; baş {H} tarafa 45° bakar.',
      target: lie(-45, LIMITS.thetaTol, LIMITS.hangPhiMin, LIMITS.hangPhiMax),
      minHoldSec: 45,
      afterVertigoSec: 30,
      maxVertigoSec: LIMITS.maxVertigoSec,
      observe: true
    },
    {
      id: 'ep-3',
      title: '{H} yanına dön, burnun yere baksın',
      say: 'Bütün vücudunuzla {H} yanınıza dönün. Başınızı da aynı yönde biraz daha çevirin; burnunuz yere doğru, yaklaşık 45 derece aşağı baksın.',
      clinician: 'Hasta {H} yanına döner; baş gövdeyle birlikte dönerek yüz yere 45° bakar (başlangıca göre toplam 180°).',
      target: lie(-135, LIMITS.thetaTolFaceDown, -25, 30),
      minHoldSec: 45,
      afterVertigoSec: 30,
      maxVertigoSec: LIMITS.maxVertigoSec,
      observe: true
    },
    {
      id: 'ep-4',
      title: 'Yavaşça otur, çene hafif aşağı',
      say: 'Yavaşça {H} tarafınızdan doğrulup yatağın kenarına oturun. Çenenizi hafifçe göğsünüze doğru eğin. Acele etmeyin.',
      clinician: 'Hasta {H} taraftan yavaşça oturtulur; çene hafif fleksiyonda.',
      target: sit(5, 45),
      minHoldSec: 60,
      afterVertigoSec: 15,
      maxVertigoSec: null,
      observe: false
    }
  ],
  sources: [
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
  name: 'Semont (kurtarıcı) manevrası',
  shortName: 'Semont',
  kind: 'maneuver',
  canal: 'PC',
  sided: true,
  patient: 'prescription',
  summary:
    'Arka kanal BPPV tedavisi. Baş sağlam tarafa 45° çevrilmişken etkilenen tarafa yan yatılır, ardından tek hızlı hareketle karşı tarafa geçilir.',
  steps: [
    {
      id: 'se-sit',
      title: 'Yatak ortasında otur, başını {Hya} çevir',
      say: 'Yatağın ortasında, bacaklarınız yataktan aşağı sarkacak şekilde oturun. İki yanınızda da yatacak kadar yer olsun. Başınızı {Hya} doğru 45 derece çevirin.',
      clinician: 'Hasta yatak kenarında, iki yana yatabilecek şekilde oturur. Baş {Hya} (sağlam taraf) 45° çevrilir.',
      target: SIT_NEUTRAL,
      minHoldSec: 5,
      afterVertigoSec: 0,
      maxVertigoSec: null,
      observe: false,
      unverifiable: 'Otururken başın {Hya} 45° çevrilmesi sensörle doğrulanamaz; bir sonraki adımda yatınca doğrulanır.'
    },
    {
      id: 'se-1',
      title: '{A} yanına hızla yat, burun yukarı',
      say: 'Başınızın yönünü değiştirmeden hızla {A} yanınıza yatın. Burnunuz tavana doğru, yaklaşık 45 derece yukarı baksın. Baş dönmesi başlarsa ekrana dokunun, geçince yeniden dokunun.',
      clinician: 'Hasta hızla {A} yanına (etkilenen taraf) yatırılır; baş sağlam tarafa 45° çevrili kalır, burun yukarı 45°.',
      target: lie(45, 12, -30, 30),
      minHoldSec: 60,
      afterVertigoSec: 30,
      maxVertigoSec: LIMITS.maxVertigoSec,
      observe: true
    },
    {
      id: 'se-2',
      title: 'Tek hızlı hareketle {H} yanına geç',
      say: 'Şimdi tek, hızlı ve kesintisiz bir hareketle oturma pozisyonundan geçerek {H} yanınıza yatın. Başınızın yönünü değiştirmeyin; burnunuz bu kez yere doğru 45 derece bakacak.',
      clinician:
        'Baş-gövde ilişkisi bozulmadan hasta tek hızlı hareketle karşı ({H}) yana geçirilir; burun yere 45° bakar.',
      target: lie(-135, LIMITS.thetaTolFaceDown, -30, 30),
      minHoldSec: 60,
      afterVertigoSec: 30,
      maxVertigoSec: LIMITS.maxVertigoSec,
      observe: true,
      fastTransitionSec: 2
    },
    {
      id: 'se-3',
      title: 'Yavaşça otur',
      say: 'Yavaşça doğrulup oturun. Başınızı dik tutun ve birkaç dakika oturarak dinlenin.',
      clinician: 'Hasta yavaşça oturtulur; baş dik.',
      target: sit(-15, 35),
      minHoldSec: 60,
      afterVertigoSec: 15,
      maxVertigoSec: null,
      observe: false
    }
  ],
  sources: [
    'Semont A ve ark. Adv Otorhinolaryngol 1988;42:290–293.',
    'Mandalà M ve ark. J Neurol 2012;259:882–885 (sham kontrollü RKÇ).'
  ],
  cautions: [
    'Hızlı geçiş gerektirir; yaşlı ya da hareket kısıtlılığı olan hastada yardımcı gerekir.',
    'Hasta modunda yalnızca odyolog/hekim reçetesiyle açılır.'
  ],
  evidenceNote: 'Sınıf I kanıt (Mandalà 2012).'
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
  steps: [
    {
      id: 'bbq-0',
      title: 'Sırtüstü, baş {Aya} 90°',
      say: 'Sırtüstü yatın ve başınızı {Aya} 90 derece çevirin; {A} kulağınız yastığa değsin.',
      clinician: 'Hasta sırtüstü; baş {Aya} 90° çevrili ({A} kulak altta).',
      target: lie(90, 15, -45, 20),
      minHoldSec: 45,
      afterVertigoSec: 15,
      maxVertigoSec: null,
      observe: true
    },
    {
      id: 'bbq-1',
      title: 'Yüz tavana',
      say: 'Başınızı yavaşça ortaya getirin; yüzünüz tavana baksın.',
      clinician: 'Baş ortaya getirilir (yüz tavana).',
      target: lie(0, 15, -45, 20),
      minHoldSec: 45,
      afterVertigoSec: 15,
      maxVertigoSec: null,
      observe: true
    },
    {
      id: 'bbq-2',
      title: 'Baş {Hya} 90°',
      say: 'Başınızı {Hya} 90 derece çevirin; {H} kulağınız yastığa değsin.',
      clinician: 'Baş {Hya} 90° çevrilir ({H} kulak altta).',
      target: lie(-90, 15, -45, 20),
      minHoldSec: 45,
      afterVertigoSec: 15,
      maxVertigoSec: null,
      observe: true
    },
    {
      id: 'bbq-3',
      title: 'Yüzüstü, dirsekler üzerinde',
      say: '{H} yanınızdan dönerek yüzüstü gelin, dirseklerinizin üzerinde durun; yüzünüz yere baksın.',
      clinician: 'Hasta aynı yönde dönerek yüzüstü, dirsekler üzerinde; yüz yere.',
      target: lie(180, 20, -45, 30),
      minHoldSec: 45,
      afterVertigoSec: 15,
      maxVertigoSec: null,
      observe: true
    },
    {
      id: 'bbq-4',
      title: '{A} yanına (toplam 270°)',
      say: 'Aynı yönde dönmeye devam ederek {A} yanınıza gelin; {A} kulağınız yastığa değsin.',
      clinician: 'Aynı yönde dönülerek {A} yan pozisyona gelinir ({A} kulak altta; toplam 270°).',
      target: lie(90, 15, -45, 20),
      minHoldSec: 45,
      afterVertigoSec: 15,
      maxVertigoSec: null,
      observe: true
    },
    {
      id: 'bbq-5',
      title: 'Sırtüstü (toplam 360°)',
      say: 'Aynı yönde dönerek sırtüstü gelin; yüzünüz tavana baksın.',
      clinician: 'Aynı yönde sırtüstüne dönülür (toplam 360°).',
      target: lie(0, 15, -45, 20),
      minHoldSec: 30,
      afterVertigoSec: 15,
      maxVertigoSec: null,
      observe: true
    },
    {
      id: 'bbq-6',
      title: 'Yavaşça otur',
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
    'Lempert T, Tiel-Wilck K. Laryngoscope 1996;106:476–478.',
    'Kim JS ve ark. Neurology 2012;78:159–166 (geotropik yatay kanal RKÇ: BBQ, Gufoni, sham).'
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
    'Yatay kanal geotropik (kanalitiyazis) tedavisi. Sağlam tarafa hızla yan yatılır, ardından baş 45° yere doğru çevrilir.',
  steps: [
    {
      id: 'gg-sit',
      title: 'Yatak kenarında otur',
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
      title: 'Hızla {H} yanına yat',
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
      title: 'Başı 45° yere çevir',
      say: 'Başınızı hızla 45 derece yere doğru çevirin; burnunuz yere baksın.',
      clinician: 'Baş hızla 45° yere doğru çevrilir (burun yere).',
      target: lie(-135, 12, -30, 30),
      minHoldSec: 120,
      afterVertigoSec: 30,
      maxVertigoSec: null,
      observe: true
    },
    {
      id: 'gg-3',
      title: 'Yavaşça otur',
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
    'Gufoni M ve ark. Acta Otorhinolaryngol Ital 1998;18:363–367.',
    'Kim JS ve ark. Neurology 2012;78:159–166 (geotropik yatay kanal RKÇ).'
  ],
  cautions: ['Yalnızca klinisyen modunda.'],
  evidenceNote: 'Sınıf I kanıt (Kim 2012).'
};

const GUFONI_APO: ProtocolDef = {
  id: 'gufoni-apo',
  name: 'Gufoni manevrası (apogeotropik yatay kanal)',
  shortName: 'Gufoni-apo',
  kind: 'maneuver',
  canal: 'HC',
  sided: true,
  patient: 'no',
  summary:
    'Yatay kanal apogeotropik tedavisi (Appiani / Kim değiştirilmiş Gufoni). Etkilenen tarafa hızla yan yatılır, ardından baş 45° tavana doğru çevrilir.',
  steps: [
    {
      id: 'ga-sit',
      title: 'Yatak kenarında otur',
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
      title: 'Hızla {A} yanına yat',
      say: 'Hızla {A} yanınıza yatın; başınız gövdenizle aynı hizada olsun.',
      clinician: 'Hasta hızla {A} yanına (etkilenen taraf) yatırılır; baş gövdeyle aynı hizada.',
      target: lie(90, 12, -30, 30),
      minHoldSec: 60,
      afterVertigoSec: 30,
      maxVertigoSec: null,
      observe: true
    },
    {
      id: 'ga-2',
      title: 'Başı 45° tavana çevir',
      say: 'Başınızı hızla 45 derece tavana doğru çevirin; burnunuz yukarı baksın.',
      clinician: 'Baş hızla 45° tavana doğru çevrilir (burun yukarı).',
      target: lie(45, 12, -30, 30),
      minHoldSec: 120,
      afterVertigoSec: 30,
      maxVertigoSec: null,
      observe: true
    },
    {
      id: 'ga-3',
      title: 'Yavaşça otur',
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
    'Kim JS ve ark. Neurology 2012;79:700–707 (apogeotropik yatay kanal RKÇ).'
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
      title: 'Otur',
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
      say: 'Sırtüstü kalarak başınızı kaldırın ve çenenizi göğsünüze değdirin.',
      clinician: 'Sırtüstüyken baş kaldırılarak çene göğse getirilir.',
      target: lie(0, 15, -65, -20),
      minHoldSec: 30,
      afterVertigoSec: 15,
      maxVertigoSec: null,
      observe: true
    },
    {
      id: 'ya-3',
      title: 'Çene göğüste otur',
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
export const otherSide = (s: Side): Side => (s === 'R' ? 'L' : 'R');

export function fillText(text: string, side: Side): string {
  const h = otherSide(side);
  return text
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
      target: left ? mirrorTarget(st.target) : st.target,
      finding: left ? mirrorFinding(st.finding) : st.finding
    };
  });
  return { ...def, side: def.sided ? s : null, steps };
}

/** Tanıya göre önerilen manevralar (ilk eleman varsayılan). */
export function maneuversFor(canal: Canal, mechanism: 'canalithiasis' | 'cupulolithiasis' | 'unknown'): ProtocolId[] {
  if (canal === 'PC') return ['epley', 'semont'];
  if (canal === 'HC') return mechanism === 'cupulolithiasis' ? ['gufoni-apo'] : ['bbq-roll', 'gufoni-geo'];
  return ['yacovino'];
}
