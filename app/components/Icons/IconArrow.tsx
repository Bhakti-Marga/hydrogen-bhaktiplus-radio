interface IconArrowProps {
  className?: string;
}

export function IconArrow({ className }: IconArrowProps) {
  return (
    <svg
      className={`icon icon--arrow ${className || ""}`}
      width="7"
      height="12"
      viewBox="0 0 7 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Arrow</title>
      <path
        d="M1 1L6 6L1 11"
        stroke="#041236"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
