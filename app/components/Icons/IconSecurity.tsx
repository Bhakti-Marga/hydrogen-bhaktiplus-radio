interface IconSecurityProps {
  className?: string;
}

export function IconSecurity({ className }: IconSecurityProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={`icon icon--security ${className || ""}`}
      viewBox="0 0 24 24"
      fill="none"
    >
      <title>Security</title>
      <rect
        x="5"
        y="11"
        width="14"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 11V7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7V11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="16"
        r="1"
        fill="currentColor"
      />
    </svg>
  );
}

