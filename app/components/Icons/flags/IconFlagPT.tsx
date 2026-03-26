interface IconFlagProps {
  className?: string;
}

export function IconFlagPT({ className }: IconFlagProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 12" preserveAspectRatio="xMidYMid slice"
      className={className}
      fill="none"
    >
      <title>Portugal</title>
      <g clipPath="url(#clip-pt)">
        <rect width="16" height="12" fill="#FF2936" />
        <rect width="6" height="12" fill="#006B3F" />
        <circle cx="6" cy="6" r="2" fill="#FFCC4D" />
        <circle cx="6" cy="6" r="1.5" fill="#FF2936" />
      </g>
      <defs>
        <clipPath id="clip-pt">
          <rect width="16" height="12" rx="1" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}
