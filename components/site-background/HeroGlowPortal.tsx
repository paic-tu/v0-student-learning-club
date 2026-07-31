"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { createPortal } from "react-dom"
import { useTheme } from "@/lib/theme-context"
import styles from "./SiteBackground.module.css"

const ANCHOR_SELECTOR = "[data-neon-glow-anchor]"
const LOGO_SELECTOR = 'iframe[src*="spline.design"], iframe'

export function HeroGlowPortal() {
  const pathname = usePathname()
  const { theme } = useTheme()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [position, setPosition] = useState({ left: "50%", top: "50%" })

  useEffect(() => {
    setAnchor(document.querySelector<HTMLElement>(ANCHOR_SELECTOR))
  }, [pathname])

  useEffect(() => {
    if (!anchor) return
    const scope = anchor.parentElement ?? anchor

    const measure = () => {
      const logo = scope.querySelector<HTMLElement>(LOGO_SELECTOR)
      if (!logo) {
        setPosition({ left: "50%", top: "50%" })
        return
      }
      const anchorRect = anchor.getBoundingClientRect()
      const logoRect = logo.getBoundingClientRect()
      setPosition({
        left: `${logoRect.left + logoRect.width / 2 - anchorRect.left}px`,
        top: `${logoRect.top + logoRect.height / 2 - anchorRect.top}px`,
      })
    }

    measure()
    window.addEventListener("resize", measure)
    const observer = new ResizeObserver(measure)
    observer.observe(scope)

    return () => {
      window.removeEventListener("resize", measure)
      observer.disconnect()
    }
  }, [anchor, pathname])

  if (!anchor) return null

  return createPortal(
    <>
      <div
        aria-hidden="true"
        className={`${styles.logoShadow} ${theme === "light" ? styles.logoShadowLight : styles.logoShadowDark}`}
        style={{ left: position.left, top: position.top }}
      />
      <div
        aria-hidden="true"
        className={`${styles.centerGlow} ${theme === "light" ? styles.centerGlowLight : styles.centerGlowDark}`}
        style={{ left: position.left, top: position.top }}
      />
    </>,
    anchor,
  )
}
