import { cn } from "@/lib/utils"

/**
 * Chunky 8-bit style icons drawn on a 16x16 grid with crisp square pixels.
 * shapeRendering="crispEdges" keeps them sharp (never blurry) at any size.
 * Colors use currentColor + theme tokens so they stay on-palette.
 */

type PixelIconProps = {
  className?: string
  title?: string
}

function Grid({
  children,
  className,
  title,
}: PixelIconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={cn("size-5", className)}
      shapeRendering="crispEdges"
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  )
}

// px helper: filled unit square at grid (x,y)
function P({ x, y, w = 1, h = 1, fill }: { x: number; y: number; w?: number; h?: number; fill: string }) {
  return <rect x={x} y={y} width={w} height={h} fill={fill} />
}

export function PixelFlame({ className, title }: PixelIconProps) {
  const outer = "var(--color-primary, #d9808c)"
  const inner = "#e8a87c"
  const core = "#f6ece4"
  return (
    <Grid className={className} title={title}>
      {/* outer flame body (rose) */}
      <P x={7} y={1} w={2} h={1} fill={outer} />
      <P x={6} y={2} w={4} h={1} fill={outer} />
      <P x={5} y={3} w={6} h={1} fill={outer} />
      <P x={4} y={4} w={8} h={2} fill={outer} />
      <P x={3} y={6} w={10} h={3} fill={outer} />
      <P x={3} y={9} w={10} h={3} fill={outer} />
      <P x={4} y={12} w={8} h={2} fill={outer} />
      <P x={6} y={14} w={4} h={1} fill={outer} />
      {/* inner flame (peach) */}
      <P x={7} y={5} w={2} h={1} fill={inner} />
      <P x={6} y={6} w={4} h={3} fill={inner} />
      <P x={6} y={9} w={4} h={2} fill={inner} />
      <P x={7} y={11} w={2} h={2} fill={inner} />
      {/* hot core (cream) */}
      <P x={7} y={8} w={2} h={3} fill={core} />
    </Grid>
  )
}

export function PixelSparkle({ className, title }: PixelIconProps) {
  const main = "var(--color-primary, #d9808c)"
  const soft = "#e8a87c"
  return (
    <Grid className={className} title={title}>
      {/* big four-point star */}
      <P x={7} y={1} w={2} h={2} fill={main} />
      <P x={6} y={3} w={4} h={1} fill={main} />
      <P x={5} y={4} w={6} h={1} fill={soft} />
      <P x={1} y={7} w={2} h={2} fill={main} />
      <P x={3} y={7} w={2} h={2} fill={soft} />
      <P x={5} y={6} w={6} h={4} fill={soft} />
      <P x={6} y={6} w={4} h={4} fill={main} />
      <P x={11} y={7} w={2} h={2} fill={soft} />
      <P x={13} y={7} w={2} h={2} fill={main} />
      <P x={5} y={11} w={6} h={1} fill={soft} />
      <P x={6} y={12} w={4} h={1} fill={main} />
      <P x={7} y={13} w={2} h={2} fill={main} />
      {/* little accent sparkle */}
      <P x={12} y={2} w={1} h={3} fill={soft} />
      <P x={11} y={3} w={3} h={1} fill={soft} />
    </Grid>
  )
}

export function PixelPhotoStack({ className, title }: PixelIconProps) {
  const frame = "var(--color-primary, #d9808c)"
  const paper = "#f6ece4"
  const sky = "#e8a87c"
  const hill = "#a3c4a8"
  return (
    <Grid className={className} title={title}>
      {/* back photo */}
      <P x={2} y={2} w={10} h={2} fill={frame} />
      <P x={2} y={2} w={2} h={9} fill={frame} />
      {/* front photo frame */}
      <P x={4} y={5} w={10} h={9} fill={frame} />
      {/* photo paper */}
      <P x={5} y={6} w={8} h={7} fill={paper} />
      {/* sky */}
      <P x={5} y={6} w={8} h={4} fill={sky} />
      {/* sun */}
      <P x={10} y={7} w={2} h={2} fill={paper} />
      {/* hills */}
      <P x={5} y={10} w={8} h={3} fill={hill} />
      <P x={6} y={9} w={2} h={1} fill={hill} />
      <P x={9} y={9} w={3} h={1} fill={hill} />
    </Grid>
  )
}
