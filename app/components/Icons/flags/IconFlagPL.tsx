interface IconFlagProps {
  className?: string;
}

export function IconFlagPL({ className }: IconFlagProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 12" preserveAspectRatio="xMidYMid slice"
      className={className}
      fill="none"
    >
      <title>Poland</title>
      <g clipPath="url(#clip-pl)">
        <rect width="16" height="12" fill="#DC143C" />
        <rect width="16" height="6" fill="#F7FCFF" />
      </g>
      <defs>
        <clipPath id="clip-pl">
          <rect width="16" height="12" rx="1" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}
