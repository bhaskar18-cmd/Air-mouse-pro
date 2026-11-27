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
      <rect x="4" y="4" width="56" height="56" rx="14" fill="#2563EB" />
      <path
        d="M21 15L46 31.5L34 34.5L28.5 47L21 15Z"
        fill="#FFFFFF"
      />
      <path
        d="M42.5 34.5L50 41.5L46 45.5V29.5L50 33.5L42.5 40.5"
        stroke="#FFFFFF"
        strokeOpacity="0.9"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
