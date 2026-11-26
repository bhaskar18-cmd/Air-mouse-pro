interface BlueMouseLogoProps {
  size?: number;
  className?: string;
}

export function BlueMouseLogo({ size = 36, className = '' }: BlueMouseLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="bm-bg" x1="8" y1="6" x2="56" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1D4ED8" />
          <stop offset="55%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
        <linearGradient id="bm-pointer" x1="18" y1="14" x2="48" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#BAE6FD" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="56" height="56" rx="16" fill="url(#bm-bg)" />
      <rect
        x="4.75"
        y="4.75"
        width="54.5"
        height="54.5"
        rx="15.25"
        stroke="white"
        strokeOpacity="0.22"
        strokeWidth="1.5"
      />
      {/* Precision mouse pointer silhouette */}
      <path
        d="M19 14L47 31.5L34.2 34.4L28.6 47.5L19 14Z"
        fill="url(#bm-pointer)"
        stroke="#0F172A"
        strokeOpacity="0.25"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Integrated Bluetooth rune motif */}
      <path
        d="M42.5 34.5L51.5 42.5L46.5 47V29L51.5 33.5L42.5 41.5"
        stroke="#06B6D4"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M42.5 34.5L51.5 42.5L46.5 47V29L51.5 33.5L42.5 41.5"
        stroke="#FFFFFF"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
