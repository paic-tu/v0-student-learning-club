"use client"

import { useEffect, useRef } from "react"
import { useTheme } from "@/lib/theme-context"
import AnimatedGradient from "./AnimatedGradient"
import { lightGradientConfig, darkGradientConfig } from "./gradient-configs"
import { HeroGlowPortal } from "./HeroGlowPortal"
import { startBackgroundAnimation } from "./engine"
import { DARK_THEME, LIGHT_THEME } from "./themes"
import styles from "./SiteBackground.module.css"

export function AnimatedGradientBackground() {
  const { theme } = useTheme()
  const galaxyCanvasRef = useRef<HTMLCanvasElement>(null)

  // Layer B: the galaxy (stars/nebula/dust/meteors), mounted once per theme
  // change. It sits underneath the gradient veil below.
  useEffect(() => {
    const canvas = galaxyCanvasRef.current
    if (!canvas) return
    return startBackgroundAnimation(canvas, theme === "dark" ? DARK_THEME : LIGHT_THEME)
  }, [theme])

  return (
    <>
      <div aria-hidden="true" className={`${styles.wrapper} ${styles.galaxyLayer}`}>
        <canvas ref={galaxyCanvasRef} className={styles.canvas} />
      </div>
      <div
        aria-hidden="true"
        className={styles.wrapper}
        style={
          theme === "dark"
            ? { opacity: 0.4, mixBlendMode: "screen" }
            // "screen" only adds light, so on a near-white page it washes out to
            // nothing; "multiply" lets the brand hues tint visibly instead while
            // the gradient's near-white stops stay invisible against the page.
            : { opacity: 0.55, mixBlendMode: "multiply" }
        }
      >
        <AnimatedGradient
          config={theme === "dark" ? darkGradientConfig : lightGradientConfig}
          style={{ position: "absolute", inset: 0, zIndex: 0 }}
          speedBoost={1.65}
          speedBoostDuration={4.5}
        />
      </div>
      <div aria-hidden="true" className={`${styles.wrapper} ${styles.atmosphereLayer}`} />
      <HeroGlowPortal />
    </>
  )
}
