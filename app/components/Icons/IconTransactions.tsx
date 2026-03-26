interface IconTransactionsProps {
  className?: string;
}

export function IconTransactions({ className }: IconTransactionsProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={`icon icon--transactions ${className || ""}`}
      viewBox="0 0 24 24"
      fill="none"
    >
      <title>Transactions</title>
      <rect
        x="2"
        y="5"
        width="20"
        height="14"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2 10H22"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 15H10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

