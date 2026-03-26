interface IconLineWithOrnamentsProps {
  className?: string;
}

/**
 * Decorative horizontal line with nested leaf/diamond ornaments on both ends.
 * The line stretches between the two ornaments.
 */
export function IconLineWithOrnaments({ className }: IconLineWithOrnamentsProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 1228 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
    >
      {/* Right ornament - outer */}
      <path
        d="M1221.79 11.9505L1227.03 7.20805L1221.79 2.46561C1218.79 -0.151949 1214.31 -0.151949 1211.31 2.46561C1208.69 4.72651 1208.4 8.68308 1210.66 11.3006C1210.86 11.5334 1211.08 11.748 1211.31 11.9475C1214.31 14.5681 1218.79 14.5681 1221.79 11.9475V11.9505Z"
        stroke="currentColor"
        strokeMiterlimit="10"
      />
      {/* Right ornament - middle */}
      <path
        d="M1219.06 10.8227L1223.17 7.21071L1219.06 3.59872C1216.68 1.60381 1213.22 1.60381 1210.84 3.59872C1208.85 5.24603 1208.56 8.1991 1210.21 10.194C1210.4 10.4237 1210.61 10.6353 1210.84 10.8257C1213.22 12.8206 1216.69 12.8206 1219.06 10.8257V10.8227Z"
        stroke="currentColor"
        strokeMiterlimit="10"
      />
      {/* Right ornament - inner */}
      <path
        d="M1213.23 9.62884L1216.15 7.20775L1213.23 4.78666C1211.51 3.45067 1209.11 3.45067 1207.39 4.78666C1206.06 5.79016 1205.79 7.68834 1206.79 9.02432C1206.96 9.25404 1207.17 9.45655 1207.39 9.62582C1209.11 10.9618 1211.51 10.9618 1213.23 9.62582V9.62884Z"
        stroke="currentColor"
        strokeMiterlimit="10"
      />
      {/* Horizontal line */}
      <path
        d="M26.7637 7.2644H1200.65"
        stroke="currentColor"
        strokeMiterlimit="10"
      />
      {/* Left ornament - outer */}
      <path
        d="M5.98577 2.46234L0.744594 7.20479L5.98577 11.9472C8.9872 14.5648 13.4636 14.5648 16.4651 11.9472C19.0826 9.68633 19.3728 5.72977 17.1119 3.1122C16.9124 2.87947 16.6948 2.66486 16.4651 2.46537C13.4636 -0.155214 8.9872 -0.155214 5.98577 2.46537L5.98577 2.46234Z"
        stroke="currentColor"
        strokeMiterlimit="10"
      />
      {/* Left ornament - middle */}
      <path
        d="M8.71011 3.59014L4.59938 7.20213L8.71011 10.8141C11.0889 12.809 14.5528 12.809 16.9315 10.8141C18.9264 9.16681 19.2106 6.21374 17.5633 4.21883C17.3728 3.98912 17.1613 3.77754 16.9315 3.58711C14.5528 1.5922 11.0859 1.5922 8.71011 3.58711L8.71011 3.59014Z"
        stroke="currentColor"
        strokeMiterlimit="10"
      />
      {/* Left ornament - inner */}
      <path
        d="M14.545 4.784L11.6282 7.20509L14.545 9.62619C16.2618 10.9622 18.6648 10.9622 20.3816 9.62619C21.7176 8.62269 21.9866 6.7245 20.9831 5.38852C20.8108 5.1588 20.6083 4.95629 20.3816 4.78702C18.6648 3.45104 16.2618 3.45104 14.545 4.78702L14.545 4.784Z"
        stroke="currentColor"
        strokeMiterlimit="10"
      />
    </svg>
  );
}
