"use client"

import { useEffect, useRef } from "react"
import { useTheme } from "@/lib/theme-context"
import { startBackgroundAnimation } from "./engine"
import { DARK_THEME, LIGHT_THEME } from "./themes"
import { HeroGlowPortal } from "./HeroGlowPortal"
import styles from "./SiteBackground.module.css"

export function SiteBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { theme } = useTheme()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    return startBackgroundAnimation(canvas, theme === "dark" ? DARK_THEME : LIGHT_THEME)
  }, [theme])

  return (
    <>
      <div aria-hidden="true" className={styles.wrapper}>
        <canvas ref={canvasRef} className={styles.canvas} />
      </div>
      <HeroGlowPortal />
    </>
  )
}
