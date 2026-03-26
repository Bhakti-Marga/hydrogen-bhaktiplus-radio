interface LiveNowBadgeProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  pulse?: boolean;
}

export function LiveNowBadge({
  className = "",
  size = "md",
  pulse = true,
}: LiveNowBadgeProps) {
  const sizeClasses = {
    sm: "text-10 px-6 py-2",
    md: "text-12 px-8 py-4",
    lg: "text-14 px-12 py-6",
  };

  return (
    <div
      className={`
        inline-flex items-center gap-6 bg-red-600 text-white font-600 rounded-full uppercase tracking-wide
        ${sizeClasses[size]}
        ${className}
      `}
    >
      <span
        className={`
          w-8 h-8 rounded-full bg-white
          ${pulse ? "animate-pulse" : ""}
        `}
      />
      <span>Live</span>
    </div>
  );
}
