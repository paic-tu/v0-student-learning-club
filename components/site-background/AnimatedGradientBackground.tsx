"use client"

import { useTheme } from "@/lib/theme-context"
import AnimatedGradient from "./AnimatedGradient"
import { lightGradientConfig, darkGradientConfig } from "./gradient-configs"
import { HeroGlowPortal } from "./HeroGlowPortal"

export function AnimatedGradientBackground() {
  const { theme } = useTheme()

  return (
    <>
      <AnimatedGradient
        config={theme === "dark" ? darkGradientConfig : lightGradientConfig}
        style={{ position: "fixed", inset: 0, zIndex: 0 }}
        freezeAfter={12.403}
        decelerateWindow={3}
        speedBoost={2.6}
        speedBoostDuration={6}
      />
      <HeroGlowPortal />
    </>
  )
}
