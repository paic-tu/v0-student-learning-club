"use client"

import { useEffect, useLayoutEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { createPortal } from "react-dom"
import { useTheme } from "@/lib/theme-context"
import styles from "./SiteBackground.module.css"

const ANCHOR_SELECTOR = "[data-neon-glow-anchor]"
// The logo slot wrapper (see hero-spline-scene.tsx) renders unconditionally
// from first paint - it holds the "Neon"/"نيون" fallback text before the 3D
// scene loads, then the iframe itself once it mounts, both centered the same
// way inside it. Targeting the wrapper (not the iframe) means the glow is
// correctly positioned immediately, with no separate "logo missing yet"
// state to fall back from.
const LOGO_SELECTOR = "[data-neon-logo-slot]"

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

    // The slot wrapper itself doesn't resize when its fallback text is
    // swapped for the iframe (or vice versa), so ResizeObserver alone
    // wouldn't catch that content change. Watch the DOM directly too, as a
    // defensive re-measure on any layout-affecting mutation inside scope.
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
