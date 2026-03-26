interface IconFlagProps {
  className?: string;
}

export function IconFlagCN({ className }: IconFlagProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 12" preserveAspectRatio="xMidYMid slice"
      className={className}
      fill="none"
    >
      <title>China</title>
      <g clipPath="url(#clip-cn)">
        <rect width="16" height="12" fill="#DE2910" />
        <g fill="#FFDE00">
          <path d="M3 2L3.5 3.5L2 2.6H4L2.5 3.5L3 2Z" />
          <path d="M5.5 1L5.7 1.6L5 1.3H6L5.3 1.6L5.5 1Z" />
          <path d="M6.5 2.5L6.7 3.1L6 2.8H7L6.3 3.1L6.5 2.5Z" />
          <path d="M6.5 4.5L6.7 5.1L6 4.8H7L6.3 5.1L6.5 4.5Z" />
          <path d="M5.5 5.5L5.7 6.1L5 5.8H6L5.3 6.1L5.5 5.5Z" />
        </g>
      </g>
      <defs>
        <clipPath id="clip-cn">
          <rect width="16" height="12" rx="1" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}
