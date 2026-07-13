import { Heart, Music, Quote, Clock3, Bell } from "lucide-react"
import { cn } from "@/lib/utils"
import { AvatarScene } from "@/components/avatar-scene"

function IntensityMeter({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <Heart
            key={i}
            className={cn(
              "size-4",
              i < value ? "fill-primary text-primary" : "text-primary/25",
            )}
          />
        ))}
      </div>
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
    <article className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/55 p-6 shadow-[0_18px_40px_-24px_rgba(120,80,80,0.4)] backdrop-blur-xl md:p-7">
      {/* soft accent glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 size-40 rounded-full bg-accent/70 blur-3xl"
      />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
              {mood.initials}
            </span>
            <h2 className="font-serif text-lg font-semibold text-foreground">{heading}</h2>
          </div>
          <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <Clock3 className="size-3.5" aria-hidden="true" />
            {mood.loggedAt}
          </span>
        </div>

        {/* Mood */}
        <div className="mt-4 flex items-center gap-3">
          {/* Full-body voxel avatar (view-only, saved outfit colors) */}
          <AvatarScene
            initials={mood.initials}
            className="h-28 w-[72px] shrink-0 -my-1"
          />
          <span
            className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-secondary text-3xl shadow-inner"
            role="img"
            aria-label={`${mood.label} mood`}
          >
            {mood.emoji}
          </span>
          <div className="min-w-0 space-y-1.5">
            <p className="font-serif text-2xl font-semibold leading-none text-foreground">
              {mood.label}
            </p>
            <IntensityMeter value={mood.intensity} />
          </div>
        </div>

        {/* Note */}
        {mood.note && (
          <div className="mt-6 rounded-2xl border border-border/60 bg-background/50 p-4">
            <Quote className="size-4 text-primary/70" aria-hidden="true" />
            <p className="mt-1.5 font-serif text-base italic leading-relaxed text-foreground/90 text-pretty">
              {mood.note}
            </p>
          </div>
        )}

        {/* Song */}
        {mood.song && (
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-border/60 bg-accent/40 p-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-card text-primary shadow-sm">
              <Music className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                On repeat
              </p>
              <p className="truncate font-semibold text-foreground">{mood.song.title}</p>
              <p className="truncate text-sm text-muted-foreground">{mood.song.artist}</p>
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
    <article className="relative flex flex-col overflow-hidden rounded-3xl border border-dashed border-border bg-card/40 p-6 shadow-[0_18px_40px_-24px_rgba(120,80,80,0.35)] backdrop-blur-xl md:p-7">
      <div className="flex items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
          {initials}
        </span>
        <h2 className="font-serif text-lg font-semibold text-foreground">{heading}</h2>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
        <span className="flex size-16 items-center justify-center rounded-full border-2 border-dashed border-primary/40 text-3xl">
          {"\u2764\uFE0F"}
        </span>
        <p className="mt-4 max-w-[16rem] text-pretty font-serif text-lg italic text-foreground/80">
          {`Waiting for ${name} to share how their day feels.`}
        </p>
        <button
          type="button"
          onClick={onNudge}
          className="mt-5 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-card px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-accent active:scale-95"
        >
          <Bell className="size-4" aria-hidden="true" />
          {`Nudge ${name}`}
        </button>
      </div>
    </article>
  )
}
