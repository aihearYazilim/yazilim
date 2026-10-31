import { useLayoutEffect, useState, type ReactNode } from 'react';
import { speech } from '../../platform/speech';
import { Icon } from './Icon';

/** Kilit süresince düğmeler soluk görünür: dokunuşun neden boşa gittiği anlaşılsın. */
const LOCKED_STYLE = { opacity: 0.55, transition: 'opacity 0.2s' } as const;

/**
 * Dokunuş kilidi: `lockKey` değişince (yeni soru/ekran) `lockMs` boyunca true. Titreyen el ya da çift dokunuşun ikincisi
 * bir sonraki soruyu okunmadan yanıtlamasın. lockKey undefined → kilit yok.
 */
export function useTapLock(lockKey: string | number | undefined, lockMs: number): boolean {
  const [locked, setLocked] = useState(lockKey !== undefined);
  // Boyamadan önce kilitlenir: yeni soru ekranda görünürken arada kilitsiz bir an kalmasın.
  useLayoutEffect(() => {
    if (lockKey === undefined) return;
    setLocked(true);
    const t = setTimeout(() => setLocked(false), lockMs);
    return () => clearTimeout(t);
  }, [lockKey, lockMs]);
  return locked;
}

/** Seçenekli soru ekranının sesli metni: başlık ve sırayla seçenekler ("Birinci: … İkinci: …"). */
const ORDINALS = ['Birinci', 'İkinci', 'Üçüncü', 'Dördüncü', 'Beşinci', 'Altıncı'];
export function choiceSpeech(title: string, options: string[]): string {
  return [title, ...options.map((o, i) => `${ORDINALS[i] ?? `${i + 1}.`}: ${o.replace(/\.+$/, '')}.`)].join(' ');
}

/** Büyük "Tekrar dinle" düğmesi: metni baştan (öncekini keserek) okur. Ses kapalı/yoksa görünmez. */
export function ListenAgain({ text, testid = 'listen-again' }: { text: string; testid?: string }) {
  if (!speech.enabled) return null;
  return (
    <button type="button" className="btn secondary block" onClick={() => speech.speak(text, 'high')} data-testid={testid}>
      <Icon name="volume" /> Tekrar dinle
    </button>
  );
}

/**
 * Seçenek listesi. `lockKey` verilirse Evet/Hayır'daki gibi yeni ekranda `lockMs` boyunca dokunuş kilidi (çift dokunuşun
 * ikincisi sonraki soruyu görmeden yanıtlamasın).
 */
export function Choice<T extends string>({
  options,
  value,
  onChange,
  name,
  lockKey,
  lockMs = 800
}: {
  options: { value: T; label: ReactNode; sub?: ReactNode }[];
  value: T | null | undefined;
  onChange: (v: T) => void;
  name: string;
  lockKey?: string | number;
  lockMs?: number;
}) {
  const locked = useTapLock(lockKey, lockMs);
  return (
    <div className="choices" role="radiogroup" aria-label={name} data-locked={locked || undefined} style={locked ? LOCKED_STYLE : undefined}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          aria-disabled={locked || undefined}
          className="choice"
          onClick={() => {
            if (!locked) onChange(o.value);
          }}
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
  const locked = useTapLock(lockKey, lockMs);
  const click = (v: 'yes' | 'no') => {
    if (!locked) onAnswer(v);
  };
  return (
    <div className="yesno" data-locked={locked || undefined} style={locked ? LOCKED_STYLE : undefined}>
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
