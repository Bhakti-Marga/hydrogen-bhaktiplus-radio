interface IconBadgeUpcomingProps {
  className?: string;
}

export function IconBadgeUpcoming({ className }: IconBadgeUpcomingProps) {
  // viewBox height matches IconBadgeNew (18), width is wider to fit "UPCOMING" text
  return (
    <svg
      className={className}
      viewBox="0 0 80 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Upcoming</title>
      {/* 
        Angled ribbon - flat left, slanted right edge
        Wider than NEW badge to accommodate "UPCOMING" text
      */}
      <path
        d="M0 0H76C78.2091 0 79 1.79086 79 4L76 14C75 16.5 74 18 72 18H0V0Z"
        fill="#5927E9"
      />
      {/* UPCOMING text - centered in the shape */}
      <text
        x="38"
        y="12"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontSize="10"
        fontWeight="700"
        fill="white"
        textAnchor="middle"
      >
        UPCOMING
      </text>
    </svg>
  );
}
