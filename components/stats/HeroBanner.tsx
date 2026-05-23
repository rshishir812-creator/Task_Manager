import XPBar from "@/components/gamification/XPBar";

interface HeroBannerProps {
  totalPoints: number;
  vibeLine: string;
  level: number;
}

export default function HeroBanner({ totalPoints, vibeLine, level }: HeroBannerProps) {
  return (
    <div className="rounded-2xl border border-accent-amber/40 bg-gradient-to-br from-accent-amber/10 to-accent-teal/5 p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-fg-muted uppercase tracking-wide">Total XP</p>
          <p className="font-display font-bold text-3xl text-accent-amber">
            {totalPoints.toLocaleString()}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-fg-muted uppercase tracking-wide">Level</p>
          <p className="font-display font-bold text-3xl text-accent-teal">{level}</p>
        </div>
      </div>
      <XPBar totalPoints={totalPoints} />
      <p className="mt-4 text-sm font-display font-semibold text-fg text-center">
        {vibeLine}
      </p>
    </div>
  );
}
