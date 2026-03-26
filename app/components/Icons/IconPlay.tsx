interface IconPlayProps {
  className?: string;
}

export function IconPlay({ className }: IconPlayProps) {
  return (
    <svg
      className={`icon icon--play ${className || ""}`}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 12 14"
      fill="none"
    >
      <title>Play</title>
      <path
        d="M0 2.00486C4.32433e-07 0.465658 1.6657 -0.49655 2.99902 0.272443L11.001 4.88768C12.3353 5.65729 12.3352 7.58289 11.001 8.35252L2.99902 12.9687C1.66583 13.7375 0.000266957 12.7752 0 11.2363V2.00486Z"
        fill="currentColor"
      />
    </svg>
  );
}
