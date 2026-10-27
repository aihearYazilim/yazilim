/** Basit, tema uyumlu açıklayıcı çizimler. */

export function PhoneOnForehead({ lookUp = false }: { lookUp?: boolean }) {
  const rot = lookUp ? -28 : 0;
  return (
    <svg viewBox="0 0 220 170" className="illus" role="img" aria-label="Telefon alna, ekran dışa bakacak şekilde yaslanır">
      <rect x="0" y="0" width="220" height="170" rx="20" fill="var(--surface-2)" />
      <g transform={`rotate(${rot} 110 120)`}>
        {/* yandan baş */}
        <path d="M78 150 C70 120 70 70 105 52 C140 36 168 62 165 96 C164 108 170 112 172 118 C174 124 166 124 166 130 C166 140 160 146 148 146 L140 160" fill="var(--gauge-head)" stroke="var(--gauge-head-line)" strokeWidth="3" />
        <circle cx="146" cy="88" r="3.5" fill="var(--text-2)" />
        {/* telefon alında */}
        <g transform="rotate(14 150 64)">
          <rect x="144" y="34" width="13" height="56" rx="4" fill="var(--primary)" />
          <rect x="155" y="40" width="3" height="44" rx="1.5" fill="var(--primary-soft)" />
        </g>
        <path d="M180 60 l14 -4 M180 70 l16 0 M180 80 l14 4" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" />
      </g>
      <text x="16" y="26" fontSize="12" fontWeight="700" fill="var(--muted)">{lookUp ? 'Tavana bakış' : 'Ekran dışa, üst kenar yukarı'}</text>
    </svg>
  );
}

export function BedSetup() {
  return (
    <svg viewBox="0 0 260 120" className="illus" role="img" aria-label="Yatakta yastık, sırtüstü yatınca omuz altına gelecek şekilde">
      <rect x="0" y="0" width="260" height="120" rx="20" fill="var(--surface-2)" />
      <rect x="20" y="70" width="220" height="16" rx="6" fill="var(--gauge-head-line)" opacity="0.5" />
      <rect x="20" y="86" width="8" height="22" rx="3" fill="var(--gauge-head-line)" />
      <rect x="232" y="86" width="8" height="22" rx="3" fill="var(--gauge-head-line)" />
      {/* yastık omuz altında */}
      <rect x="64" y="56" width="46" height="16" rx="8" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="2" />
      {/* yatan kişi */}
      <circle cx="44" cy="60" r="13" fill="var(--gauge-head)" stroke="var(--gauge-head-line)" strokeWidth="3" />
      <rect x="58" y="50" width="150" height="18" rx="9" fill="var(--gauge-head)" stroke="var(--gauge-head-line)" strokeWidth="3" />
      <text x="70" y="44" fontSize="11" fontWeight="700" fill="var(--accent)">yastık omuz altında</text>
      <text x="22" y="30" fontSize="11" fontWeight="700" fill="var(--muted)">baş yastıktan geriye sarkar</text>
    </svg>
  );
}
