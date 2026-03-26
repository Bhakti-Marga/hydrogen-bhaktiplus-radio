interface IconBadgeNewProps {
  className?: string;
}

export function IconBadgeNew({ className }: IconBadgeNewProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 45 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>New</title>
      {/* 
        Angled ribbon - flat left, slanted right edge
        - Top edge extends to x=46, then rounds to x=50
        - Bottom edge only extends to x=42
        - Creates angled/tapered right side
      */}
      <path
        d="M0 0H41C43.2091 0 44 1.79086 44 4L41 14C40 16.5 39 18 37 18H0V0Z"
        fill="#E53935"
      />
      {/* NEW text - centered in the shape */}
      <text
        x="21"
        y="12"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontSize="10"
        fontWeight="700"
        fill="white"
        textAnchor="middle"
      >
        NEW
      </text>
    </svg>
  );
}
