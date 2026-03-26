interface IconPurchasesProps {
  className?: string;
}

export function IconPurchases({ className }: IconPurchasesProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={`icon icon--purchases ${className || ""}`}
      viewBox="0 0 24 24"
      fill="none"
    >
      <title>Purchases</title>
      <path
        d="M6 6H4.5C3.67157 6 3 6.67157 3 7.5V19.5C3 20.3284 3.67157 21 4.5 21H19.5C20.3284 21 21 20.3284 21 19.5V7.5C21 6.67157 20.3284 6 19.5 6H18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 3H9C8.44772 3 8 3.44772 8 4V8C8 8.55228 8.44772 9 9 9H15C15.5523 9 16 8.55228 16 8V4C16 3.44772 15.5523 3 15 3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 13H16"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 17H12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

