/** Satır içi SVG ikonlar (harici ikon kütüphanesi yok; çevrimdışı çalışır). */
const P: Record<string, string> = {
  back: 'M15 18l-6-6 6-6',
  close: 'M18 6L6 18M6 6l12 12',
  settings:
    'M12 15a3 3 0 100-6 3 3 0 000 6zm7.4-3a7.4 7.4 0 00-.1-1.2l2-1.6-2-3.4-2.4 1a7.5 7.5 0 00-2-1.2L14.5 3h-4l-.4 2.6a7.5 7.5 0 00-2 1.2l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 000 2.4l-2 1.6 2 3.4 2.4-1a7.5 7.5 0 002 1.2l.4 2.6h4l.4-2.6a7.5 7.5 0 002-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z',
  info: 'M12 22a10 10 0 100-20 10 10 0 000 20zm0-14h.01M11 12h1v5h1',
  alert: 'M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z',
  check: 'M20 6L9 17l-5-5',
  phone: 'M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1.9.4 1.8.7 2.7a2 2 0 01-.5 2.1L8 9.8a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.4c.9.3 1.8.6 2.7.7a2 2 0 011.7 2z',
  play: 'M6 4l14 8-14 8V4z',
  pause: 'M7 4h3v16H7zM14 4h3v16h-3z',
  stop: 'M6 6h12v12H6z',
  user: 'M20 21a8 8 0 10-16 0M12 13a4 4 0 100-8 4 4 0 000 8z',
  steth: 'M6 3v6a5 5 0 0010 0V3M11 14v2a5 5 0 0010 0v-3M21 11a2 2 0 100 4 2 2 0 000-4z',
  history: 'M3 12a9 9 0 103-6.7L3 8M3 3v5h5M12 7v5l4 2',
  qr: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3zM20 14v.01M14 20h.01M17 17h4v4h-4',
  print: 'M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z',
  share: 'M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13',
  plus: 'M12 5v14M5 12h14',
  trash: 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6',
  volume: 'M11 5L6 9H2v6h4l5 4V5zM15.5 8.5a5 5 0 010 7M19 5a10 10 0 010 14',
  head: 'M12 2a7 7 0 00-7 7c0 2.4 1 4 2 5.2V20h7v-2h2a2 2 0 002-2v-3l1.5-.5L18 10a7 7 0 00-6-8z',
  bed: 'M3 7v12M21 19v-7a3 3 0 00-3-3H10v7M3 16h18M7 12a2 2 0 100-4 2 2 0 000 4z',
  copy: 'M9 9h11v11H9zM5 15H4V4h11v1',
  chevron: 'M9 18l6-6-6-6',
  calendar: 'M3 5h18v16H3zM16 3v4M8 3v4M3 10h18',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z',
  timer: 'M12 22a8 8 0 100-16 8 8 0 000 16zM12 10v4l2 2M9 2h6'
};

export function Icon({ name, size = 24, stroke = 2, title }: { name: keyof typeof P | string; size?: number; stroke?: number; title?: string }) {
  const d = P[name] ?? P.info!;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
    >
      {title && <title>{title}</title>}
      <path d={d} />
    </svg>
  );
}

export function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#14b8a6" />
          <stop offset="1" stopColor="#4f46e5" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#lg)" />
      <path d="M18 40c0-8 6-14 14-14s14 6 14 14" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" />
      <circle cx="32" cy="40" r="4.5" fill="#fff" />
      <path d="M32 14v6M22 17l3 5M42 17l-3 5" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}
