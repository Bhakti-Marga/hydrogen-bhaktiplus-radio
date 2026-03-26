import React from 'react';

interface IconInfoCircleProps {
  className?: string;
}

/**
 * Info circle icon for tooltips
 * Used on subscription tier features that have additional information
 */
export function IconInfoCircle({ className }: IconInfoCircleProps) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 14.5C11.5899 14.5 14.5 11.5899 14.5 8C14.5 4.41015 11.5899 1.5 8 1.5C4.41015 1.5 1.5 4.41015 1.5 8C1.5 11.5899 4.41015 14.5 8 14.5ZM8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16ZM8.75 5V3.5H7.25V5H8.75ZM8.75 12.5V6.5H7.25V12.5H8.75Z"
        fill="currentColor"
      />
    </svg>
  );
}

