interface IconFlagProps {
  className?: string;
}

export function IconFlagCZ({ className }: IconFlagProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 12" preserveAspectRatio="xMidYMid slice"
      className={className}
      fill="none"
    >
      <title>Czech Republic</title>
      <g clipPath="url(#clip-cz)">
        <rect width="16" height="12" fill="#D7141A" />
        <rect width="16" height="6" fill="#F7FCFF" />
        <path d="M0 0L8 6L0 12V0Z" fill="#11457E" />
      </g>
      <defs>
        <clipPath id="clip-cz">
          <rect width="16" height="12" rx="1" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}
