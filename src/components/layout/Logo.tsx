export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="cwg-logo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4f46e5" />
          <stop offset="0.55" stopColor="#7c3aed" />
          <stop offset="1" stopColor="#14b8a6" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill="url(#cwg-logo)" />
      <g fill="#fff" fontFamily="Plus Jakarta Sans, Arial, sans-serif" fontWeight="800" fontSize="17" textAnchor="middle">
        <text x="20" y="27">C</text>
        <text x="44" y="27">W</text>
        <text x="20" y="50">G</text>
      </g>
      <rect x="34" y="34" width="20" height="19" rx="6" fill="#fff" opacity="0.95" />
      <path d="M39 44l3 3 6-6" stroke="#4f46e5" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
