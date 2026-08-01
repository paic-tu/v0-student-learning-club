"use client"

import { useEffect, useLayoutEffect, useState } from "react"
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

  // useLayoutEffect (not useEffect) so the anchor is found and the glow/shadow
  // paint in the same frame as first hydration, instead of one render tick
  // later - they should already be visible before the 3D logo (which mounts
  // its iframe in a later effect) ever appears.
  useLayoutEffect(() => {
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
    const resizeObserver = new ResizeObserver(measure)
    resizeObserver.observe(scope)

    // The 3D logo's iframe mounts a moment after first paint (HeroSplineScene
    // waits on a client-only effect before inserting it), and that insertion
    // doesn't change `scope`'s own box size - so ResizeObserver alone never
    // notices it appearing, and the glow would stay stuck at the 50%/50%
    // fallback forever. Watch the DOM directly so it re-centers onto the logo
    // the moment it exists.
    const mutationObserver = new MutationObserver(measure)
    mutationObserver.observe(scope, { childList: true, subtree: true })

    return () => {
      window.removeEventListener("resize", measure)
      resizeObserver.disconnect()
      mutationObserver.disconnect()
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
