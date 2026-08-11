"use client"

import { useState } from "react"
import { Plus } from "lucide-react"

interface FaqEntry {
  q: string
  a: string
}

export function HomeFaqAccordion({ items }: { items: FaqEntry[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  // Desktop (real cursor): hovering a question previews it open, formal and
  // effortless. Touch devices have no hover, so there we rely on tap only.
  const hasFinePointer =
    typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches

  const toggle = (index: number) => {
    setActiveIndex((current) => (current === index ? null : index))
  }

  return (
    <div>
      {items.map((item, index) => {
        const isOpen = activeIndex === index
        return (
          <div key={index} className="border-b border-primary/10 last:border-b-0">
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => toggle(index)}
              onMouseEnter={() => {
                if (hasFinePointer) setActiveIndex(index)
              }}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium outline-none transition-colors duration-200 hover:bg-primary/5 focus-visible:bg-primary/5 focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <span>{item.q}</span>
              <Plus
                className={`size-4 shrink-0 text-primary transition-transform duration-300 ease-out motion-reduce:transition-none ${isOpen ? "rotate-45" : ""}`}
              />
            </button>
            <div
              className="grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
              style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-4 leading-relaxed text-muted-foreground">{item.a}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
