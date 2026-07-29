"use client"

import type * as React from "react"
import type { LucideIcon } from "lucide-react"

import { CardBody, CardContainer, CardItem } from "@/components/ui/3d-card"

type StatsCard3DProps = {
  icon: LucideIcon
  iconClassName: string
  value: React.ReactNode
  label: string
}

export function StatsCard3D({
  icon: Icon,
  iconClassName,
  value,
  label,
}: StatsCard3DProps) {
  return (
    <CardContainer containerClassName="h-full py-0" className="h-full w-full">
      <CardBody className="group/card relative h-full min-h-[170px] w-full overflow-hidden rounded-2xl border border-primary/10 bg-background/80 p-5 text-center shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:bg-background/92 hover:shadow-2xl hover:shadow-primary/15 sm:min-h-[190px] sm:p-6 md:p-7">
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/12 via-transparent to-accent/14 opacity-0 transition-opacity duration-300 group-hover/card:opacity-100" />
        <div className="pointer-events-none absolute -inset-16 rounded-full bg-gradient-to-r from-primary/0 via-primary/14 to-accent/0 opacity-0 blur-2xl transition-opacity duration-300 group-hover/card:opacity-100" />
        <div className="relative flex h-full flex-col items-center justify-center space-y-3">
          <CardItem translateZ={54} className="mx-auto">
            <div className="rounded-2xl border border-primary/10 bg-background/70 p-3 shadow-sm transition-all duration-300 group-hover/card:border-primary/25 group-hover/card:bg-background/90 group-hover/card:shadow-lg group-hover/card:shadow-primary/10">
              <Icon className={`h-8 w-8 sm:h-10 sm:w-10 ${iconClassName}`} strokeWidth={1.5} />
            </div>
          </CardItem>

          <CardItem translateZ={82} className="mx-auto">
            {value}
          </CardItem>

          <CardItem
            translateZ={38}
            className="mx-auto max-w-full text-sm font-medium leading-6 text-muted-foreground md:text-base"
          >
            {label}
          </CardItem>
        </div>
      </CardBody>
    </CardContainer>
  )
}
