interface IconFlagProps {
  className?: string;
}

export function IconFlagRU({ className }: IconFlagProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 12" preserveAspectRatio="xMidYMid slice"
      className={className}
      fill="none"
    >
      <title>Russia</title>
      <g clipPath="url(#clip-ru)">
        <rect width="16" height="12" fill="#CE2B37" />
        <rect width="16" height="8" fill="#0039A6" />
        <rect width="16" height="4" fill="#F7FCFF" />
      </g>
      <defs>
        <clipPath id="clip-ru">
          <rect width="16" height="12" rx="1" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}
