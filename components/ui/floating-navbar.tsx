"use client"

import * as React from "react"
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from "framer-motion"

import { cn } from "@/lib/utils"

type FloatingNavbarProps = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode
}

export function FloatingNavbar({
  children,
  className,
  ...props
}: FloatingNavbarProps) {
  const { scrollYProgress } = useScroll()
  const [visible, setVisible] = React.useState(true)

  useMotionValueEvent(scrollYProgress, "change", (current) => {
    if (typeof current !== "number") return

    const previous = scrollYProgress.getPrevious()

    if (current < 0.03) {
      setVisible(true)
      return
    }

    setVisible(previous !== undefined && current < previous)
  })

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 1, y: -96 }}
        animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : -96 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className={cn(
          "pointer-events-auto fixed inset-x-3 top-4 z-50 mx-auto max-w-6xl rounded-full border border-primary/15 bg-background/82 shadow-2xl shadow-primary/10 backdrop-blur-xl supports-[backdrop-filter]:bg-background/72 sm:inset-x-6 sm:top-5",
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
