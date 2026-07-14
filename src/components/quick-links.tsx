import { ChevronRight, Scale, HelpCircle, Palette, Gift } from "lucide-react"
import { PixelPhotoStack } from "@/components/pixel-icons"

const items = [
  {
    Icon: PixelPhotoStack,
    title: "Shared Scrapbook",
    description: "Save anniversaries, photos and little memories.",
    href: "/moments"
  },
  {
    Icon: Scale,
    title: "AI Vibe Judge",
    description: "Settle relationship disputes playfully using Gemini.",
    href: "/vibe-judge"
  },
  {
    Icon: HelpCircle,
    title: "Riddle Night",
    description: "Crack mind-bending riddles together with live timers.",
    href: "/riddle"
  },
  {
    Icon: Palette,
    title: "Shared Canvas",
    description: "Collaboratively doodle simultaneously with live partner cursors.",
    href: "/shared-canvas"
  },
  {
    Icon: Gift,
    title: "Love Letter",
    description: "Write custom letters embedded with cute cat photos and sealed with wax.",
    href: "/love-letter"
  }
]

export function QuickLinks() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map(({ Icon, title, description, href }) => (
        <a
          key={title}
          href={href}
          className="group flex items-center gap-4 rounded-lg border border-border bg-card p-5 shadow-sm transition-colors hover:bg-muted/40"
        >
          <span className="flex size-12 shrink-0 items-center justify-center rounded-md border border-border bg-accent text-primary">
            <Icon className="size-6" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-sans text-base font-extrabold text-foreground tracking-tight">{title}</span>
            <span className="block text-xs text-muted-foreground mt-0.5 text-pretty">{description}</span>
          </span>
          <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </a>
      ))}
    </div>
  )
}
