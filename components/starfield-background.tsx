"use client"

import { useEffect, useRef } from "react"

interface StarfieldBackgroundProps {
  className?: string
  starCount?: number
  speed?: number
}

export function StarfieldBackground({ className = "", starCount = 100, speed = 0.5 }: StarfieldBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    const updateSize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    updateSize()
    window.addEventListener("resize", updateSize)

    // Create stars
    const stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.5 + 0.1,
      vx: (Math.random() - 0.5) * speed,
      vy: (Math.random() - 0.5) * speed,
    }))

    // Animation loop
    let animationId: number
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Check if prefers-reduced-motion is set
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

      stars.forEach((star) => {
        // Update position only if motion is not reduced
        if (!prefersReducedMotion) {
          star.x += star.vx
          star.y += star.vy

          // Wrap around
          if (star.x < 0) star.x = canvas.width
          if (star.x > canvas.width) star.x = 0
          if (star.y < 0) star.y = canvas.height
          if (star.y > canvas.height) star.y = 0
        }

        // Draw star
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(128, 128, 255, ${star.opacity})`
        ctx.fill()
      })

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", updateSize)
      cancelAnimationFrame(animationId)
    }
  }, [starCount, speed])

  return (
    <canvas ref={canvasRef} className={`pointer-events-none ${className}`} style={{ width: "100%", height: "100%" }} />
  )
}
