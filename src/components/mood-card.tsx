import { Music, Clock3, Bell } from "lucide-react"

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

export const MOOD_ACCENTS: Record<string, { color: string, header: string }> = {
  "joyful": { color: "#EAB308", header: "✨ Your sunshine today" },
  "loved": { color: "#EC4899", header: "❤️ Filled with affection" },
  "calm": { color: "#0EA5E9", header: "😌 Your calm anchor" },
  "sad": { color: "#6366F1", header: "🌧️ Needs some gentle care" },
  "frustrated": { color: "#F97316", header: "⚡ Feeling a bit overwhelmed" },
  "tired": { color: "#A855F7", header: "💤 Charging batteries" },
  "excited": { color: "#F97316", header: "🤩 Brimming with energy" }
};

export function MoodCard({
  mood,
  heading,
}: {
  mood: Mood
  heading: string
}) {
  const normKey = mood.label.toLowerCase();
  const accent = MOOD_ACCENTS[normKey] || { color: "#f472b6", header: "✨ Current vibe" };

  return (
    <article className="card-standard relative overflow-hidden p-6 md:p-7 flex flex-col justify-between min-h-[220px]">
      <div className="relative z-10 flex flex-col h-full justify-between gap-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-button border border-border bg-accent text-[10px] font-bold text-foreground">
              {mood.initials}
            </span>
            <div className="min-w-0">
              <span className="block text-[11px] font-bold tracking-wider text-muted-foreground uppercase leading-none mb-0.5">
                {accent.header}
              </span>
              <h2 className="font-sans font-black text-sm text-foreground tracking-tight leading-none">
                {heading}
              </h2>
            </div>
          </div>
          <span className="flex items-center gap-1 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
            <Clock3 className="size-3" aria-hidden="true" />
            {mood.loggedAt}
          </span>
        </div>

        {/* Mood Emoji, Label, and Note */}
        <div className="flex items-start gap-4">
          {/* Floating Emoji */}
          <span
            className="flex size-14 shrink-0 items-center justify-center rounded-card border border-border bg-muted text-3xl animate-float select-none"
            role="img"
            aria-label={`${mood.label} mood`}
          >
            {mood.emoji}
          </span>
          <div className="min-w-0 flex-1">
            <p 
              className="font-sans text-xl font-black leading-tight tracking-tight"
              style={{ color: accent.color }}
            >
              {mood.label}
            </p>
            {mood.note ? (
              <p className="font-sans text-[13px] text-foreground/80 leading-relaxed mt-1 text-pretty italic">
                "{mood.note}"
              </p>
            ) : (
              <p className="font-sans text-[13px] text-muted-foreground leading-relaxed mt-1 italic">
                No note shared today
              </p>
            )}
          </div>
        </div>

        {/* Custom Mood Energy line slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[9px] font-bold tracking-wider text-muted-foreground uppercase">
            <span>Mood Energy</span>
            <span>{mood.intensity}/5</span>
          </div>
          <div className="relative h-1.5 w-full rounded-full bg-muted overflow-visible flex items-center">
            <div 
              className="h-full rounded-full transition-all duration-300"
              style={{ 
                width: `${(mood.intensity / 5) * 100}%`,
                backgroundColor: accent.color 
              }}
            />
            {/* Pulse knob indicator representing "◉" */}
            <div 
              className="absolute size-3 rounded-full border-2 border-card shadow-sm transition-all duration-300"
              style={{ 
                left: `calc(${(mood.intensity / 5) * 100}% - 6px)`,
                backgroundColor: accent.color
              }}
            />
          </div>
        </div>

        {/* Song On Repeat (Rendered compactly if exists) */}
        {mood.song && (
          <div className="flex items-center gap-2 border-t border-border/40 pt-3 mt-1">
            <Music className="size-3 text-muted-foreground shrink-0" aria-hidden="true" />
            <div className="min-w-0 flex-1 flex items-center gap-1.5 text-[11px]">
              <span className="font-bold text-foreground truncate">{mood.song.title}</span>
              <span className="text-muted-foreground shrink-0">•</span>
              <span className="text-muted-foreground truncate">{mood.song.artist}</span>
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
    <article className="card-standard relative flex flex-col justify-between p-6 md:p-7 min-h-[220px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-button border border-border bg-accent text-[10px] font-bold text-foreground">
            {initials}
          </span>
          <h2 className="font-sans font-black text-sm text-foreground tracking-tight">
            {heading}
          </h2>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
        <span className="text-3xl animate-float select-none mb-2" role="img" aria-label="Mail letter">
          💌
        </span>
        <p className="max-w-[16rem] text-pretty font-sans text-xs text-muted-foreground leading-relaxed">
          {`Your partner hasn't checked in yet. When they do, their mood will appear here.`}
        </p>
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={onNudge}
          className="btn-secondary py-2 px-4 text-xs flex items-center gap-1.5"
        >
          <Bell className="size-3" aria-hidden="true" />
          {`Nudge ${name}`}
        </button>
      </div>
    </article>
  )
}

