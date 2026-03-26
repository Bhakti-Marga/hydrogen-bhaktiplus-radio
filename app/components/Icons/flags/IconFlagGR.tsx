interface IconFlagProps {
  className?: string;
}

export function IconFlagGR({ className }: IconFlagProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 12" preserveAspectRatio="xMidYMid slice"
      className={className}
      fill="none"
    >
      <title>Greece</title>
      <g clipPath="url(#clip-gr)">
        <rect width="16" height="12" fill="#0D5EAF" />
        <rect y="1.33" width="16" height="1.33" fill="#F7FCFF" />
        <rect y="4" width="16" height="1.33" fill="#F7FCFF" />
        <rect y="6.67" width="16" height="1.33" fill="#F7FCFF" />
        <rect y="9.33" width="16" height="1.33" fill="#F7FCFF" />
        <rect width="6.67" height="6.67" fill="#0D5EAF" />
        <path d="M2.67 0V6.67M0 2.67H6.67" stroke="#F7FCFF" strokeWidth="1.33" />
      </g>
      <defs>
        <clipPath id="clip-gr">
          <rect width="16" height="12" rx="1" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}
