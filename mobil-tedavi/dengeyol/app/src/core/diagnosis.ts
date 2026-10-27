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
}

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

/** Bárány ölçütü: kanalitiyazis nistagmusu < 1 dk sürer. */
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
      'Sırtüstü nötr pozisyonda nistagmus var. Yatay kanal kupulolitiyazisinde "boş nokta" bulgusu olabilir; spontan nistagmus ise santral/periferik vestibülopati açısından değerlendirin.'
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
    const typical = !cupulo && f.durationSec !== null && (f.latencySec === null || f.latencySec <= 20);
    suggestions.push({
      canal: 'PC',
      side,
      mechanism: cupulo ? 'cupulolithiasis' : f.durationSec === null ? 'unknown' : 'canalithiasis',
      confidence: typical ? 'tipik' : 'olası',
      label: cupulo
        ? `${cap(sideLabel(side))} arka kanal BPPV — kupulolitiyazis (olası)`
        : `${cap(sideLabel(side))} arka kanal BPPV (kanalitiyazis)`,
      rationale,
      maneuvers: maneuversFor('PC', 'canalithiasis')
    });
    if (f.latencySec === 0 && !cupulo) {
      warnings.push('Arka kanal deseni gecikmesiz başladı; tipik BPPV gecikmeli (1–20 s) başlar. Santral nedenleri gözden kaçırmayın.');
    }
  } else if (pcSides.length === 2) {
    suggestions.push({
      canal: 'PC',
      side: null,
      mechanism: 'unknown',
      confidence: 'belirsiz',
      label: 'İki taraflı Dix-Hallpike pozitif (çift taraflı arka kanal ya da yanıltıcı yanıt)',
      rationale: [
        'Her iki Dix-Hallpike testinde de yukarı vuran + torsiyonel nistagmus.',
        'Torsiyonun yönüne ve yanıtın şiddetine göre taraf belirleyin; çift taraflı tutulumda önce daha şiddetli taraf tedavi edilir.'
      ],
      maneuvers: maneuversFor('PC', 'canalithiasis')
    });
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
      let side: Side | null = null;
      if (iR !== iL) {
        // Geotropik: güçlü taraf hasta. Apogeotropik: zayıf taraf hasta.
        if (geo) side = iR > iL ? 'R' : 'L';
        else side = iR < iL ? 'R' : 'L';
      }
      const bothSides = !!horizR && !!horizL;
      const longAny = [rR, rL].some((f) => f && isLong(f));
      const mech: Mechanism = geo ? 'canalithiasis' : 'cupulolithiasis';
      const rationale = [
        `Supine roll: ${geo ? 'geotropik' : 'apogeotropik'} yatay nistagmus${bothSides ? ' (iki tarafta)' : ' (tek tarafta)'}.`,
        `Şiddet sağ ${iR}/3, sol ${iL}/3 → ${side ? `${geo ? 'güçlü' : 'zayıf'} taraf ${sideLabel(side)}` : 'taraf belirlenemedi (eşit şiddet)'}.`
      ];
      if (geo && longAny) rationale.push('Geotropik nistagmus ≥1 dk sürdü (tipik değil; hafif kupula / "light cupula" ayırıcı tanısı).');
      if (!geo && !longAny) rationale.push('Apogeotropik nistagmus genellikle ≥1 dk sürer; süre kısa ise ön kol kanalitiyazisi olabilir.');
      suggestions.push({
        canal: 'HC',
        side,
        mechanism: mech,
        confidence: side && bothSides ? 'tipik' : side ? 'olası' : 'belirsiz',
        label: side
          ? `${cap(sideLabel(side))} yatay kanal BPPV — ${geo ? 'geotropik (kanalitiyazis)' : 'apogeotropik (kupulolitiyazis)'}`
          : `Yatay kanal BPPV — ${geo ? 'geotropik' : 'apogeotropik'}, taraf belirsiz`,
        rationale: side
          ? rationale
          : [...rationale, 'Tarafı belirlemek için ek testler (eğilme-öne eğilme / bow and lean, yatma nistagmusu) kullanın.'],
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
        'Bárány ölçütlerinde "olası BPPV" kategorisi. Klinik karara göre semptomatik tarafa manevra düşünülebilir.'
      ],
      maneuvers: side ? maneuversFor('PC', 'unknown') : []
    });
  }

  const negative = !anyNys && vertigoKeys.length === 0 && all.length > 0;
  return { suggestions, warnings, negative };
}

export function keyLabel(k: FindingKey): string {
  switch (k) {
    case 'dhR':
      return 'Sağ Dix-Hallpike';
    case 'dhL':
      return 'Sol Dix-Hallpike';
    case 'rollR':
      return 'Supine roll sağ';
    case 'rollL':
      return 'Supine roll sol';
    case 'rollCenter':
      return 'Sırtüstü nötr';
  }
}

function cap(s: string): string {
  return s.charAt(0).toLocaleUpperCase('tr-TR') + s.slice(1);
}
