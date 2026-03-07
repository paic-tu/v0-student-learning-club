"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { Smartphone } from "lucide-react"

export function RotateDevicePrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    // 1. Check persistence (Session based)
    if (typeof window !== "undefined" && sessionStorage.getItem("hasSeenRotatePrompt_v3") === "true") {
      return
    }

    // 2. Check path - only show on dashboard
    if (!pathname?.includes("dashboard")) {
      setShowPrompt(false)
      return
    }

    const checkOrientation = () => {
      // Check if it's a mobile device (touch capable and small screen)
      const isSmallScreen = window.matchMedia("(max-width: 768px)").matches
      
      // Check if in portrait mode
      const isPortrait = window.matchMedia("(orientation: portrait)").matches
      
      if (isSmallScreen && isPortrait) {
        // Only show if we haven't seen it yet in this session
        if (sessionStorage.getItem("hasSeenRotatePrompt_v3") !== "true") {
          setShowPrompt(true)
        }
      } else {
        // If we rotate to landscape (or are on big screen), hide it
        if (isSmallScreen && !isPortrait) {
             // User rotated to landscape -> Mark as seen so it doesn't return
             // Only write if not already set to avoid constant writes
             if (sessionStorage.getItem("hasSeenRotatePrompt_v3") !== "true") {
                sessionStorage.setItem("hasSeenRotatePrompt_v3", "true")
             }
        }
        setShowPrompt(false)
      }
    }

    // Initial check
    checkOrientation()

    // Listen for resize/orientation changes
    window.addEventListener("resize", checkOrientation)
    window.addEventListener("orientationchange", checkOrientation)

    return () => {
      window.removeEventListener("resize", checkOrientation)
      window.removeEventListener("orientationchange", checkOrientation)
    }
  }, [pathname])

  // Timer to auto-hide after 5 seconds
  useEffect(() => {
    if (showPrompt) {
      const timer = setTimeout(() => {
        setShowPrompt(false)
        sessionStorage.setItem("hasSeenRotatePrompt_v3", "true")
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [showPrompt])

  if (!showPrompt) return null

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/95 p-6 text-center animate-in fade-in duration-300">
      <div className="relative mb-10">
        {/* Phone Frame */}
        <div className="relative h-40 w-24 rounded-[2rem] border-4 border-foreground/20 bg-background/50 shadow-2xl animate-rotate-device flex items-center justify-center overflow-hidden will-change-transform">
          {/* Notch/Speaker */}
          <div className="absolute top-3 left-1/2 h-1.5 w-8 -translate-x-1/2 rounded-full bg-foreground/20" />
          
          {/* Screen Content Simulation */}
          <div className="w-full h-full bg-muted/30 flex flex-col p-2 gap-2 opacity-50">
            <div className="h-4 w-12 bg-foreground/10 rounded" />
            <div className="h-2 w-full bg-foreground/10 rounded" />
            <div className="h-2 w-2/3 bg-foreground/10 rounded" />
            <div className="mt-auto h-8 w-full bg-primary/20 rounded" />
          </div>
          
          {/* Home Indicator */}
          <div className="absolute bottom-2 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full bg-foreground/20" />
        </div>
      </div>
      
      <h2 className="text-2xl font-bold mb-3 tracking-tight">
        Rotate Device / تدوير الجهاز
      </h2>
      <p className="text-muted-foreground max-w-xs mx-auto text-base leading-relaxed">
        Please rotate your device to landscape mode for the best experience.
        <br />
        يرجى تدوير جهازك إلى الوضع الأفقي للحصول على أفضل تجربة.
      </p>

      <style jsx global>{`
        @keyframes rotate-device {
          0% { transform: rotate(0deg); }
          25% { transform: rotate(0deg); }
          45% { transform: rotate(90deg); }
          80% { transform: rotate(90deg); }
          100% { transform: rotate(0deg); }
        }
        .animate-rotate-device {
          animation: rotate-device 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
