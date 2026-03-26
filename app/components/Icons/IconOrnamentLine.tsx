interface IconOrnamentLineProps {
  className?: string;
}

/**
 * Decorative horizontal line with nested leaf/diamond ornament on the right.
 * Use this as a decorative underline for titles - overlay text on top of it.
 *
 * The SVG preserves aspect ratio and the ornament stays on the right.
 * Line extends from left edge to the ornament.
 */
export function IconOrnamentLine({ className }: IconOrnamentLineProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 990.44 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMaxYMid meet"
    >
      {/* Horizontal line */}
      <line
        x1="0"
        y1="20"
        x2="885.79"
        y2="20"
        stroke="currentColor"
        strokeMiterlimit="10"
        strokeWidth="2"
      />
      {/* Nested leaf/diamond ornament */}
      <g>
        {/* Outer shape */}
        <path
          d="M971.62,35.34l17.34-15.69-17.34-15.69c-9.93-8.66-24.74-8.66-34.67,0-8.66,7.48-9.62,20.57-2.14,29.23.66.77,1.38,1.48,2.14,2.14,9.93,8.67,24.74,8.67,34.67,0Z"
          fill="none"
          stroke="currentColor"
          strokeMiterlimit="10"
          strokeWidth="2"
        />
        {/* Middle shape */}
        <path
          d="M962.6,31.61l13.6-11.95-13.6-11.95c-7.87-6.6-19.33-6.6-27.2,0-6.6,5.45-7.54,15.22-2.09,21.82.63.76,1.33,1.46,2.09,2.09,7.87,6.6,19.34,6.6,27.2,0Z"
          fill="none"
          stroke="currentColor"
          strokeMiterlimit="10"
          strokeWidth="2"
        />
        {/* Inner shape */}
        <path
          d="M943.3,27.66l9.65-8.01-9.65-8.01c-5.68-4.42-13.63-4.42-19.31,0-4.42,3.32-5.31,9.6-1.99,14.02.57.76,1.24,1.43,1.99,1.99,5.68,4.42,13.63,4.42,19.31,0Z"
          fill="none"
          stroke="currentColor"
          strokeMiterlimit="10"
          strokeWidth="2"
        />
      </g>
    </svg>
  );
}
