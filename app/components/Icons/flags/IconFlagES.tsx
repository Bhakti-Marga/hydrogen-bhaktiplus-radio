interface IconFlagProps {
  className?: string;
}

export function IconFlagES({ className }: IconFlagProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 12" preserveAspectRatio="xMidYMid slice"
      className={className}
      fill="none"
    >
      <title>Spain</title>
      <g clipPath="url(#clip-es)">
        <rect width="16" height="12" fill="#FFB400" />
        <rect width="16" height="3" fill="#C51918" />
        <rect y="9" width="16" height="3" fill="#C51918" />
      </g>
      <defs>
        <clipPath id="clip-es">
          <rect width="16" height="12" rx="1" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}
