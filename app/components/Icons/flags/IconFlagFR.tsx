interface IconFlagProps {
  className?: string;
}

export function IconFlagFR({ className }: IconFlagProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 12" preserveAspectRatio="xMidYMid slice"
      className={className}
      fill="none"
    >
      <title>France</title>
      <g clipPath="url(#clip-fr)">
        <rect width="16" height="12" fill="#F7FCFF" />
        <rect width="5.33" height="12" fill="#2E42A5" />
        <rect x="10.67" width="5.33" height="12" fill="#F50100" />
      </g>
      <defs>
        <clipPath id="clip-fr">
          <rect width="16" height="12" rx="1" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}
