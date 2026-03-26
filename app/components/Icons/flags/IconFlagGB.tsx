interface IconFlagProps {
  className?: string;
}

export function IconFlagGB({ className }: IconFlagProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 12" preserveAspectRatio="xMidYMid slice"
      className={className}
      fill="none"
    >
      <title>United Kingdom</title>
      <g clipPath="url(#clip-gb)">
        <rect width="16" height="12" fill="#2E42A5" />
        <path d="M0 0L16 12M16 0L0 12" stroke="#F7FCFF" strokeWidth="2" />
        <path d="M0 0L16 12M16 0L0 12" stroke="#E31D1C" strokeWidth="0.667" />
        <path d="M8 0V12M0 6H16" stroke="#F7FCFF" strokeWidth="4" />
        <path d="M8 0V12M0 6H16" stroke="#E31D1C" strokeWidth="2" />
      </g>
      <defs>
        <clipPath id="clip-gb">
          <rect width="16" height="12" rx="1" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}
