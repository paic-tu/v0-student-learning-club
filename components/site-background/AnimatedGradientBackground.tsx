"use client"

import { useEffect, useRef } from "react"
import { useTheme } from "@/lib/theme-context"
import AnimatedGradient from "./AnimatedGradient"
import { lightGradientConfig, darkGradientConfig } from "./gradient-configs"
import { HeroGlowPortal } from "./HeroGlowPortal"
import { startBackgroundAnimation } from "./engine"
import { DARK_THEME, LIGHT_THEME } from "./themes"
import styles from "./SiteBackground.module.css"

// Crossing the open trigger while closed fully opens the veil (regardless of
// how much further the user scrolls); dropping back below the close trigger
// while open fully closes it again. Both are fractions of viewport height so
// they scale with screen size instead of a fixed pixel count; the gap
// between them is hysteresis so a scroll position sitting right at a
// boundary can't flicker the state.
const OPEN_TRIGGER_VH = 0.5
const CLOSE_TRIGGER_VH = 0.05

// Asymmetric easing is the whole trick: opening drives transform at a
// visible, graceful rate while opacity barely moves (reads as an opaque
// curtain physically sliding away). Closing inverts which channel is
// dominant - transform still leads (a quick, smooth rise rather than a
// near-instant snap) while opacity eases in more slowly, so the restore
// reads as a fluid rise-and-fade, not a reversed slide.
const EASE_DOWN_TRANSFORM = 0.22
const EASE_DOWN_OPACITY = 0.015
const EASE_UP_TRANSFORM = 0.19
const EASE_UP_OPACITY = 0.018

// The veil is an opaque rectangle, so its trailing (bottom) edge would
// otherwise be a hard cut line against the galaxy as it slides away. This
// mask feathers that last quarter of its own height to transparent, so the
// edge dissolves into the galaxy instead of drawing a seam.
const VEIL_MASK =
  "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 72%, rgba(0,0,0,0) 100%)"

// A faint scale tied to the same retraction distance as the translate, so
// the veil very subtly recedes in depth instead of just sliding - reads as
// a soft 3D pull rather than a flat cutout moving in one axis.
const VEIL_SCALE_RANGE = 0.03

export function AnimatedGradientBackground() {
  const { theme } = useTheme()
  const galaxyCanvasRef = useRef<HTMLCanvasElement>(null)
  const veilRef = useRef<HTMLDivElement>(null)
  const scrollProgressRef = useRef(0)

  // Layer B: the galaxy (stars/nebula/dust/meteors). Mounted once per theme
  // change and never touched by scroll, so its render loop and particle
  // state persist across the entire scroll range.
  useEffect(() => {
    const canvas = galaxyCanvasRef.current
    if (!canvas) return
    return startBackgroundAnimation(canvas, theme === "dark" ? DARK_THEME : LIGHT_THEME, scrollProgressRef)
  }, [theme])

  // Layer A: the #212A6B gradient acts as an atmospheric veil sitting on top
  // of the galaxy. This is a triggered open/close animation, not a
  // scroll-position scrubber: crossing a small threshold flips a target
  // state, and a persistent rAF loop eases toward that fixed target on its
  // own every frame - it keeps animating even if the user stops scrolling
  // mid-transition, and doesn't need continued scrolling to keep moving.
  useEffect(() => {
    let openTriggerPx = window.innerHeight * OPEN_TRIGGER_VH
    let closeTriggerPx = window.innerHeight * CLOSE_TRIGGER_VH
    const updateTriggers = () => {
      openTriggerPx = window.innerHeight * OPEN_TRIGGER_VH
      closeTriggerPx = window.innerHeight * CLOSE_TRIGGER_VH
    }

    let isOpen = false
    let currentTransform = 0
    let currentOpacity = 1
    let rafId = 0

    const tick = () => {
      const scrollY = window.scrollY
      if (isOpen && scrollY <= closeTriggerPx) isOpen = false
      else if (!isOpen && scrollY >= openTriggerPx) isOpen = true

      const transformTarget = isOpen ? -100 : 0
      const opacityTarget = isOpen ? 0 : 1
      const transformEase = isOpen ? EASE_DOWN_TRANSFORM : EASE_UP_TRANSFORM
      const opacityEase = isOpen ? EASE_DOWN_OPACITY : EASE_UP_OPACITY

      currentTransform += (transformTarget - currentTransform) * transformEase
      currentOpacity += (opacityTarget - currentOpacity) * opacityEase
      scrollProgressRef.current = Math.min(1, Math.max(0, -currentTransform / 100))

      const veil = veilRef.current
      if (veil) {
        const scale = 1 + (currentTransform / 100) * VEIL_SCALE_RANGE
        veil.style.transform = `translateY(${currentTransform}%) scale(${scale})`
        veil.style.opacity = String(currentOpacity)
      }

      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    window.addEventListener("resize", updateTriggers)
    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener("resize", updateTriggers)
    }
  }, [])

  return (
    <>
      <div aria-hidden="true" className={styles.wrapper}>
        <canvas ref={galaxyCanvasRef} className={styles.canvas} />
      </div>
      <div
        aria-hidden="true"
        className={styles.wrapper}
        ref={veilRef}
        style={{
          willChange: "transform, opacity",
          maskImage: VEIL_MASK,
          WebkitMaskImage: VEIL_MASK,
        }}
      >
        <AnimatedGradient
          config={theme === "dark" ? darkGradientConfig : lightGradientConfig}
          style={{ position: "absolute", inset: 0, zIndex: 0 }}
          freezeAfter={12.403}
          decelerateWindow={3}
          speedBoost={2.6}
          speedBoostDuration={6}
        />
      </div>
      <HeroGlowPortal />
    </>
  )
}
