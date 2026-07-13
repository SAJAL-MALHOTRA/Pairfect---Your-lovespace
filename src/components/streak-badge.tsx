import { PixelFlame } from "@/components/pixel-icons"

export function StreakBadge({ days }: { days: number }) {
  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-border/70 bg-card/70 py-2 pl-2 pr-5 shadow-sm backdrop-blur-md">
      <span className="flex size-11 items-center justify-center rounded-full bg-accent text-primary">
        <PixelFlame className="size-6" title="Streak flame" />
      </span>
      <span className="leading-tight">
        <span className="block text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Current streak
        </span>
        <span className="block font-serif text-lg font-semibold text-foreground">
          {days} {days === 1 ? "day" : "days"} together
        </span>
      </span>
    </div>
  )
}
