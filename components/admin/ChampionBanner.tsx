import type { ChampionResult } from "@/lib/insights";

interface ChampionBannerProps {
  champion: ChampionResult;
}

export default function ChampionBanner({ champion }: ChampionBannerProps) {
  if (!champion) return null;
  const firstName = champion.kid.name?.split(" ")[0] ?? "Champion";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-accent-amber/50 bg-gradient-to-br from-accent-amber/15 via-accent-amber/5 to-accent-teal/10 p-5">
      <div className="absolute top-2 right-2 text-3xl opacity-30 select-none">🎉</div>
      <div className="absolute bottom-2 left-2 text-2xl opacity-20 select-none">✨</div>

      <div className="flex items-center gap-4 relative">
        <div className="text-5xl">🥇</div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-accent-amber uppercase tracking-widest font-bold">
            Champion of the Week
          </p>
          <p className="font-display font-bold text-2xl text-fg mt-1">{firstName}</p>
          <p className="text-sm text-fg-muted mt-1">{champion.reason}</p>
        </div>
      </div>
    </div>
  );
}
