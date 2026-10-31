import { useLayoutEffect, useState, type ReactNode } from 'react';
import { Speech, speech } from '../../platform/speech';
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

/** Sesli okuma gerçekten çalışacak mı (kapalıysa ya da tarayıcıda yoksa okuma kilidi uygulanmaz). */
function speechOn(): boolean {
  return speech.enabled && Speech.supported();
}

/** İlk okunuş kilidinin üst sınırı: soru sesi bundan uzun sürse de düğmeler açılır. */
export const FIRST_READ_LOCK_MAX_MS = 2500;

/**
 * Soruyu `lockKey` değişince bir kez okur ve okuma sürerken true döner: ses bitene ya da en çok `maxMs`'ye dek (hangisi
 * önce). Ses kapalıysa okuma yoktur, kilit de yoktur. "Tekrar dinle" kilitlemez (yalnız ilk okunuş).
 */
export function useReadLock(
  lockKey: string | number | undefined,
  text: string | undefined,
  priority: 'high' | 'normal' = 'high',
  maxMs: number = FIRST_READ_LOCK_MAX_MS
): boolean {
  const [reading, setReading] = useState(() => lockKey !== undefined && !!text && speechOn());
  useLayoutEffect(() => {
    if (lockKey === undefined || !text) {
      setReading(false);
      return;
    }
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      setReading(false);
    };
    const on = speechOn();
    setReading(on);
    const t = on ? setTimeout(finish, maxMs) : undefined;
    speech.speak(text, priority, finish);
    return () => {
      // Eski okunuşun bitişi (ör. yeni soru onu keserken) yeni sorunun kilidini açmasın.
      done = true;
      if (t) clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lockKey, text]);
  return reading;
}

/**
 * Son seçilen yanıt düğmesinin ekrandaki yeri (görünür alana göre). "Doğru mu?" onay ekranı "Yanlış dokundum" düğmesini
 * tam bu yere koyar: aynı yere ikinci kör dokunuş onay değil geri dönüş olsun (kullanıcı turu 2, k06).
 */
let lastTap: { top: number; height: number; at: number } | null = null;

function rememberTap(el: Element) {
  const r = el.getBoundingClientRect();
  lastTap = { top: r.top, height: r.height, at: Date.now() };
}

/** Son dokunuşun yeri (eskiyse ya da yoksa null). Silinmez: StrictMode'da iki kez çağrılan başlatıcı aynı sonucu alsın. */
export function takeTapRect(maxAgeMs = 3000): { top: number; height: number } | null {
  const t = lastTap;
  return t && Date.now() - t.at <= maxAgeMs ? { top: t.top, height: t.height } : null;
}

/** Seçenekli soru ekranının sesli metni: başlık ve sırayla seçenekler ("Birinci: … İkinci: …"). */
const ORDINALS = ['Birinci', 'İkinci', 'Üçüncü', 'Dördüncü', 'Beşinci', 'Altıncı'];
export function choiceSpeech(title: string, options: string[]): string {
  return [title, ...options.map((o, i) => `${ORDINALS[i] ?? `${i + 1}.`}: ${o.replace(/\.+$/, '')}.`)].join(' ');
}

/**
 * Büyük "Tekrar dinle" düğmesi: metni baştan (öncekini keserek) okur. Ses kapalı/yoksa görünmez. Ekran açılınca kısa hâl
 * okunuyorsa burada tam hâl verilir; etiket o zaman "Ayrıntıyı dinle" olabilir (kullanıcı turu 3).
 */
export function ListenAgain({ text, testid = 'listen-again', label = 'Tekrar dinle' }: { text: string; testid?: string; label?: string }) {
  if (!speech.enabled) return null;
  return (
    <button type="button" className="btn secondary block" onClick={() => speech.speak(text, 'high')} data-testid={testid}>
      <Icon name="volume" /> {label}
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
  lockMs = 800,
  hushOnAnswer
}: {
  options: { value: T; label: ReactNode; sub?: ReactNode }[];
  value: T | null | undefined;
  onChange: (v: T) => void;
  name: string;
  lockKey?: string | number;
  lockMs?: number;
  /** Seçim yapılınca ekranın okunuşu kesilsin (kalan seçenekler yanıttan sonra okunmasın). */
  hushOnAnswer?: boolean;
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
          onClick={(e) => {
            if (locked) return;
            rememberTap(e.currentTarget);
            if (hushOnAnswer) speech.cancel();
            onChange(o.value);
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
 * bir sonraki soruyu okunmadan yanıtlamasın. `speak` verilirse soru (lockKey değişince) bir kez okunur ve ilk okunuşta
 * düğmeler ses bitene ya da en çok 2,5 s'ye dek de kilitli kalır (kullanıcı turu 2, k05); yanıt verilince okuma kesilir.
 * `readLock={false}`: soru yine okunur ama okuma kilidi uygulanmaz (bu kişi aynı metni daha önce yanıtladı; kullanıcı
 * turu 3, k06). Çift dokunuş kilidi (`lockMs`) her durumda kalır.
 */
export function YesNo({
  onAnswer,
  value,
  yesLabel = 'Evet',
  noLabel = 'Hayır',
  lockKey,
  lockMs = 600,
  speak,
  readLock = true
}: {
  onAnswer: (v: 'yes' | 'no') => void;
  value?: 'yes' | 'no';
  yesLabel?: string;
  noLabel?: string;
  lockKey?: string | number;
  lockMs?: number;
  /** İlk okunuşta okunacak metin (okuma kilidi ve yanıtta susturma). */
  speak?: string;
  /** Okuma sürerken de kilitle (varsayılan). false: yalnız çift dokunuş kilidi. */
  readLock?: boolean;
}) {
  const tapLocked = useTapLock(lockKey, lockMs);
  const reading = useReadLock(speak === undefined ? undefined : lockKey, speak);
  const locked = tapLocked || (readLock && reading);
  const click = (v: 'yes' | 'no', el: Element) => {
    if (locked) return;
    rememberTap(el);
    if (speak !== undefined) speech.cancel();
    onAnswer(v);
  };
  return (
    <div className="yesno" data-locked={locked || undefined} style={locked ? LOCKED_STYLE : undefined}>
      <button
        type="button"
        className={`btn xl ${value === 'yes' ? 'primary' : 'secondary'}`}
        aria-pressed={value === 'yes'}
        aria-disabled={locked || undefined}
        onClick={(e) => click('yes', e.currentTarget)}
        data-testid="yn-yes"
      >
        {yesLabel}
      </button>
      <button
        type="button"
        className={`btn xl ${value === 'no' ? 'primary' : 'secondary'}`}
        aria-pressed={value === 'no'}
        aria-disabled={locked || undefined}
        onClick={(e) => click('no', e.currentTarget)}
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
