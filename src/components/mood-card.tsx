import { Heart, Music, Quote, Clock3, Bell } from "lucide-react"
import { cn } from "@/lib/utils"
import dynamic from "next/dynamic";

const AvatarScene = dynamic(() => import("@/components/avatar-scene").then((mod) => mod.AvatarScene), {
  ssr: false,
});

function IntensityMeter({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <Heart
            key={i}
            className={cn(
              "size-4.5",
              i < value ? "fill-primary text-primary" : "text-primary/25",
            )}
          />
        ))}
      </div>
      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
        Intensity {value}/5
      </span>
      <span className="sr-only">{`Mood intensity ${value} out of 5`}</span>
    </div>
  )
}

export type Mood = {
  name: string
  initials: string
  emoji: string
  label: string
  intensity: number
  note: string
  song?: { title: string; artist: string } | null
  loggedAt: string
}

export function MoodCard({
  mood,
  heading,
}: {
  mood: Mood
  heading: string
}) {
  return (
    <article className="relative overflow-hidden rounded-lg border border-border bg-card p-6 shadow-sm md:p-7">
      {/* 3px top gradient accent bar */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#f472b6] to-[#60a5fa]" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-md border border-border bg-accent text-xs font-bold text-foreground">
              {mood.initials}
            </span>
            <h2 className="font-sans font-extrabold text-base text-foreground tracking-tight">{heading}</h2>
          </div>
          <span className="flex items-center gap-1 text-[10px] font-mono font-bold tracking-wider text-muted-foreground uppercase">
            <Clock3 className="size-3" aria-hidden="true" />
            {mood.loggedAt}
          </span>
        </div>

        {/* Mood */}
        <div className="mt-5 flex items-center gap-4">
          {/* Full-body voxel avatar (view-only, saved outfit colors) */}
          <AvatarScene
            initials={mood.initials}
            className="h-28 w-[72px] shrink-0 -my-1"
          />
          <span
            className="flex size-14 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-3xl"
            role="img"
            aria-label={`${mood.label} mood`}
          >
            {mood.emoji}
          </span>
          <div className="min-w-0 space-y-2">
            <p className="font-sans text-2xl font-black leading-none text-foreground tracking-tight">
              {mood.label}
            </p>
            <IntensityMeter value={mood.intensity} />
          </div>
        </div>

        {/* Note */}
        {mood.note && (
          <div className="mt-6 rounded-md border border-border bg-muted/30 p-4">
            <Quote className="size-4 text-primary/70 mb-1" aria-hidden="true" />
            <p className="font-sans text-sm leading-relaxed text-foreground/80 text-pretty">
              {mood.note}
            </p>
          </div>
        )}

        {/* Song */}
        {mood.song && (
          <div className="mt-4 flex items-center gap-3 rounded-md border border-border bg-muted/40 p-3">
            <span className="flex size-10 items-center justify-center rounded bg-card border border-border text-primary">
              <Music className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                On repeat
              </p>
              <p className="truncate font-bold text-xs text-foreground mt-0.5">{mood.song.title}</p>
              <p className="truncate text-[10px] text-muted-foreground">{mood.song.artist}</p>
            </div>
          </div>
        )}
      </div>
    </article>
  )
}

export function WaitingCard({
  heading,
  name,
  initials,
  onNudge,
}: {
  heading: string
  name: string
  initials: string
  onNudge?: () => void
}) {
  return (
    <article className="relative flex flex-col justify-center overflow-hidden rounded-lg border border-border bg-card p-6 shadow-sm md:p-7">
      <div className="flex items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-md border border-border bg-accent text-xs font-bold text-foreground">
          {initials}
        </span>
        <h2 className="font-sans font-extrabold text-base text-foreground tracking-tight">{heading}</h2>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
        <span className="flex size-16 items-center justify-center rounded-md border border-border bg-muted text-3xl">
          {"❤️"}
        </span>
        <p className="mt-4 max-w-[16rem] text-pretty font-sans text-sm text-foreground/80 leading-relaxed">
          {`Waiting for ${name} to share how their day feels.`}
        </p>
        <button
          type="button"
          onClick={onNudge}
          className="mt-5 inline-flex items-center gap-2 rounded-md border border-foreground dark:border-white/20 bg-card px-4 py-2 text-xs font-bold text-foreground hover:bg-muted transition-colors active:scale-95 cursor-pointer"
        >
          <Bell className="size-3.5" aria-hidden="true" />
          {`Nudge ${name}`}
        </button>
      </div>
    </article>
  )
}
