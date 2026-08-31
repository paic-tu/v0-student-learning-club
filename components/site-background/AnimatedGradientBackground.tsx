"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { useTheme } from "@/lib/theme-context"
import AnimatedGradient from "./AnimatedGradient"
import { lightGradientConfig, darkGradientConfig } from "./gradient-configs"
import { startBackgroundAnimation } from "./engine"
import { DARK_THEME, LIGHT_THEME } from "./themes"
import styles from "./SiteBackground.module.css"

// Hidden entirely behind the opaque bg-muted portal shells, so skip mounting
// (and never start the canvas/WebGL animation loops) on those routes.
const PORTAL_PATH_PATTERN = /^\/[a-z]{2}\/(student|instructor|admin)(\/|$)/

export function AnimatedGradientBackground() {
  const { theme } = useTheme()
  const pathname = usePathname()
  const isPortalRoute = PORTAL_PATH_PATTERN.test(pathname || "")
  const galaxyCanvasRef = useRef<HTMLCanvasElement>(null)

  // Layer B: the galaxy (stars/nebula/dust/meteors), mounted once per theme
  // change. It sits underneath the gradient veil below.
  useEffect(() => {
    if (isPortalRoute) return
    const canvas = galaxyCanvasRef.current
    if (!canvas) return
    return startBackgroundAnimation(canvas, theme === "dark" ? DARK_THEME : LIGHT_THEME)
  }, [theme, isPortalRoute])

  if (isPortalRoute) return null

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
    </>
  )
}
