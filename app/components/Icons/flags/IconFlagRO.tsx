interface IconFlagProps {
  className?: string;
}

export function IconFlagRO({ className }: IconFlagProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 12" preserveAspectRatio="xMidYMid slice"
      className={className}
      fill="none"
    >
      <title>Romania</title>
      <g clipPath="url(#clip-ro)">
        <rect width="16" height="12" fill="#FFCD00" />
        <rect width="5.33" height="12" fill="#002B7F" />
        <rect x="10.67" width="5.33" height="12" fill="#CE1126" />
      </g>
      <defs>
        <clipPath id="clip-ro">
          <rect width="16" height="12" rx="1" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}
