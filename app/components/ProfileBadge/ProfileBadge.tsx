interface ProfileBadgeGradient {
  start: string;
  middle: string;
  end: string;
}

interface ProfileBadgeProps {
  label: string;
  bgColor?: string;
  bgGradient?: ProfileBadgeGradient;
  textColor?: string;
  textGradient?: ProfileBadgeGradient;
}

export function ProfileBadge({
  label,
  bgColor,
  bgGradient,
  textColor = "white",
  textGradient,
}: ProfileBadgeProps) {
  // If no gradients, use solid colors
  if (!bgGradient && !textGradient) {
    return (
      <span
        className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 text-[10px] px-6 py-2 rounded-full whitespace-nowrap flex items-center justify-center"
        style={{
          width: "56px",
          height: "18px",
          lineHeight: "14px",
          backgroundColor: bgColor,
          color: textColor,
        }}
      >
        {label}
      </span>
    );
  }

  // Use SVG for gradient support
  const uniqueId = `badge-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <span
      className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 text-[10px] px-6 py-2 rounded-full whitespace-nowrap flex items-center justify-center"
      style={{ width: "56px", height: "18px", lineHeight: "14px" }}
    >
      <svg width="56" height="18" viewBox="0 0 56 18" className="absolute inset-0">
        <defs>
          {bgGradient && (
            <linearGradient id={`bg-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={bgGradient.start} />
              <stop offset="50%" stopColor={bgGradient.middle} />
              <stop offset="100%" stopColor={bgGradient.end} />
            </linearGradient>
          )}
          {textGradient && (
            <linearGradient id={`text-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={textGradient.start} />
              <stop offset="50%" stopColor={textGradient.middle} />
              <stop offset="100%" stopColor={textGradient.end} />
            </linearGradient>
          )}
        </defs>
        <rect
          width="56"
          height="18"
          rx="9"
          fill={bgGradient ? `url(#bg-${uniqueId})` : bgColor}
        />
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          fill={textGradient ? `url(#text-${uniqueId})` : textColor}
          fontSize="9"
          fontStretch="condensed"
        >
          {label}
        </text>
      </svg>
    </span>
  );
}
