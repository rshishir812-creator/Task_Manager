interface LogoMarkProps {
  size?: number;
  className?: string;
}

// The ChoreQuest mark is final brand art (teal Quest Shield + fletched arrow),
// shipped as a transparent PNG so it floats on the dark headers it sits in.
// `size` sets the rendered height; width follows the shield's aspect ratio.
export default function LogoMark({ size = 24, className = "" }: LogoMarkProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/icons/logo-mark.png"
      alt="ChoreQuest"
      height={size}
      style={{ height: size, width: "auto" }}
      className={className}
    />
  );
}
