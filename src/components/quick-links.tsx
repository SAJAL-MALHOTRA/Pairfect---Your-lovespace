import { ChevronRight } from "lucide-react"
import { PixelSparkle, PixelPhotoStack } from "@/components/pixel-icons"

const items = [
  {
    Icon: PixelSparkle,
    title: "Weekly Recaps",
    description: "Gentle summaries of how your week felt together.",
    href: "/recap"
  },
  {
    Icon: PixelPhotoStack,
    title: "Shared Scrapbook",
    description: "Save anniversaries, photos and little memories.",
    href: "/moments"
  },
]

export function QuickLinks() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map(({ Icon, title, description, href }) => (
        <a
          key={title}
          href={href}
          className="group flex items-center gap-4 rounded-3xl border border-border/60 bg-card/55 p-5 shadow-sm backdrop-blur-xl transition-colors hover:bg-card"
        >
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent text-primary">
            <Icon className="size-6" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-serif text-lg font-semibold text-foreground">{title}</span>
            <span className="block text-sm text-muted-foreground text-pretty">{description}</span>
          </span>
          <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </a>
      ))}
    </div>
  )
}
