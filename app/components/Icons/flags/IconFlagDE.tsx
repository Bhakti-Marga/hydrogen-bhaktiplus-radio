interface IconFlagProps {
  className?: string;
}

export function IconFlagDE({ className }: IconFlagProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 12" preserveAspectRatio="xMidYMid slice"
      className={className}
      fill="none"
    >
      <title>Germany</title>
      <g clipPath="url(#clip-de)">
        <rect width="16" height="12" rx="1" fill="#FFD018" />
        <rect width="16" height="8" fill="#E31D1C" />
        <rect width="16" height="4" fill="#272727" />
      </g>
      <defs>
        <clipPath id="clip-de">
          <rect width="16" height="12" rx="1" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}
