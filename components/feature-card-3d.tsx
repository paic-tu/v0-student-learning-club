"use client"

import type { LucideIcon } from "lucide-react"

import { CardBody, CardContainer, CardItem } from "@/components/ui/3d-card"
import { cn } from "@/lib/utils"

type FeatureCard3DProps = {
  icon: LucideIcon
  iconClassName: string
  gradientClassName: string
  title: string
  description: string
}

export function FeatureCard3D({
  icon: Icon,
  iconClassName,
  gradientClassName,
  title,
  description,
}: FeatureCard3DProps) {
  return (
    <CardContainer containerClassName="h-full py-0" className="h-full w-full">
      <CardBody
        className={cn(
          "group/card relative flex h-full w-full flex-col overflow-hidden rounded-xl border border-primary/10 bg-gradient-to-br p-6 text-center shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/15 sm:p-7 lg:p-8",
          gradientClassName,
        )}
      >
        <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br from-primary/12 via-transparent to-accent/14 opacity-0 transition-opacity duration-300 group-hover/card:opacity-100" />
        <div className="pointer-events-none absolute -inset-16 rounded-full bg-gradient-to-r from-primary/0 via-primary/14 to-accent/0 opacity-0 blur-2xl transition-opacity duration-300 group-hover/card:opacity-100" />
        <div className="relative flex h-full flex-col items-center space-y-4">
          <CardItem translateZ={54} className="mx-auto">
            <Icon className={cn("h-10 w-10 sm:h-12 sm:w-12", iconClassName)} strokeWidth={1.6} />
          </CardItem>
          <CardItem translateZ={44} className="mx-auto text-lg font-bold leading-tight sm:text-xl md:text-2xl">
            {title}
          </CardItem>
          <CardItem translateZ={28} className="mx-auto text-sm text-muted-foreground leading-7 sm:text-base">
            {description}
          </CardItem>
        </div>
      </CardBody>
    </CardContainer>
  )
}
