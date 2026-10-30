import { useState } from 'react';
import { type Finding, NYSTAGMUS_LABEL, type NystagmusType } from '../../../core/diagnosis';
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

export function FindingForm({
  title,
  initial,
  showIntensity,
  onSave,
  onCancel
}: {
  title: string;
  initial: Finding & { nystagmusUnset?: boolean };
  showIntensity: boolean;
  onSave: (f: Finding) => void;
  onCancel?: () => void;
}) {
  const [nys, setNys] = useState<NystagmusType | null>(initial.nystagmusUnset ? null : initial.nystagmus);
  const [lat, setLat] = useState(initial.latencySec?.toString() ?? '');
  const [dur, setDur] = useState(initial.durationSec?.toString() ?? '');
  // Şiddet yatay kanalda tarafı belirler: nistagmus varken boş bırakılamaz (unutulan 0, apogeotropikte yanlış taraf seçtirirdi).
  const [intensity, setIntensity] = useState<1 | 2 | 3 | null>(initial.intensity === 0 ? null : initial.intensity);
  const [vertigo, setVertigo] = useState(initial.vertigo);
  const num = (s: string) => (s.trim() === '' ? null : Math.max(0, Math.round(Number(s))));
  const needIntensity = showIntensity && nys !== null && nys !== 'none';
  const valid =
    nys !== null &&
    (lat === '' || Number.isFinite(Number(lat))) &&
    (dur === '' || Number.isFinite(Number(dur))) &&
    (!needIntensity || intensity !== null);

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
      <label className="row">
        <input type="checkbox" checked={vertigo} onChange={(e) => setVertigo(e.target.checked)} />
        <span>Hasta baş dönmesi bildirdi</span>
      </label>
      <div className="row sticky-actions">
        <button
          className="btn primary grow"
          disabled={!valid}
          onClick={() =>
            onSave({
              nystagmus: nys!,
              latencySec: nys === 'none' ? null : num(lat),
              durationSec: nys === 'none' ? null : num(dur),
              intensity: nys === 'none' ? 0 : showIntensity ? (intensity ?? 0) : 0,
              vertigo
            })
          }
          data-testid="finding-save"
        >
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
