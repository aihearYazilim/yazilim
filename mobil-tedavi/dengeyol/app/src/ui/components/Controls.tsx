import { useEffect, useState, type ReactNode } from 'react';

export function Choice<T extends string>({
  options,
  value,
  onChange,
  name
}: {
  options: { value: T; label: ReactNode; sub?: ReactNode }[];
  value: T | null | undefined;
  onChange: (v: T) => void;
  name: string;
}) {
  return (
    <div className="choices" role="radiogroup" aria-label={name}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          className="choice"
          onClick={() => onChange(o.value)}
        >
          <span className="dot" />
          <span>
            {o.label}
            {o.sub && <span className="sub">{o.sub}</span>}
          </span>
        </button>
      ))}
    </div>
  );
}

export function CheckList({
  options,
  values,
  onToggle
}: {
  options: { value: string; label: ReactNode }[];
  values: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="choices">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="checkbox"
          aria-checked={values.includes(o.value)}
          className="choice check"
          onClick={() => onToggle(o.value)}
        >
          <span className="dot" />
          <span>{o.label}</span>
        </button>
      ))}
    </div>
  );
}

/**
 * Evet/Hayır düğmeleri. `lockKey` değişince düğmeler `lockMs` boyunca pasif kalır: titreyen el ya da çift dokunuş
 * bir sonraki soruyu okunmadan yanıtlamasın.
 */
export function YesNo({
  onAnswer,
  value,
  yesLabel = 'Evet',
  noLabel = 'Hayır',
  lockKey,
  lockMs = 600
}: {
  onAnswer: (v: 'yes' | 'no') => void;
  value?: 'yes' | 'no';
  yesLabel?: string;
  noLabel?: string;
  lockKey?: string | number;
  lockMs?: number;
}) {
  const [locked, setLocked] = useState(lockKey !== undefined);
  useEffect(() => {
    if (lockKey === undefined) return;
    setLocked(true);
    const t = setTimeout(() => setLocked(false), lockMs);
    return () => clearTimeout(t);
  }, [lockKey, lockMs]);
  const click = (v: 'yes' | 'no') => {
    if (!locked) onAnswer(v);
  };
  return (
    <div className="yesno" data-locked={locked || undefined}>
      <button
        type="button"
        className={`btn xl ${value === 'yes' ? 'primary' : 'secondary'}`}
        aria-pressed={value === 'yes'}
        aria-disabled={locked || undefined}
        onClick={() => click('yes')}
        data-testid="yn-yes"
      >
        {yesLabel}
      </button>
      <button
        type="button"
        className={`btn xl ${value === 'no' ? 'primary' : 'secondary'}`}
        aria-pressed={value === 'no'}
        aria-disabled={locked || undefined}
        onClick={() => click('no')}
        data-testid="yn-no"
      >
        {noLabel}
      </button>
    </div>
  );
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  label
}: {
  options: { value: T; label: string }[];
  /** null → hiçbiri seçili değil. */
  value: T | null;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={String(o.value)} type="button" aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function StepDots({ total, index }: { total: number; index: number }) {
  return (
    <div className="steps-dots" role="img" aria-label={`Adım ${index + 1} / ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={i < index ? 'done' : i === index ? 'now' : ''} />
      ))}
    </div>
  );
}
