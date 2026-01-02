"use client"

interface GlowBlobProps {
  className?: string
  color?: string
  size?: string
}

export function GlowBlob({ className = "", color = "primary", size = "500px" }: GlowBlobProps) {
  return (
    <div
      className={`absolute rounded-full blur-3xl opacity-20 dark:opacity-10 pointer-events-none ${className}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, hsl(var(--${color})) 0%, transparent 70%)`,
        animation: "float 20s ease-in-out infinite",
      }}
    >
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(30px, -30px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(20px, 10px) scale(1.05); }
        }
        @media (prefers-reduced-motion: reduce) {
          div {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  )
}
