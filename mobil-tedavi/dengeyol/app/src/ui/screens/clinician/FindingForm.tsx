import { useEffect, useState } from 'react';
import { type Finding, NYSTAGMUS_LABEL, type NystagmusType, type ObservationMethod } from '../../../core/diagnosis';
import type { Side } from '../../../core/protocols';
import { Choice, Segmented } from '../../components/Controls';

const ORDER: NystagmusType[] = [
  'none',
  'upbeat-torsional',
  'downbeat-torsional',
  'horizontal-geotropic',
  'horizontal-apogeotropic',
  'downbeat-pure',
  'other'
];

export const emptyFinding = (): Finding => ({ nystagmus: 'none', latencySec: null, durationSec: null, intensity: 0, vertigo: false });

const NOTE_MAX = 200;

/**
 * Her nistagmus tipinin kısa "nasıl görünür" açıklaması (çıplak gözle muayene eden, uzman olmayan hekim için; kullanıcı turu
 * yeni-1, L4-4 / y08). Yön, hastanın gözünün hareketinin hızlı evresidir.
 */
export const NYSTAGMUS_HELP: Record<NystagmusType, string> = {
  none: 'Gözler sabit; ritmik vuruş yok.',
  'upbeat-torsional': 'Göz alına doğru hızlı vurur ve aynı anda döner (üst kutup alttaki kulağa). Gecikmeyle başlar, 1 dakikadan kısa sürer.',
  'downbeat-torsional': 'Göz çeneye doğru vurur ve hafifçe döner.',
  'horizontal-geotropic': 'Göz yana vurur; baş hangi yana dönükse o yana, yere doğru.',
  'horizontal-apogeotropic': 'Göz yana vurur; baş hangi yana dönükse ters yöne, tavana doğru.',
  'downbeat-pure': 'Göz yalnız çeneye doğru vurur, dönme bileşeni yok. Santral nedenleri düşündürür.',
  other: 'Yukarıdakilere uymayan desen: yön değiştiren, saf dönme, pozisyondan bağımsız ya da emin olamadığınız yön.'
};

/** "Emin değilim" kısa yolu nota bu cümleyi yazar (rapor ve HBYS notunda görünür). */
export const UNSURE_NOTE = 'Nistagmus emin değil; hasta baş dönmesi bildirdi.';

type TriState = 'yes' | 'no' | 'unset';
const toTri = (b: boolean | undefined): TriState => (b === undefined ? 'unset' : b ? 'yes' : 'no');
const fromTri = (t: TriState): boolean | undefined => (t === 'unset' ? undefined : t === 'yes');

/**
 * Formun kaydedilmemiş taslağı (yeni kullanıcı turu 2, y08 #1): test sonrası form açıkken sayfa yenilenirse girilenler
 * kaybolmasın. sessionStorage'da tutulur (sekme kapanınca biter); "Kaydet"te silinir.
 */
export interface FindingDraft {
  nys: NystagmusType | null;
  lat: string;
  dur: string;
  intensity: 1 | 2 | 3 | null;
  vertigo: boolean;
  torsion: Side | 'unset';
  fatigue: TriState;
  reversal: TriState;
  method: ObservationMethod | null;
  note: string;
}

export const findingDraftKey = (examId: string, target: string, key: string) => `dengeyol:findingDraft:${examId}:${target}:${key}`;

export function readFindingDraft(key: string): FindingDraft | null {
  try {
    const raw = window.sessionStorage.getItem(key);
    const d = raw ? (JSON.parse(raw) as Partial<FindingDraft>) : null;
    if (!d || typeof d !== 'object') return null;
    if (d.nys !== null && !ORDER.includes(d.nys as NystagmusType)) return null;
    if (typeof d.lat !== 'string' || typeof d.dur !== 'string' || typeof d.vertigo !== 'boolean' || typeof d.note !== 'string') return null;
    return d as FindingDraft;
  } catch {
    return null;
  }
}

function writeFindingDraft(key: string, d: FindingDraft) {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(d));
  } catch {
    /* yazılamadı: taslak yok */
  }
}

export function removeFindingDraft(key: string) {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    /* yok say */
  }
}

export function FindingForm({
  title,
  initial,
  showIntensity,
  dixHallpike,
  defaultMethod,
  draftKey,
  onSave,
  onCancel
}: {
  title: string;
  initial: Finding & { nystagmusUnset?: boolean };
  showIntensity: boolean;
  /** Dix-Hallpike bulgusu mu (oturunca ters nistagmus alanı yalnız bunda). */
  dixHallpike?: boolean;
  /** Bu muayenede daha önce seçilen gözlem yöntemi (her testte yeniden seçilmesin). */
  defaultMethod?: ObservationMethod;
  /** Verilirse kaydedilmemiş giriş bu anahtarla taslak olarak saklanır ve form yeniden açılınca geri yüklenir. */
  draftKey?: string;
  onSave: (f: Finding) => void;
  onCancel?: () => void;
}) {
  // Kaydedilmemiş taslak varsa (sayfa yenilendi) form onunla açılır.
  const [draft] = useState<FindingDraft | null>(() => (draftKey ? readFindingDraft(draftKey) : null));
  const [nys, setNys] = useState<NystagmusType | null>(draft ? draft.nys : initial.nystagmusUnset ? null : initial.nystagmus);
  const [lat, setLat] = useState(draft ? draft.lat : (initial.latencySec?.toString() ?? ''));
  const [dur, setDur] = useState(draft ? draft.dur : (initial.durationSec?.toString() ?? ''));
  // Şiddet yatay kanalda tarafı belirler: nistagmus varken boş bırakılamaz (unutulan 0, apogeotropikte yanlış taraf seçtirirdi).
  const [intensity, setIntensity] = useState<1 | 2 | 3 | null>(draft ? (draft.intensity ?? null) : initial.intensity === 0 ? null : initial.intensity);
  const [vertigo, setVertigo] = useState(draft ? draft.vertigo : initial.vertigo);
  const [torsion, setTorsion] = useState<Side | 'unset'>(draft?.torsion ?? initial.torsionToward ?? 'unset');
  const [fatigue, setFatigue] = useState<TriState>(draft?.fatigue ?? toTri(initial.fatigue));
  const [reversal, setReversal] = useState<TriState>(draft?.reversal ?? toTri(initial.reversalOnSitting));
  const [method, setMethod] = useState<ObservationMethod | null>(draft ? (draft.method ?? null) : (initial.method ?? defaultMethod ?? null));
  const [note, setNote] = useState(draft ? draft.note : (initial.note ?? ''));
  useEffect(() => {
    if (draftKey) writeFindingDraft(draftKey, { nys, lat, dur, intensity, vertigo, torsion, fatigue, reversal, method, note });
  }, [draftKey, nys, lat, dur, intensity, vertigo, torsion, fatigue, reversal, method, note]);
  const naked = (initial.method ?? defaultMethod) === 'çıplak göz';
  /** "Emin değilim, baş dönmesi var": nistagmus yok + baş dönmesi var + not (y08: çıplak gözle torsiyon/tip seçilemedi). */
  const markUnsure = () => {
    setNys('none');
    setVertigo(true);
    if (!note.includes(UNSURE_NOTE)) setNote((n) => (n.trim() ? `${UNSURE_NOTE} ${n.trim()}` : UNSURE_NOTE).slice(0, NOTE_MAX));
  };
  const num = (s: string) => (s.trim() === '' ? null : Math.max(0, Math.round(Number(s))));
  const needIntensity = showIntensity && nys !== null && nys !== 'none';
  const torsional = nys === 'upbeat-torsional' || nys === 'downbeat-torsional';
  const positive = nys !== null && nys !== 'none';
  const valid =
    nys !== null &&
    (lat === '' || Number.isFinite(Number(lat))) &&
    (dur === '' || Number.isFinite(Number(dur))) &&
    (!needIntensity || intensity !== null);
  const hasExtra = initial.fatigue !== undefined || initial.reversalOnSitting !== undefined || !!initial.note;
  // Kaydet kapalıysa nedeni (y08: roll formunda "Şiddet" fark edilmedi).
  const whyDisabled =
    nys === null
      ? 'nistagmus yanıtını seçin'
      : needIntensity && intensity === null
        ? 'şiddeti seçin'
        : !(lat === '' || Number.isFinite(Number(lat))) || !(dur === '' || Number.isFinite(Number(dur)))
          ? 'gecikme ve süreyi sayı olarak yazın'
          : null;
  const unsureBtn = (
    <button type="button" className={`btn ${naked ? 'secondary' : 'ghost'} block`} onClick={markUnsure} data-testid="finding-unsure">
      Emin değilim, hasta baş dönmesi bildirdi
    </button>
  );

  const save = () => {
    const f: Finding = {
      nystagmus: nys!,
      latencySec: nys === 'none' ? null : num(lat),
      durationSec: nys === 'none' ? null : num(dur),
      intensity: nys === 'none' ? 0 : showIntensity ? (intensity ?? 0) : 0,
      vertigo
    };
    // İsteğe bağlı alanlar yalnız anlamlı olduklarında yazılır (ör. nistagmus yokken torsiyon/yorulma kaydedilmez).
    if (torsional && torsion !== 'unset') f.torsionToward = torsion;
    const fat = fromTri(fatigue);
    if (positive && fat !== undefined) f.fatigue = fat;
    const rev = fromTri(reversal);
    if (positive && dixHallpike && rev !== undefined) f.reversalOnSitting = rev;
    if (method) f.method = method;
    const n = note.trim().slice(0, NOTE_MAX);
    if (n) f.note = n;
    if (draftKey) removeFindingDraft(draftKey);
    onSave(f);
  };

  return (
    <div className="card stack" data-testid="finding-form">
      <h2>{title}</h2>
      <div className="field">
        <label>Nistagmus</label>
        {/* Çıplak gözle muayenede "emin değilim" kısa yolu listenin önünde (y08). */}
        {naked && unsureBtn}
        <Choice
          name="Nistagmus"
          value={nys}
          onChange={setNys}
          options={ORDER.map((t) => ({ value: t, label: NYSTAGMUS_LABEL[t] }))}
        />
        <details className="small" data-testid="finding-help">
          <summary>Nasıl görünür?</summary>
          <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
            {ORDER.map((t) => (
              <li key={t}>
                <strong>{NYSTAGMUS_LABEL[t]}:</strong> {NYSTAGMUS_HELP[t]}
              </li>
            ))}
          </ul>
        </details>
        {!naked && unsureBtn}
      </div>
      {nys !== 'none' && (
        <div className="row">
          <div className="field grow">
            <label htmlFor="lat">Gecikme (s)</label>
            <input id="lat" className="input" inputMode="numeric" value={lat} onChange={(e) => setLat(e.target.value)} />
          </div>
          <div className="field grow">
            <label htmlFor="dur">Süre (s)</label>
            <input id="dur" className="input" inputMode="numeric" value={dur} onChange={(e) => setDur(e.target.value)} />
          </div>
        </div>
      )}
      {showIntensity && nys !== 'none' && (
        <div className="field">
          <label>Şiddet (zorunlu)</label>
          <p className="small muted" style={{ margin: 0 }} data-testid="finding-intensity-help">
            Nistagmusun (göremediyseniz hastanın baş dönmesinin) yoğunluğu. İki yanı birbirine göre puanlayın: yatay kanalda taraf iki yanın şiddeti
            karşılaştırılarak belirlenir.
          </p>
          <Segmented
            label="Şiddet"
            value={intensity}
            onChange={setIntensity}
            options={[
              { value: 1, label: '1 hafif' },
              { value: 2, label: '2 orta' },
              { value: 3, label: '3 güçlü' }
            ]}
          />
        </div>
      )}
      {torsional && (
        <div className="field" data-testid="finding-torsion">
          <label>Torsiyon: göz üst kutbu hastanın hangi kulağına vuruyor? (isteğe bağlı)</label>
          <Segmented
            label="Torsiyon yönü"
            value={torsion}
            onChange={setTorsion}
            options={[
              { value: 'R', label: 'Sağ kulağa' },
              { value: 'L', label: 'Sol kulağa' },
              { value: 'unset', label: 'Belirlenmedi' }
            ]}
          />
          {nys === 'upbeat-torsional' && (
            <p className="small muted">
              Arka kanal BPPV'de üst kutup alttaki (etkilenen) kulağa vurur (Bárány 2015). İki Dix-Hallpike de pozitifse taraf önerisi bu alana dayanır.
            </p>
          )}
        </div>
      )}
      <label className="row">
        <input type="checkbox" checked={vertigo} onChange={(e) => setVertigo(e.target.checked)} />
        <span>Hasta baş dönmesi bildirdi</span>
      </label>
      <div className="field">
        <label>Gözlem yöntemi</label>
        <Segmented
          label="Gözlem yöntemi"
          value={method}
          onChange={setMethod}
          options={[
            { value: 'VNG', label: 'VNG' },
            { value: 'Frenzel', label: 'Frenzel' },
            { value: 'çıplak göz', label: 'Çıplak göz' }
          ]}
        />
      </div>
      <details className="small" open={hasExtra} data-testid="finding-extra">
        <summary>Ek bulgular ve not (isteğe bağlı)</summary>
        <div className="stack" style={{ marginTop: 8 }}>
          {positive && (
            <div className="field">
              <label>Tekrarlamada yorulma</label>
              <Segmented
                label="Yorulma"
                value={fatigue}
                onChange={setFatigue}
                options={[
                  { value: 'yes', label: 'Yoruldu' },
                  { value: 'no', label: 'Yorulmadı' },
                  { value: 'unset', label: 'Değerlendirilmedi' }
                ]}
              />
            </div>
          )}
          {positive && dixHallpike && (
            <div className="field">
              <label>Oturunca ters yönlü nistagmus</label>
              <Segmented
                label="Oturunca ters nistagmus"
                value={reversal}
                onChange={setReversal}
                options={[
                  { value: 'yes', label: 'Var' },
                  { value: 'no', label: 'Gözlenmedi' },
                  { value: 'unset', label: 'Değerlendirilmedi' }
                ]}
              />
            </div>
          )}
          <div className="field">
            <label htmlFor="fnote">Serbest not (en fazla {NOTE_MAX} karakter)</label>
            <textarea
              id="fnote"
              className="input"
              rows={2}
              maxLength={NOTE_MAX}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              data-testid="finding-note"
            />
          </div>
        </div>
      </details>
      {/* Sabit "Kaydet" çubuğu son seçeneği ve alan başlıklarını örtmesin (y08). */}
      <div aria-hidden="true" style={{ height: 24 }} />
      <div className="sticky-actions stack" style={{ gap: 4 }}>
        <div className="row">
          <button className="btn primary grow" disabled={!valid} onClick={save} data-testid="finding-save">
            Kaydet
          </button>
          {onCancel && (
            <button className="btn secondary" onClick={onCancel}>
              Vazgeç
            </button>
          )}
        </div>
        {whyDisabled && (
          <p className="small muted" style={{ margin: 0 }} data-testid="finding-save-why">
            Kaydetmek için {whyDisabled}.
          </p>
        )}
      </div>
    </div>
  );
}
