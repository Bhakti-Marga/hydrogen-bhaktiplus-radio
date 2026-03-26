interface IconFlagProps {
  className?: string;
}

export function IconFlagJP({ className }: IconFlagProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 12" preserveAspectRatio="xMidYMid slice"
      className={className}
      fill="none"
    >
      <title>Japan</title>
      <g clipPath="url(#clip-jp)">
        <rect width="16" height="12" fill="#F7FCFF" />
        <circle cx="8" cy="6" r="3" fill="#BC002D" />
      </g>
      <defs>
        <clipPath id="clip-jp">
          <rect width="16" height="12" rx="1" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}
