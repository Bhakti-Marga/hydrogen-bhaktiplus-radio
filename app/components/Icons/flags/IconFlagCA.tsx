interface IconFlagProps {
  className?: string;
}

export function IconFlagCA({ className }: IconFlagProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 12" preserveAspectRatio="xMidYMid slice"
      className={className}
      fill="none"
    >
      <title>Canada</title>
      <g clipPath="url(#clip-ca)">
        <rect width="16" height="12" fill="#F7FCFF" />
        <rect width="4" height="12" fill="#E31D1C" />
        <rect x="12" width="4" height="12" fill="#E31D1C" />
        <path
          d="M8 2.5L8.5 4H7.5L8 2.5ZM6.5 5L8 4.5L9.5 5L9 6H7L6.5 5ZM7 6.5H9V8.5L8.5 8L8 9L7.5 8L7 8.5V6.5Z"
          fill="#E31D1C"
        />
      </g>
      <defs>
        <clipPath id="clip-ca">
          <rect width="16" height="12" rx="1" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}
