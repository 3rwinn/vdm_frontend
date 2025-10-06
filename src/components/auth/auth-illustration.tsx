import { cn } from "@/lib/utils"

const palettes = {
  teal: {
    gradient: "from-[#066a7a] via-[#0a879c] to-[#0d9bb4]",
    ring: "bg-white/20",
  },
  orange: {
    gradient: "from-[#d3550a] via-[#ef6f28] to-[#f58b4d]",
    ring: "bg-white/30",
  },
} as const

export interface AuthIllustrationProps {
  accent: keyof typeof palettes
  image?: {
    src: string
    alt: string
  }
}

export function AuthIllustration({ accent, image }: AuthIllustrationProps) {
  const palette = palettes[accent]

  return (
    <div
      className={cn(
        "relative h-full min-h-[520px] rounded-[48px] border border-white/20 p-6 text-white shadow-2xl",
        "bg-gradient-to-br",
        palette.gradient
      )}
    >
      <div className="absolute inset-0 overflow-hidden rounded-[48px]">
        <div className="absolute -left-32 top-16 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 right-0 h-[420px] w-[420px] rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -left-10 bottom-20 h-40 w-72 rounded-full border border-white/25 opacity-70" />
        <div className="absolute left-0 bottom-36 h-52 w-80 rounded-full border border-white/20 opacity-60" />
        <div className="absolute left-10 top-16 h-[520px] w-[520px] rounded-[56px] border border-white/25" />
        <div className={cn("absolute left-10 top-16 h-[520px] w-[520px] rounded-[56px]", palette.ring)} />
      </div>
      <div className="relative flex h-full flex-col justify-between rounded-[42px] border border-white/35 bg-white/10 p-8 backdrop-blur-md">
        <div className="max-w-xs space-y-6">
          <p className="text-xl font-semibold leading-relaxed text-white md:text-2xl">
            Découvrons ensemble les tendances, les usages et l’influence des médias à travers les données.
          </p>
        </div>
        <div className="flex items-end justify-between gap-6">
          <div className="flex items-center gap-1">
            <span className="h-2 w-6 rounded-full bg-white" />
            <span className="h-2 w-2 rounded-full bg-white/40" />
            <span className="h-2 w-2 rounded-full bg-white/40" />
          </div>
          {image ? (
            // <div className="relative h-64 w-44 overflow-hidden rounded-3xl border border-white/40 shadow-lg">
            <div className="relative h-64 w-54 overflow-hidden  -bottom-8">
              <img src={image.src} alt={image.alt} className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="relative h-56 w-40 overflow-hidden rounded-3xl border border-white/40 bg-white/20" />
          )}
        </div>
      </div>
    </div>
  )
}
