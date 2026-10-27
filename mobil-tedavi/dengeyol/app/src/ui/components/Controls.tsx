import type { ReactNode } from 'react';

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

export function YesNo({ onAnswer, value }: { onAnswer: (v: 'yes' | 'no') => void; value?: 'yes' | 'no' }) {
  return (
    <div className="yesno">
      <button
        type="button"
        className={`btn xl ${value === 'yes' ? 'primary' : 'secondary'}`}
        aria-pressed={value === 'yes'}
        onClick={() => onAnswer('yes')}
      >
        Evet
      </button>
      <button
        type="button"
        className={`btn xl ${value === 'no' ? 'primary' : 'secondary'}`}
        aria-pressed={value === 'no'}
        onClick={() => onAnswer('no')}
      >
        Hayır
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
  value: T;
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
    <div className="steps-dots" aria-label={`Adım ${index + 1} / ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={i < index ? 'done' : i === index ? 'now' : ''} />
      ))}
    </div>
  );
}
