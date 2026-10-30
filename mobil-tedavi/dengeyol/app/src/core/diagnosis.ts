/**
 * Odyolog/hekim modu için tanı karar desteği.
 *
 * Dayanak: von Brevern M ve ark. "Benign paroxysmal positional vertigo: Diagnostic criteria" — Bárány Society
 * ICVD, J Vestib Res 2015;25:105–117; Bhattacharyya N ve ark. AAO-HNSF BPPV kılavuzu 2017.
 *
 * Uygulama bir ÖNERİ üretir; tanıyı klinisyen onaylar ya da değiştirir. Kurallar bilerek tutucudur:
 * belirsiz ya da santral nedenden şüphelendiren her desende karar klinisyene bırakılır.
 */
import { maneuversFor, type Canal, type FindingKey, type ProtocolId, type Side } from './protocols';

export type NystagmusType =
  | 'none'
  /** Yukarı vuran + torsiyonel (üst kutup alttaki kulağa) — arka kanal. */
  | 'upbeat-torsional'
  /** Aşağı vuran + torsiyonel — ön kanal (olası). */
  | 'downbeat-torsional'
  /** Saf aşağı vuran (torsiyonsuz) — santral nedenleri düşündürür. */
  | 'downbeat-pure'
  /** Yatay, yere doğru vuran. */
  | 'horizontal-geotropic'
  /** Yatay, tavana doğru vuran. */
  | 'horizontal-apogeotropic'
  /** Başka/atipik desen (ör. yön değiştiren ama pozisyonla uyumsuz, saf torsiyonel, spontan). */
  | 'other';

export interface Finding {
  nystagmus: NystagmusType;
  /** Gecikme (s). */
  latencySec: number | null;
  /** Süre (s). */
  durationSec: number | null;
  /** Şiddet 0–3 (yatay kanal tarafı için). */
  intensity: 0 | 1 | 2 | 3;
  /** Hasta baş dönmesi bildirdi mi? */
  vertigo: boolean;
  // --- İsteğe bağlı ek alanlar (eski kayıtlarda yok) ---
  /**
   * Torsiyonel bileşende göz üst kutbunun vurduğu kulak (hastanın sağı/solu). Bárány 2015: arka kanal BPPV'de üst kutup
   * alttaki (etkilenen) kulağa doğru vurur. Belirlenmediyse alan yok.
   */
  torsionToward?: Side;
  /** Tekrarlanan pozisyonlamada yanıt azaldı mı (yorulma)? Değerlendirilmediyse alan yok. */
  fatigue?: boolean;
  /** Dix-Hallpike'tan oturunca ters yönlü nistagmus gözlendi mi? Değerlendirilmediyse alan yok. */
  reversalOnSitting?: boolean;
  /** Gözlem yöntemi. */
  method?: ObservationMethod;
  /** Serbest not (klinisyen). */
  note?: string;
}

export type ObservationMethod = 'VNG' | 'Frenzel' | 'çıplak göz';
export const OBSERVATION_METHODS: ObservationMethod[] = ['VNG', 'Frenzel', 'çıplak göz'];

export type Findings = Partial<Record<FindingKey, Finding>>;

export type Mechanism = 'canalithiasis' | 'cupulolithiasis' | 'unknown';
export type Confidence = 'tipik' | 'olası' | 'belirsiz';

export interface DiagnosisSuggestion {
  canal: Canal | null;
  side: Side | null;
  mechanism: Mechanism;
  confidence: Confidence;
  label: string;
  rationale: string[];
  maneuvers: ProtocolId[];
}

export interface DiagnosisResult {
  suggestions: DiagnosisSuggestion[];
  warnings: string[];
  /** Hiçbir testte nistagmus/baş dönmesi yok. */
  negative: boolean;
  /** Birden çok kanalda öneri (çok kanallı tutulum olası). */
  multiCanal: boolean;
}

export const NYSTAGMUS_LABEL: Record<NystagmusType, string> = {
  none: 'Yok',
  'upbeat-torsional': 'Yukarı vuran + torsiyonel',
  'downbeat-torsional': 'Aşağı vuran + torsiyonel',
  'downbeat-pure': 'Saf aşağı vuran',
  'horizontal-geotropic': 'Yatay geotropik (yere doğru)',
  'horizontal-apogeotropic': 'Yatay apogeotropik (tavana doğru)',
  other: 'Diğer / atipik'
};

/** Bárány ölçütü: kanalolitiazis nistagmusu < 1 dk sürer. */
export const ONE_MINUTE = 60;

const sideLabel = (s: Side) => (s === 'R' ? 'sağ' : 'sol');

function isLong(f: Finding): boolean {
  return f.durationSec !== null && f.durationSec >= ONE_MINUTE;
}

export function suggestDiagnosis(findings: Findings): DiagnosisResult {
  const suggestions: DiagnosisSuggestion[] = [];
  const warnings: string[] = [];
  const all = Object.entries(findings).filter((e): e is [FindingKey, Finding] => !!e[1]);

  // --- Santral uyarı desenleri ---------------------------------------------------------------
  for (const [key, f] of all) {
    if (f.nystagmus === 'downbeat-pure') {
      warnings.push(
        `${keyLabel(key)}: Saf aşağı vuran pozisyonel nistagmus. Santral pozisyonel nistagmus (serebellum/beyin sapı) dışlanmalı; nörolojik değerlendirme ve gerekirse MR önerilir.`
      );
    }
    if (f.nystagmus === 'other') {
      warnings.push(`${keyLabel(key)}: Atipik nistagmus deseni. BPPV dışı nedenler (santral, vestibüler migren) düşünülmeli.`);
    }
  }
  const center = findings.rollCenter;
  if (center && center.nystagmus !== 'none') {
    warnings.push(
      'Sırtüstü nötr pozisyonda nistagmus var. Yatay kanal kupulolitiazisinde "null nokta" bulgusu olabilir; spontan nistagmus ise santral/periferik vestibülopati açısından değerlendirin.'
    );
  }

  // --- Arka kanal (Dix-Hallpike: yukarı vuran + torsiyonel) -----------------------------------
  const pcSides: Side[] = [];
  for (const side of ['R', 'L'] as Side[]) {
    const f = findings[side === 'R' ? 'dhR' : 'dhL'];
    if (f && f.nystagmus === 'upbeat-torsional') pcSides.push(side);
  }
  if (pcSides.length === 1) {
    const side = pcSides[0]!;
    const f = findings[side === 'R' ? 'dhR' : 'dhL']!;
    const cupulo = isLong(f);
    const rationale = [
      `${side === 'R' ? 'Sağ' : 'Sol'} Dix-Hallpike'ta yukarı vuran + torsiyonel nistagmus.`,
      f.latencySec !== null ? `Gecikme ${f.latencySec} s.` : 'Gecikme kaydedilmedi.',
      f.durationSec !== null ? `Süre ${f.durationSec} s${cupulo ? ' (≥1 dk)' : ' (<1 dk)'}.` : 'Süre kaydedilmedi.'
    ];
    // "Tipik": gecikme ve süre kaydedilmiş ve ölçütlere uyuyor (gecikme 1–20 s, süre <1 dk) ve karşı taraf da test edilmiş
    // (iki taraflı tutulum dışlanmış olsun).
    const otherTested = !!findings[side === 'R' ? 'dhL' : 'dhR'];
    const typical =
      !cupulo && otherTested && f.durationSec !== null && f.latencySec !== null && f.latencySec >= 1 && f.latencySec <= 20;
    if (f.latencySec !== null && f.latencySec > 20) rationale.push('Gecikme >20 s (tipik değil).');
    if (f.torsionToward === side) rationale.push(`Torsiyon ${sideLabel(side)} (alttaki) kulağa doğru: arka kanal desenine uyuyor.`);
    if (f.fatigue === false) rationale.push('Tekrarda yorulma gözlenmedi.');
    if (f.reversalOnSitting) rationale.push('Oturunca ters yönlü nistagmus gözlendi.');
    if (!otherTested) rationale.push('Karşı taraf Dix-Hallpike test edilmedi; iki taraflı tutulum dışlanmadı.');
    suggestions.push({
      canal: 'PC',
      side,
      mechanism: cupulo ? 'cupulolithiasis' : f.durationSec === null ? 'unknown' : 'canalithiasis',
      confidence: typical ? 'tipik' : 'olası',
      label: cupulo
        ? `${cap(sideLabel(side))} arka kanal BPPV — kupulolitiazis (olası)`
        : `${cap(sideLabel(side))} arka kanal BPPV (kanalolitiazis)`,
      rationale,
      maneuvers: maneuversFor('PC', cupulo ? 'cupulolithiasis' : 'canalithiasis')
    });
    if (f.latencySec === 0 && !cupulo) {
      warnings.push('Arka kanal deseni gecikmesiz başladı; tipik BPPV gecikmeli (1–20 s) başlar. Santral nedenleri gözden kaçırmayın.');
    }
    if (f.torsionToward && f.torsionToward !== side) {
      // Bárány 2015: arka kanal BPPV'de üst kutup alttaki (test edilen) kulağa vurur. Ters torsiyon bu tarafı desteklemez.
      warnings.push(
        `${keyLabel(side === 'R' ? 'dhR' : 'dhL')}: torsiyon üstteki (${sideLabel(f.torsionToward)}) kulağa doğru kaydedildi. Arka kanal BPPV'de üst kutup alttaki kulağa vurur; taraf ve deseni yeniden değerlendirin.`
      );
    }
    if (cupulo) {
      warnings.push(
        `Arka kanal deseni ≥1 dk sürdü${f.latencySec === 0 ? ' ve gecikmesiz başladı' : ''}. Arka kanal kupulolitiazisi nadir ve "gelişmekte olan" bir tanıdır; santral pozisyonel nistagmusu dışlayın, manevraya yanıt yoksa nörolojik değerlendirme.`
      );
    }
  } else if (pcSides.length === 2) {
    const fR = findings.dhR!;
    const fL = findings.dhL!;
    const anyLong = isLong(fR) || isLong(fL);
    for (const k of ['dhR', 'dhL'] as const) {
      const f = findings[k]!;
      if (isLong(f)) warnings.push(`${keyLabel(k)}: yanıt ≥1 dk sürdü; santral pozisyonel nistagmusu dışlayın.`);
      else if (f.latencySec === 0) warnings.push(`${keyLabel(k)}: yanıt gecikmesiz başladı; santral nedenleri gözden kaçırmayın.`);
    }
    const bilateralSide = torsionSide(fR, fL);
    if (bilateralSide.side) {
      // İki testte de torsiyon aynı kulağa: etkilenen kulak o taraf (Bárány 2015: üst kutup etkilenen kulağa vurur).
      // Karşı taraf testindeki yanıt çoğunlukla aynı kanalın daha zayıf uyarılmasıdır. Yine de "tipik" sayılmaz.
      const side = bilateralSide.side;
      suggestions.push({
        canal: 'PC',
        side,
        mechanism: anyLong ? 'cupulolithiasis' : fR.durationSec === null || fL.durationSec === null ? 'unknown' : 'canalithiasis',
        confidence: 'olası',
        label: anyLong
          ? `${cap(sideLabel(side))} arka kanal BPPV — kupulolitiazis (olası; iki taraflı yanıt, torsiyona göre)`
          : `${cap(sideLabel(side))} arka kanal BPPV (iki taraflı yanıt; taraf torsiyona göre)`,
        rationale: [
          'Her iki Dix-Hallpike testinde de yukarı vuran + torsiyonel nistagmus.',
          `İki testte de torsiyon ${sideLabel(side)} kulağa doğru kaydedildi → etkilenen kulak ${sideLabel(side)} (Bárány 2015: üst kutup etkilenen kulağa vurur).`,
          'Karşı taraf testindeki yanıt çift taraflı tutulumu tam dışlamaz; manevradan sonra iki tarafı yeniden test edin.'
        ],
        maneuvers: maneuversFor('PC', anyLong ? 'cupulolithiasis' : 'canalithiasis')
      });
    } else {
      suggestions.push({
        canal: 'PC',
        side: null,
        mechanism: 'unknown',
        confidence: 'belirsiz',
        label: 'İki taraflı Dix-Hallpike pozitif (çift taraflı arka kanal ya da yatay kanal tutulumu olası)',
        rationale: [
          'Her iki Dix-Hallpike testinde de yukarı vuran + torsiyonel nistagmus.',
          bilateralSide.reason,
          'Çift taraflı tutulumda önce daha şiddetli taraf tedavi edilir.'
        ],
        maneuvers: maneuversFor('PC', 'canalithiasis')
      });
    }
  }

  // --- Ön kanal (aşağı vuran + torsiyonel) --------------------------------------------------
  const ac = all.filter(([k, f]) => (k === 'dhR' || k === 'dhL') && f.nystagmus === 'downbeat-torsional');
  if (ac.length > 0) {
    suggestions.push({
      canal: 'AC',
      side: null,
      mechanism: 'unknown',
      confidence: 'olası',
      label: 'Ön kanal BPPV (olası) — gelişmekte olan tanı',
      rationale: [
        'Dix-Hallpike / baş sarkıtmada aşağı vuran + torsiyonel nistagmus.',
        'Bárány ölçütlerinde ön kanal BPPV "gelişmekte olan" bir tanıdır; taraf belirlemesi güvenilir değildir.'
      ],
      maneuvers: maneuversFor('AC', 'unknown')
    });
    warnings.push(
      'Aşağı vuran pozisyonel nistagmusta santral nedenler (serebellar lezyon) mutlaka dışlanmalı; manevra yanıtsızsa nörolojik değerlendirme.'
    );
  }

  // --- Yatay kanal (supine roll) ---------------------------------------------------------------
  const rR = findings.rollR;
  const rL = findings.rollL;
  const horizR = rR && (rR.nystagmus === 'horizontal-geotropic' || rR.nystagmus === 'horizontal-apogeotropic');
  const horizL = rL && (rL.nystagmus === 'horizontal-geotropic' || rL.nystagmus === 'horizontal-apogeotropic');
  if (horizR || horizL) {
    const types = new Set([rR?.nystagmus, rL?.nystagmus].filter((t) => t === 'horizontal-geotropic' || t === 'horizontal-apogeotropic'));
    if (types.size > 1) {
      suggestions.push({
        canal: 'HC',
        side: null,
        mechanism: 'unknown',
        confidence: 'belirsiz',
        label: 'Yatay kanal — tutarsız desen',
        rationale: ['Bir tarafta geotropik, diğer tarafta apogeotropik nistagmus. Testi tekrarlayın.'],
        maneuvers: []
      });
      warnings.push('Supine roll testinde iki tarafta farklı yönlü yatay nistagmus tipik değildir; santral pozisyonel nistagmus açısından değerlendirin.');
    } else {
      const geo = types.has('horizontal-geotropic');
      const iR = rR && horizR ? rR.intensity : 0;
      const iL = rL && horizL ? rL.intensity : 0;
      // İki tarafta nistagmus var ama birinin şiddeti girilmemişse (0) taraf seçilmez: apogeotropikte
      // "zayıf taraf" kuralı unutulmuş bir şiddeti yanlışlıkla hasta taraf sayardı.
      const gradeMissing = !!horizR && !!horizL && (iR === 0 || iL === 0);
      // Taraf yalnız iki tarafta da yatay nistagmus görülüp ikisinin de şiddeti girilmişken belirlenir; tek taraflı kayıtta
      // (diğer taraf girilmemiş ya da negatif) "zayıf/güçlü taraf" kuralı yanlış tarafı seçebilir.
      let side: Side | null = null;
      if (horizR && horizL && iR !== iL && !gradeMissing) {
        // Geotropik: güçlü taraf hasta. Apogeotropik: zayıf taraf hasta.
        if (geo) side = iR > iL ? 'R' : 'L';
        else side = iR < iL ? 'R' : 'L';
      }
      const bothSides = !!horizR && !!horizL;
      const longAny = [rR, rL].some((f) => f && isLong(f));
      const mech: Mechanism = geo ? 'canalithiasis' : 'cupulolithiasis';
      const rationale = [
        `Supine roll: ${geo ? 'geotropik' : 'apogeotropik'} yatay nistagmus${bothSides ? ' (iki tarafta)' : ' (tek tarafta)'}.`,
        `Şiddet sağ ${iR}/3, sol ${iL}/3 → ${
          side
            ? `${geo ? 'güçlü' : 'zayıf'} taraf ${sideLabel(side)}`
            : gradeMissing
              ? 'taraf belirlenemedi (bir tarafın şiddeti girilmedi; iki tarafın şiddetini de girin)'
              : !(horizR && horizL)
                ? 'taraf belirlenemedi (yatay nistagmus yalnız bir tarafta kaydedildi; iki tarafı da test edip şiddetini girin)'
                : 'taraf belirlenemedi (eşit şiddet)'
        }.`
      ];
      // Süre, desenle uyumlu değilse öneri "tipik" sayılmaz (Bárány 2015: geotropik kanalolitiazis <1 dk, kupulolitiazis ≥1 dk).
      const durationMismatch = (geo && longAny) || (!geo && !longAny);
      if (geo && longAny) {
        rationale.push('Geotropik nistagmus ≥1 dk sürdü (tipik değil; hafif kupula / "light cupula" ayırıcı tanısı).');
        warnings.push('Geotropik yatay nistagmus 1 dakikadan uzun sürdü: hafif kupula ya da santral pozisyonel nistagmus açısından değerlendirin.');
      }
      if (!geo && !longAny) rationale.push('Apogeotropik nistagmus genellikle ≥1 dk sürer; süre kısa ise ön kol kanalolitiazisi olabilir.');
      suggestions.push({
        canal: 'HC',
        side,
        mechanism: mech,
        confidence: side && bothSides && !durationMismatch ? 'tipik' : side ? 'olası' : 'belirsiz',
        label: side
          ? `${cap(sideLabel(side))} yatay kanal BPPV — ${geo ? 'geotropik (kanalolitiazis)' : 'apogeotropik (kupulolitiazis ya da ön kol kanalolitiazisi)'}`
          : `Yatay kanal BPPV — ${geo ? 'geotropik' : 'apogeotropik'}, taraf belirsiz`,
        rationale: side
          ? rationale
          : [...rationale, 'Tarafı belirlemek için ek testler (öne eğilme–geriye eğilme / bow and lean, yatma nistagmusu) kullanın.'],
        maneuvers: side ? maneuversFor('HC', mech) : []
      });
    }
  }
  // Dix-Hallpike'ta yatay nistagmus → yatay kanal şüphesi
  for (const k of ['dhR', 'dhL'] as const) {
    const f = findings[k];
    if (f && (f.nystagmus === 'horizontal-geotropic' || f.nystagmus === 'horizontal-apogeotropic') && !rR && !rL) {
      warnings.push(`${keyLabel(k)} sırasında yatay nistagmus: yatay kanal BPPV açısından supine roll testi yapın.`);
    }
  }

  // --- Nistagmussuz pozisyonel vertigo -----------------------------------------------------------
  const anyNys = all.some(([, f]) => f.nystagmus !== 'none');
  const vertigoKeys = all.filter(([, f]) => f.vertigo).map(([k]) => k);
  if (!anyNys && vertigoKeys.length > 0) {
    const dhVert = vertigoKeys.filter((k) => k === 'dhR' || k === 'dhL');
    const side: Side | null = dhVert.length === 1 ? (dhVert[0] === 'dhR' ? 'R' : 'L') : null;
    suggestions.push({
      canal: side ? 'PC' : null,
      side,
      mechanism: 'unknown',
      confidence: 'belirsiz',
      label: 'Nistagmussuz pozisyonel vertigo ("subjektif BPPV" olasılığı)',
      rationale: [
        `Nistagmus gözlenmedi; baş dönmesi: ${vertigoKeys.map(keyLabel).join(', ')}.`,
        'Bárány 2015 ölçütleri bu durum için öyküye göre iki ayrı kategori tanımlar ("probable BPPV, spontaneously resolved" ve "possible BPPV"); kategoriyi öyküyle siz belirleyin. Klinik karara göre semptomatik tarafa manevra düşünülebilir.'
      ],
      maneuvers: side ? maneuversFor('PC', 'unknown') : []
    });
  }

  // Nistagmus var ama hiçbir öneri ya da uyarı çıkmadı (ör. roll testinde dikey-torsiyonel, Dix-Hallpike'ta yatay ve roll negatif):
  // klinisyen boş ekran görmesin.
  if (suggestions.length === 0 && warnings.length === 0 && all.some(([, f]) => f.nystagmus !== 'none')) {
    warnings.push(
      'Kaydedilen nistagmus test düzlemiyle uyumsuz ya da BPPV tiplerine uymuyor: diğer kanal ya da santral nedenler açısından değerlendirin; testleri tekrarlayın.'
    );
  }

  // Birden çok kanal önerisi: çok kanallı tutulum (kendi kendine tedavi çalışmalarının dışlama ölçütü; Kim 2023).
  const canals = new Set(suggestions.map((s) => s.canal).filter((c): c is Canal => c !== null));
  if (canals.size >= 2) {
    warnings.push('Birden çok kanalda pozisyonel nistagmus: çok kanallı BPPV olası. Tedavi sırasını siz belirleyin; evde manevra reçetesi önerilmez.');
  }

  // Herhangi bir uyarı varsa hiçbir öneri "tipik" sayılmaz: klinisyen uyarıyı görmeden tek dokunuşla onaylamasın.
  if (warnings.length > 0) {
    for (const s of suggestions) {
      if (s.confidence === 'tipik') {
        s.confidence = 'olası';
        s.rationale = [...s.rationale, 'Muayenede uyarı bulunduğu için "tipik" sayılmadı; uyarıları okuyun.'];
      }
    }
  }

  const negative = !anyNys && vertigoKeys.length === 0 && all.length > 0;
  return { suggestions, warnings, negative, multiCanal: canals.size >= 2 };
}

/**
 * İki taraflı pozitif Dix-Hallpike'ta torsiyon yönünden taraf. Yalnız iki testte de torsiyon kaydedilmiş ve AYNI kulağı
 * gösteriyorsa taraf döner; eksik ya da farklı yönler tahmin edilmez (çift taraflı tutulum olabilir).
 */
export function torsionSide(fR: Finding, fL: Finding): { side: Side | null; reason: string } {
  const tR = fR.torsionToward;
  const tL = fL.torsionToward;
  if (!tR || !tL) {
    return {
      side: null,
      reason: 'Taraf için iki testte de torsiyon yönünü (göz üst kutbunun vurduğu kulak) bulgu formuna girin; aynı kulağı gösteriyorsa o taraf önerilir.'
    };
  }
  if (tR !== tL) {
    return {
      side: null,
      reason: 'Torsiyon her testte alttaki kulağa doğru: gerçek çift taraflı arka kanal tutulumu olası. Taraf önerilmez.'
    };
  }
  return { side: tR, reason: '' };
}

export const MECHANISM_LABEL: Record<Mechanism, string> = {
  canalithiasis: 'kanalolitiazis',
  cupulolithiasis: 'kupulolitiazis',
  unknown: 'mekanizma belirsiz'
};

/** Ev reçetesini kilitleyen bulgu (tanı elle girilse de geçerli). */
export interface RxFindingLock {
  code: 'long-response' | 'multi-canal';
  message: string;
}

/**
 * Bulgulara dayanan ev reçetesi kilidi — onaylı tanının mekanizmasından BAĞIMSIZ. Elle girilen "kanalolitiazis" tanısı,
 * bulgularda ≥1 dk süren pozisyonel nistagmus varken kilidi açmaz: kupulolitiazis/santral nedenler düşünülür ve evde güvenlik
 * kuralı (2 dk) hastayı her manevrada hekime yönlendirir (Bárány 2015; AAO-HNSF 2017). Çok kanallı tutulumda da reçete yok.
 * Tekrar test bulguları da denetlenir (manevradan sonra ortaya çıkan uzun yanıt).
 */
export function rxFindingLock(findings: Findings, retestFindings: Findings = {}): RxFindingLock | null {
  for (const [src, fx] of [
    ['', findings],
    ['Tekrar test · ', retestFindings]
  ] as const) {
    for (const [k, f] of Object.entries(fx) as [FindingKey, Finding | undefined][]) {
      if (f && f.nystagmus !== 'none' && isLong(f)) {
        return {
          code: 'long-response',
          message: `${src}${keyLabel(k)}: nistagmus ${f.durationSec} s sürdü (≥1 dk). Kupulolitiazis ya da santral pozisyonel nistagmus düşünülür; evde güvenlik kuralı hastayı her manevrada hekime yönlendirir. Tanı elle değiştirilse de ev reçetesi verilmez; tedaviyi klinikte yapın.`
        };
      }
    }
  }
  if (suggestDiagnosis(findings).multiCanal || (Object.keys(retestFindings).length > 0 && suggestDiagnosis(retestFindings).multiCanal)) {
    return {
      code: 'multi-canal',
      message:
        'Bulgular çok kanallı tutulumu düşündürüyor. Kendi kendine tedavi çalışmaları bu hastaları dışlamıştır; ev reçetesi verilmez, tedaviyi klinikte yapın.'
    };
  }
  return null;
}

export function keyLabel(k: FindingKey): string {
  switch (k) {
    case 'dhR':
      return 'Sağ Dix-Hallpike';
    case 'dhL':
      return 'Sol Dix-Hallpike';
    case 'rollR':
      return 'Sırtüstü baş sağa (roll)';
    case 'rollL':
      return 'Sırtüstü baş sola (roll)';
    case 'rollCenter':
      return 'Sırtüstü nötr';
  }
}

function cap(s: string): string {
  return s.charAt(0).toLocaleUpperCase('tr-TR') + s.slice(1);
}
