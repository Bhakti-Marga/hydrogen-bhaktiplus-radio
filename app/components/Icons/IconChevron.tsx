interface IconChevronProps {
  className?: string;
}

export function IconChevron({ className }: IconChevronProps) {
  return (
    <svg
      id="chevron-down"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Chevron</title>
      <path
        d="M20 8L12 16L4 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
