import { useState } from 'react';
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

type TriState = 'yes' | 'no' | 'unset';
const toTri = (b: boolean | undefined): TriState => (b === undefined ? 'unset' : b ? 'yes' : 'no');
const fromTri = (t: TriState): boolean | undefined => (t === 'unset' ? undefined : t === 'yes');

export function FindingForm({
  title,
  initial,
  showIntensity,
  dixHallpike,
  defaultMethod,
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
  onSave: (f: Finding) => void;
  onCancel?: () => void;
}) {
  const [nys, setNys] = useState<NystagmusType | null>(initial.nystagmusUnset ? null : initial.nystagmus);
  const [lat, setLat] = useState(initial.latencySec?.toString() ?? '');
  const [dur, setDur] = useState(initial.durationSec?.toString() ?? '');
  // Şiddet yatay kanalda tarafı belirler: nistagmus varken boş bırakılamaz (unutulan 0, apogeotropikte yanlış taraf seçtirirdi).
  const [intensity, setIntensity] = useState<1 | 2 | 3 | null>(initial.intensity === 0 ? null : initial.intensity);
  const [vertigo, setVertigo] = useState(initial.vertigo);
  const [torsion, setTorsion] = useState<Side | 'unset'>(initial.torsionToward ?? 'unset');
  const [fatigue, setFatigue] = useState<TriState>(toTri(initial.fatigue));
  const [reversal, setReversal] = useState<TriState>(toTri(initial.reversalOnSitting));
  const [method, setMethod] = useState<ObservationMethod | null>(initial.method ?? defaultMethod ?? null);
  const [note, setNote] = useState(initial.note ?? '');
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
    onSave(f);
  };

  return (
    <div className="card stack" data-testid="finding-form">
      <h2>{title}</h2>
      <div className="field">
        <label>Nistagmus</label>
        <Choice
          name="Nistagmus"
          value={nys}
          onChange={setNys}
          options={ORDER.map((t) => ({ value: t, label: NYSTAGMUS_LABEL[t] }))}
        />
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
          <label>Şiddet (zorunlu: yatay kanalda taraf iki tarafın şiddeti karşılaştırılarak belirlenir)</label>
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
      <div className="row sticky-actions">
        <button className="btn primary grow" disabled={!valid} onClick={save} data-testid="finding-save">
          Kaydet
        </button>
        {onCancel && (
          <button className="btn secondary" onClick={onCancel}>
            Vazgeç
          </button>
        )}
      </div>
    </div>
  );
}
