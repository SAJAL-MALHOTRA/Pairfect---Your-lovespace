import { PixelFlame } from "@/components/pixel-icons"

export function StreakBadge({ days }: { days: number }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold bg-pink-500/10 text-pink-500 border border-pink-500/20">
      <PixelFlame className="size-4" title="Streak flame" />
      <span>STREAK: {days} {days === 1 ? "DAY" : "DAYS"}</span>
    </div>
  )
}
