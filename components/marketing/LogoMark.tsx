interface LogoMarkProps {
  size?: number;
  className?: string;
}

export default function LogoMark({ size = 24, className = "" }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 256 256"
      width={size}
      height={size}
      fill="none"
      role="img"
      aria-label="ChoreQuest"
      className={className}
    >
      <circle cx="128" cy="128" r="80" stroke="currentColor" strokeWidth="22" />
      <path
        d="M 82 134 L 118 172 L 210 64"
        stroke="currentColor"
        strokeWidth="26"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
