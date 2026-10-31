/**
 * Anlık baş pozunu bir adımın hedefiyle karşılaştırır.
 */
import { angleDiff, type HeadPose } from './geometry';
import type { Target } from './protocols';

export type HintKey =
  | 'LIE_DOWN'
  | 'SIT_UP'
  | 'TURN_RIGHT'
  | 'TURN_LEFT'
  /** Yüz yere hedefte gövde dönmemiş (yalnız baş çevrili): boyun zorlanmasın, bütün vücutla dönülsün. */
  | 'TURN_BODY_RIGHT'
  | 'TURN_BODY_LEFT'
  /**
   * Yan yatış hedefinde (ör. Epley 3, burun yere) hasta KARŞI yanda: en kısa açıyla yön verilirse yüzüstü üzerinden
   * döndürülür. Önce sırtüstüne dönülmesi söylenir; ad, hedefin (hastanın) yanıdır (k02, tur 2).
   */
  | 'WRONG_SIDE_RIGHT'
  | 'WRONG_SIDE_LEFT'
  | 'HANG_MORE'
  | 'HANG_LESS'
  | 'CHIN_DOWN'
  | 'CHIN_UP'
  | 'HEAD_STRAIGHT';

export interface Evaluation {
  inRange: boolean;
  postureOk: boolean;
  /** Hedef − mevcut θ (işaretli, derece). Pozitif → sağa çevrilmeli. Yalnızca yatar hedefte. */
  thetaErr: number | null;
  /** Ekstansiyon aralığına işaretli uzaklık. Pozitif → daha fazla sarkıtmalı, negatif → kaldırmalı. 0 = aralıkta. */
  phiErr: number | null;
  /** Öne eğilme aralığına işaretli uzaklık. Pozitif → çene daha aşağı. */
  psiErr: number | null;
  /** Toplam yaklaşık hata (derece). */
  errorDeg: number;
  /** 0–1; 1 = hedefte. Sesli yaklaşma tonu için. */
  closeness: number;
  /** En öncelikli düzeltme. */
  hint: HintKey | null;
  /** Yan yatış hedefinde hasta karşı yanda (ya da oradan yüzüstü üzerinden geliyor); bkz. `sideGuarded`. */
  wrongSide?: boolean;
}

/** Dik oturuş sınırı: başın dikeyden sapması bundan küçükse "oturuyor" sayılır. */
export const SITTING_MAX_TILT = 55;
/** Yatış sınırı: başın dikeyden sapması bundan büyükse "yatıyor" sayılır. */
export const LYING_MIN_TILT = 45;
/** Otururken yana eğilme sınırı. */
export const SITTING_MAX_LAMBDA = 25;
/**
 * Pozisyon tutulurken sarkma (φ) sınırındaki histerezis payı (°). Hedefe GİRİŞ için tam aralık gerekir; yalnız tutma
 * sırasında sınırda ölçüm gürültüsüyle "bozuldu / düzeldi" gidip gelmesin diye aralık her iki yanda bu kadar genişler
 * (k07, k10; tur 1). Dönüş (θ) toleransı değişmez.
 */
export const HOLD_HYSTERESIS_DEG = 3;
/** Baş bu dönüşün altındaysa (aynı yanda) gövde henüz dönmemiş sayılır: tek başına boyunla yüz yere bakılamaz. */
const BODY_NOT_TURNED_MAX = 110;

/** Sırtüstü bölgesi: yatarken |θ| bundan küçükse hasta sırtüstü sayılır; "yanlış taraf" kilidi burada çözülür. */
export const SUPINE_ZONE_DEG = 30;
/** Karşı yan bölgesinin üst sınırı: |θ| bunun ötesi yüzüstüdür (doğru yandan biraz fazla dönen hasta da buraya gelir). */
const WRONG_SIDE_MAX_DEG = 160;

/**
 * Yan yatış hedefi mi (yanlış taraf denetimi): gövdeyle dönülen hedef ya da |θ| 90°–150° arası hedef. Yüzüstü hedef
 * (BBQ 180°) ve yüzüstünden gelinen hedef (`viaProne`) hariç: bu manevralarda yüzüstü yolun bir parçasıdır.
 */
export function sideGuarded(target: Target): boolean {
  if (target.kind !== 'lying' || target.viaProne) return false;
  const a = Math.abs(target.theta);
  return !!target.bodyTurn || (a >= 90 && a <= 150);
}

/** Yatan hasta, yan yatış hedefinin karşı yanında mı (sırtüstünü geçmiş, yüzüstüne varmamış). */
export function onWrongSide(pose: HeadPose, target: Target): boolean {
  if (!sideGuarded(target) || target.kind !== 'lying') return false;
  const a = Math.abs(pose.theta);
  return Math.sign(pose.theta) !== Math.sign(target.theta) && a >= SUPINE_ZONE_DEG && a <= WRONG_SIDE_MAX_DEG;
}

function rangeDistance(v: number, lo: number, hi: number): number {
  if (v < lo) return lo - v;
  if (v > hi) return hi - v;
  return 0;
}

export interface EvaluateOptions {
  /** Tutma sırasında sarkma aralığına eklenen pay (°); bkz. HOLD_HYSTERESIS_DEG. */
  holdMarginDeg?: number;
  /**
   * Hasta bu adımda karşı yana geçti ve henüz sırtüstüne (ya da oturuşa) dönmedi (yürütücü tutar). Bu sürece hedefe
   * yüzüstü üzerinden gelinse de kabul edilmez; ipucu "önce sırtüstüne dönün" olur.
   */
  wrongSideLatched?: boolean;
}

export function evaluate(pose: HeadPose, target: Target, opts: EvaluateOptions = {}): Evaluation {
  if (target.kind === 'sitting') {
    // Çene göğüste oturuş (ör. Yacovino son adımı, ψ ≤ 60°) "yatıyor" sanılmasın: eşik hedefe göre genişler.
    const maxTilt = Math.max(SITTING_MAX_TILT, target.psiMax + 10);
    const postureOk = pose.tiltFromUpright <= maxTilt;
    if (!postureOk) {
      return {
        inRange: false,
        postureOk,
        thetaErr: null,
        phiErr: null,
        psiErr: null,
        errorDeg: pose.tiltFromUpright,
        closeness: closenessFrom(pose.tiltFromUpright - maxTilt + 20),
        hint: 'SIT_UP'
      };
    }
    const psiErr = rangeDistance(pose.psi, target.psiMin, target.psiMax);
    const lambdaExcess = Math.max(0, Math.abs(pose.lambda) - SITTING_MAX_LAMBDA);
    const inRange = psiErr === 0 && lambdaExcess === 0;
    let hint: HintKey | null = null;
    if (!inRange) {
      if (Math.abs(psiErr) >= lambdaExcess) hint = psiErr > 0 ? 'CHIN_DOWN' : 'CHIN_UP';
      else hint = 'HEAD_STRAIGHT';
    }
    const errorDeg = Math.hypot(psiErr, lambdaExcess);
    return { inRange, postureOk, thetaErr: null, phiErr: null, psiErr, errorDeg, closeness: closenessFrom(errorDeg), hint };
  }

  // Yatar hedef. Sırtüstü başı öne eğik hedeflerde (ör. Yacovino, φ ≥ −42°) baş dikeye yaklaşır; eşik hedefe göre düşer,
  // böylece yatan hastaya "Şimdi yatın" denmez.
  const minTilt = Math.min(LYING_MIN_TILT, 90 + target.phiMin - 10);
  const postureOk = pose.tiltFromUpright >= minTilt;
  if (!postureOk) {
    return {
      inRange: false,
      postureOk,
      thetaErr: null,
      phiErr: null,
      psiErr: null,
      errorDeg: 90 - pose.tiltFromUpright,
      closeness: 0,
      hint: 'LIE_DOWN'
    };
  }
  const thetaErr = angleDiff(target.theta, pose.theta);
  // Karşı yanda en kısa açı yüzüstünden geçirir: yön verilmez, önce sırtüstüne dönülmesi söylenir (k02, tur 2).
  if (onWrongSide(pose, target) || (opts.wrongSideLatched && sideGuarded(target) && Math.abs(pose.theta) >= SUPINE_ZONE_DEG)) {
    return {
      inRange: false,
      postureOk,
      thetaErr,
      phiErr: null,
      psiErr: null,
      errorDeg: Math.abs(thetaErr),
      closeness: 0,
      hint: target.theta > 0 ? 'WRONG_SIDE_RIGHT' : 'WRONG_SIDE_LEFT',
      wrongSide: true
    };
  }
  const thetaExcess = Math.max(0, Math.abs(thetaErr) - target.thetaTol);
  const margin = Math.max(0, opts.holdMarginDeg ?? 0);
  const phiErr = rangeDistance(pose.phi, target.phiMin - margin, target.phiMax + margin);
  const inRange = thetaExcess === 0 && phiErr === 0;
  let hint: HintKey | null = null;
  if (!inRange) {
    // Önce dönüş (kritik eksen), sonra sarkıklık.
    if (thetaExcess >= Math.abs(phiErr) * 0.75) {
      hint = thetaErr > 0 ? 'TURN_RIGHT' : 'TURN_LEFT';
      // Gövdeyle dönülen yüz yere hedefte (Epley 3) baş hedefle aynı yanda ama ≤110° (ya da hâlâ ortada):
      // gövde dönmemiş. "Başınızı çevirin" boynu zorlar; bütün vücutla yana dönülmesi söylenir (k10, tur 1).
      if (target.bodyTurn) {
        const sameSide = Math.sign(pose.theta) === Math.sign(target.theta) || Math.abs(pose.theta) < 30;
        if (sameSide && Math.abs(pose.theta) <= BODY_NOT_TURNED_MAX) hint = target.theta > 0 ? 'TURN_BODY_RIGHT' : 'TURN_BODY_LEFT';
      }
    } else hint = phiErr > 0 ? 'HANG_MORE' : 'HANG_LESS';
  }
  const errorDeg = Math.hypot(thetaExcess, phiErr);
  return { inRange, postureOk, thetaErr, phiErr, psiErr: null, errorDeg, closeness: closenessFrom(errorDeg), hint };
}

/** 0° hata → 1, 45°+ hata → 0. */
function closenessFrom(errDeg: number): number {
  if (errDeg <= 0) return 1;
  return Math.max(0, 1 - errDeg / 45);
}

export const HINT_TEXT_PATIENT: Record<HintKey, string> = {
  LIE_DOWN: 'Şimdi yatın.',
  SIT_UP: 'Yavaşça oturun.',
  TURN_RIGHT: 'Başınızı biraz daha sağa çevirin.',
  TURN_LEFT: 'Başınızı biraz daha sola çevirin.',
  TURN_BODY_RIGHT: 'Yalnız başınızı değil, bütün vücudunuzla sağ yanınıza dönün; sonra burnunuz yere baksın.',
  TURN_BODY_LEFT: 'Yalnız başınızı değil, bütün vücudunuzla sol yanınıza dönün; sonra burnunuz yere baksın.',
  // Yürütücü önce kısa "Dur! Yanlış taraf." uyarısını (ayrı titreşim/ton) verir; bu tam yönerge onun ardından gelir (k02, tur 3).
  WRONG_SIDE_RIGHT: 'Önce sırtüstüne dönün, sonra bütün vücudunuzla sağ yanınıza dönün.',
  WRONG_SIDE_LEFT: 'Önce sırtüstüne dönün, sonra bütün vücudunuzla sol yanınıza dönün.',
  HANG_MORE: 'Başınızı biraz daha geriye bırakın.',
  HANG_LESS: 'Başınızı biraz kaldırın.',
  CHIN_DOWN: 'Çenenizi biraz göğsünüze doğru indirin.',
  CHIN_UP: 'Çenenizi biraz kaldırın.',
  HEAD_STRAIGHT: 'Başınızı yana yatırmayın, dik tutun.'
};

export const HINT_TEXT_CLINICIAN: Record<HintKey, string> = {
  LIE_DOWN: 'Hasta henüz yatar pozisyonda değil.',
  SIT_UP: 'Hasta oturtulmalı.',
  // Klinisyen hastanın karşısında ya da başucunda durur: yön her zaman hastaya göre söylenir (k10, tur 2).
  TURN_RIGHT: 'Başı hastanın sağına çevirin.',
  TURN_LEFT: 'Başı hastanın soluna çevirin.',
  TURN_BODY_RIGHT: 'Gövdeyi hastanın sağına çevirin (yalnız baş değil).',
  TURN_BODY_LEFT: 'Gövdeyi hastanın soluna çevirin (yalnız baş değil).',
  WRONG_SIDE_RIGHT: 'Yanlış taraf: hastayı önce sırtüstüne, sonra hastanın sağına çevirin (yüzüstünden geçirmeyin).',
  WRONG_SIDE_LEFT: 'Yanlış taraf: hastayı önce sırtüstüne, sonra hastanın soluna çevirin (yüzüstünden geçirmeyin).',
  HANG_MORE: 'Ekstansiyonu artırın (baş daha sarkık).',
  HANG_LESS: 'Ekstansiyonu azaltın.',
  CHIN_DOWN: 'Fleksiyonu artırın (çene aşağı).',
  CHIN_UP: 'Fleksiyonu azaltın.',
  HEAD_STRAIGHT: 'Lateral eğilmeyi düzeltin.'
};

/** Yardımcı modu (hasta ekranı görmez, başı yakını çevirir): sözler yardımcıya, yönler "hastanın sağı/solu" ile. */
export const HINT_TEXT_HELPER: Record<HintKey, string> = {
  LIE_DOWN: 'Hastayı şimdi yatırın.',
  SIT_UP: 'Hastayı yavaşça oturtun.',
  TURN_RIGHT: 'Başı hastanın sağına biraz daha çevirin.',
  TURN_LEFT: 'Başı hastanın soluna biraz daha çevirin.',
  TURN_BODY_RIGHT: 'Hastayı bütün vücuduyla sağ yanına çevirin; yalnız başı değil. Sonra burnu yere baksın.',
  TURN_BODY_LEFT: 'Hastayı bütün vücuduyla sol yanına çevirin; yalnız başı değil. Sonra burnu yere baksın.',
  WRONG_SIDE_RIGHT: 'Hastayı önce sırtüstüne getirin, sonra bütün vücuduyla sağ yanına çevirin.',
  WRONG_SIDE_LEFT: 'Hastayı önce sırtüstüne getirin, sonra bütün vücuduyla sol yanına çevirin.',
  HANG_MORE: 'Başı biraz daha geriye sarkıtın.',
  HANG_LESS: 'Başı biraz kaldırın.',
  CHIN_DOWN: 'Hastanın çenesini biraz göğsüne doğru indirin.',
  CHIN_UP: 'Hastanın çenesini biraz kaldırın.',
  HEAD_STRAIGHT: 'Başı yana yatırmayın, dik tutun.'
};
