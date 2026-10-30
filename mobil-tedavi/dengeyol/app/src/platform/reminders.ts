/**
 * Sunucusuz hatırlatıcı: takvim dosyası (.ics). Telefonun takvim uygulaması açılır ve alarmı kendisi çalar;
 * bildirim izni, hesap ya da push sunucusu gerekmez.
 */
function icsDate(t: number): string {
  return new Date(t).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/** RFC 5545 TEXT kaçışı: ters bölü, noktalı virgül, virgül ve satır sonu. */
function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

/** RFC 5545 satır katlama: 75 oktetten uzun satırlar CRLF + boşlukla bölünür (UTF-8 karakterleri bölünmeden). */
function fold(line: string): string {
  const enc = new TextEncoder();
  const out: string[] = [];
  let cur = '';
  let bytes = 0;
  for (const ch of line) {
    const b = enc.encode(ch).length;
    if (bytes + b > (out.length === 0 ? 75 : 74)) {
      out.push(cur);
      cur = '';
      bytes = 0;
    }
    cur += ch;
    bytes += b;
  }
  out.push(cur);
  return out.join('\r\n ');
}

export function buildIcs(at: number, title: string, description: string, url?: string): string {
  const uidPart = `${at}-${Math.random().toString(36).slice(2, 10)}@dengeyol`;
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DengeYol//TR',
    'BEGIN:VEVENT',
    `UID:${uidPart}`,
    `DTSTAMP:${icsDate(Date.now())}`,
    `DTSTART:${icsDate(at)}`,
    `DTEND:${icsDate(at + 10 * 60 * 1000)}`,
    `SUMMARY:${esc(title)}`,
    `DESCRIPTION:${esc(description + (url ? `\n${url}` : ''))}`,
    ...(url ? [`URL:${url}`] : []),
    'BEGIN:VALARM',
    'TRIGGER:PT0M',
    'ACTION:DISPLAY',
    `DESCRIPTION:${esc(title)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ]
    .map(fold)
    .join('\r\n');
}

export function downloadReminder(at: number, title: string, description: string): void {
  const url = window.location.href.split('#')[0] + '#/hasta';
  const blob = new Blob([buildIcs(at, title, description, url)], { type: 'text/calendar;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'dengeyol-hatirlatici.ics';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

/** Tarayıcıdan kalıcı depolama iste (Safari/Chrome kullanılmayan sitelerin verisini silebilir). */
export function requestPersistentStorage(): void {
  try {
    void navigator.storage?.persist?.().catch(() => undefined);
  } catch {
    /* desteklenmiyor */
  }
}

/** Uygulama ana ekrandan (yüklü) mı açıldı? */
export function isStandalone(): boolean {
  try {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true
    );
  } catch {
    return false;
  }
}

export function isIos(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/** Bağlantıdan ya da çıplak koddan reçete kodunu çıkarır. */
export function extractRxToken(input: string): string | null {
  const t = input.trim();
  if (!t) return null;
  const m = t.match(/#\/recete\/([A-Za-z0-9_\-.]+)/);
  if (m) return m[1]!;
  if (/^[A-Za-z0-9_\-]+\.[0-9a-f]+$/i.test(t)) return t;
  return null;
}
