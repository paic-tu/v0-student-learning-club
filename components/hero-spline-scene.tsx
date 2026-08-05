"use client"

import { useEffect, useState } from "react"

const HERO_SCENE_URL = "https://my.spline.design/untitled-UwmUDQ0mjgZORgINfAN0J5va/"

export function HeroSplineScene({
  className = "",
  fallbackLabel = "Neon",
  sceneUrl = HERO_SCENE_URL,
  title = "Neon 3D hero scene",
  iframeClassName = "absolute left-1/2 top-1/2 h-[130%] w-[130%] -translate-x-1/2 -translate-y-1/2 scale-[0.86] border-0 bg-transparent",
  forceRender = false,
}: {
  className?: string
  fallbackLabel?: string
  sceneUrl?: string
  title?: string
  iframeClassName?: string
  forceRender?: boolean
}) {
  const [shouldRender, setShouldRender] = useState(false)
  const [iframeLoaded, setIframeLoaded] = useState(false)

  useEffect(() => {
    if (forceRender) {
      setShouldRender(true)
      return
    }

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)")

    const syncRenderState = () => {
      const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
      setShouldRender(!motionQuery.matches && !connection?.saveData)
    }

    syncRenderState()
    motionQuery.addEventListener("change", syncRenderState)

    return () => {
      motionQuery.removeEventListener("change", syncRenderState)
    }
  }, [forceRender])

  return (
    <span
      data-neon-logo-slot=""
      className={[
        "block overflow-hidden bg-transparent",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-hidden="true"
    >
      <span
        className={[
          "absolute inset-0 flex items-center justify-center bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent transition-opacity duration-500",
          shouldRender && iframeLoaded ? "opacity-0" : "opacity-100",
        ].join(" ")}
      >
        {fallbackLabel}
      </span>
      {shouldRender && (
        <iframe
          src={sceneUrl}
          className={[
            iframeClassName,
            "transition-opacity duration-500",
            iframeLoaded ? "opacity-100" : "opacity-0",
          ].join(" ")}
          loading="lazy"
          title={title}
          onLoad={() => setIframeLoaded(true)}
        />
      )}
    </span>
  )
}
