interface IconFlagProps {
  className?: string;
}

export function IconFlagBR({ className }: IconFlagProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 12" preserveAspectRatio="xMidYMid slice"
      className={className}
      fill="none"
    >
      <title>Brazil</title>
      <g clipPath="url(#clip-br)">
        <rect width="16" height="12" fill="#009739" />
        <path d="M8 1.5L14.5 6L8 10.5L1.5 6L8 1.5Z" fill="#FEDD00" />
        <circle cx="8" cy="6" r="2.5" fill="#002776" />
        <path
          d="M5.8 5.5C6.5 4.8 7.5 4.5 8.5 4.8C9.5 5.1 10.2 5.8 10.2 6.5"
          stroke="#F7FCFF"
          strokeWidth="0.4"
          fill="none"
        />
      </g>
      <defs>
        <clipPath id="clip-br">
          <rect width="16" height="12" rx="1" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}
