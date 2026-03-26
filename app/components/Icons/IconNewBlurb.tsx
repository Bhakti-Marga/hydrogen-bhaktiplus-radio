interface IconNewBlurbProps {
  className?: string;
}

/**
 * "New" blurb for header nav links.
 * Asymmetric rounded shape: flat bottom-left, rounded elsewhere.
 * Designed to sit inline next to nav link text.
 *
 * Shape from Figma: TL=6, TR=46, BR=46, BL=0
 * At 20px height, TR/BR clamp to 10px (half-height = pill edge).
 */
export function IconNewBlurb({ className }: IconNewBlurbProps) {
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        height: 20,
        paddingLeft: 7,
        paddingRight: 7,
        backgroundColor: "#ed4149",
        borderTopLeftRadius: 46,
        borderTopRightRadius: 46,
        borderBottomRightRadius: 46,
        borderBottomLeftRadius: 0,
        fontSize: 11,
        fontWeight: 600,
        lineHeight: 1,
        letterSpacing: "-0.44px",
        color: "white",
        whiteSpace: "nowrap",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      New
    </span>
  );
}
