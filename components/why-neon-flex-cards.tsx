import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface WhyNeonFeature {
  title: string
  description: string
  Icon: LucideIcon
  color: string
}

export function WhyNeonFlexCards({ features }: { features: WhyNeonFeature[] }) {
  return (
    <div className="mx-auto grid max-w-6xl gap-5 sm:gap-6 md:grid-cols-3 lg:gap-8">
      {features.map((feature, i) => (
        <div
          key={i}
          className={cn(
            "group flex flex-col items-center rounded-xl border border-border bg-card p-6 text-center shadow-md transition-all duration-300 sm:p-7 lg:p-8",
            "hover:-translate-y-1.5 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10",
          )}
        >
          <span
            className={cn(
              "mb-5 flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-current/10 transition-transform duration-300 group-hover:scale-110",
              feature.color,
            )}
          >
            <feature.Icon className={cn("h-8 w-8", feature.color)} strokeWidth={1.8} />
          </span>
          <h3 className="text-lg font-bold leading-tight text-foreground sm:text-xl">{feature.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">{feature.description}</p>
        </div>
      ))}
    </div>
  )
}
