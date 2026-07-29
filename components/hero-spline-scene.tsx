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
      className={[
        "block overflow-hidden bg-transparent",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-hidden="true"
    >
      {shouldRender ? (
        <iframe
          src={sceneUrl}
          className={iframeClassName}
          loading="lazy"
          title={title}
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
          {fallbackLabel}
        </span>
      )}
    </span>
  )
}
