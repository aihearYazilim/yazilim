import { describe, expect, it } from 'vitest';
import { buildIcs, extractRxToken } from './reminders';

describe('hatırlatıcı ve reçete bağlantısı', () => {
  it('ics dosyası alarm içerir ve virgülleri kaçışlar', () => {
    const ics = buildIcs(Date.UTC(2026, 9, 29, 6, 0), 'DengeYol: sabah testi', 'Test, 1 dk');
    expect(ics).toContain('DTSTART:20261029T060000Z');
    expect(ics).toContain('BEGIN:VALARM');
    expect(ics).toContain('Test\\, 1 dk');
  });
  it('bağlantıdan ya da koddan reçete kodu çıkarılır', () => {
    expect(extractRxToken('https://x.org/app/#/recete/eyJ2IjoxfQ.1a2b3c')).toBe('eyJ2IjoxfQ.1a2b3c');
    expect(extractRxToken('  eyJ2IjoxfQ.1a2b3c ')).toBe('eyJ2IjoxfQ.1a2b3c');
    expect(extractRxToken('merhaba')).toBeNull();
  });
});
