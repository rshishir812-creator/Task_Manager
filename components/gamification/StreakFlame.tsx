"use client";

interface StreakFlameProps {
  streak: number;
  size?: "sm" | "md" | "lg";
}

export default function StreakFlame({ streak, size = "md" }: StreakFlameProps) {
  const sizeClasses = {
    sm: "text-sm gap-0.5",
    md: "text-base gap-1",
    lg: "text-2xl gap-1.5",
  };

  const flameSize = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-3xl",
  };

  if (streak === 0) return null;

  return (
    <span
      className={`inline-flex items-center font-bold text-accent-amber ${sizeClasses[size]}`}
      title={`${streak}-day streak`}
    >
      <span
        className={`${flameSize[size]} animate-[flicker_1.5s_ease-in-out_infinite]`}
        style={{ filter: "drop-shadow(0 0 4px #FFB347)" }}
      >
        🔥
      </span>
      {streak}
    </span>
  );
}
