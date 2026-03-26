interface IconFlagProps {
  className?: string;
}

export function IconFlagIN({ className }: IconFlagProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 12" preserveAspectRatio="xMidYMid slice"
      className={className}
      fill="none"
    >
      <title>India</title>
      <g clipPath="url(#clip-in)">
        <rect width="16" height="12" fill="#F7FCFF" />
        <rect width="16" height="4" fill="#FF9933" />
        <rect y="8" width="16" height="4" fill="#138808" />
        <circle cx="8" cy="6" r="1.5" stroke="#000080" strokeWidth="0.3" fill="none" />
        <circle cx="8" cy="6" r="0.3" fill="#000080" />
      </g>
      <defs>
        <clipPath id="clip-in">
          <rect width="16" height="12" rx="1" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}
