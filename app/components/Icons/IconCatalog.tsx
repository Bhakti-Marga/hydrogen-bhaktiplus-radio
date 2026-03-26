interface IconCatalogProps {
  className?: string;
}

export function IconCatalog({ className }: IconCatalogProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2 2H6V6H2V2Z"
        fill="currentColor"
      />
      <path
        d="M10 2H14V6H10V2Z"
        fill="currentColor"
      />
      <path
        d="M2 10H6V14H2V10Z"
        fill="currentColor"
      />
      <path
        d="M10 10H14V14H10V10Z"
        fill="currentColor"
      />
    </svg>
  );
}
