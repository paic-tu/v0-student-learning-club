import type { BackgroundTheme, WeightedColor } from "./themes"

interface Star {
  x: number
  y: number
  size: number
  opacity: number
  depth: number
  phase: number
  speed: number
  color: WeightedColor
}

interface Blob {
  x: number
  y: number
  radius: number
  alpha: number
  blur: number
  depth: number
  color: [number, number, number]
}

interface Meteor {
  x: number
  y: number
  angleRad: number
  speed: number
  age: number
  maxTailLen: number
  tailLen: number
}

interface Dust {
  x: number
  y: number
  size: number
  opacity: number
  depth: number
  driftPhase: number
  driftSpeed: number
}

const rand = (min: number, max: number) => min + Math.random() * (max - min)

function pickWeightedColor(colors: WeightedColor[]): WeightedColor {
  const total = colors.reduce((sum, c) => sum + c.weight, 0)
  let r = Math.random() * total
  for (const color of colors) {
    r -= color.weight
    if (r <= 0) return color
  }
  return colors[colors.length - 1]
}

export function startBackgroundAnimation(
  canvas: HTMLCanvasElement,
  theme: BackgroundTheme,
  scrollProgressRef?: { current: number },
): () => void {
  const ctx = canvas.getContext("2d")
  if (!ctx) return () => {}

  let width = 0
  let height = 0
  let stars: Star[] = []
  let nebulaBlobs: Blob[] = []
  let bokehBlobs: Blob[] = []
  let dustParticles: Dust[] = []
  let meteor: Meteor | null = null
  let nextMeteorAt = rand(4, 9)

  let mouseX = 0.5
  let mouseY = 0.5
  let targetMouseX = 0.5
  let targetMouseY = 0.5

  const createStars = () => {
    const total = Math.round((width * height) / theme.starDensityDivisor)
    const next: Star[] = []
    theme.starLayers.forEach((layer) => {
      const count = Math.round(total * layer.share)
      for (let i = 0; i < count; i++) {
        next.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: rand(layer.sizeMin, layer.sizeMax),
          opacity: rand(layer.opacityMin, layer.opacityMax),
          depth: rand(layer.depthMin, layer.depthMax),
          phase: rand(0, Math.PI * 2),
          speed: rand(0.4, 1.4),
          color: pickWeightedColor(theme.starColors),
        })
      }
    })
    stars = next
  }

  const createNebula = () => {
    nebulaBlobs = Array.from({ length: 5 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: rand(0.35, 0.6) * Math.max(width, height),
      alpha: rand(theme.nebulaAlphaMin, theme.nebulaAlphaMax),
      blur: rand(theme.nebulaBlurMin, theme.nebulaBlurMax),
      depth: rand(theme.nebulaDepthMin, theme.nebulaDepthMax),
      color: theme.nebulaColors[Math.floor(Math.random() * theme.nebulaColors.length)],
    }))
  }

  const createBokeh = () => {
    bokehBlobs = Array.from({ length: 5 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: rand(theme.bokehRadiusMin, theme.bokehRadiusMax),
      alpha: rand(theme.bokehAlphaMin, theme.bokehAlphaMax),
      blur: theme.bokehBlur,
      depth: theme.bokehDepth,
      color: theme.nebulaColors[Math.floor(Math.random() * theme.nebulaColors.length)],
    }))
  }

  const createDust = () => {
    const total = Math.round((width * height) / theme.dustDensityDivisor)
    dustParticles = Array.from({ length: total }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: rand(theme.dustSizeMin, theme.dustSizeMax),
      opacity: rand(theme.dustAlphaMin, theme.dustAlphaMax),
      depth: rand(2, 6),
      driftPhase: rand(0, Math.PI * 2),
      driftSpeed: rand(0.02, 0.05),
    }))
  }

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    width = window.innerWidth
    height = window.innerHeight
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    createStars()
    createNebula()
    createBokeh()
    createDust()
  }

  const handlePointerMove = (e: PointerEvent) => {
    targetMouseX = e.clientX / window.innerWidth
    targetMouseY = e.clientY / window.innerHeight
  }

  const maybeSpawnMeteor = (tSec: number) => {
    if (meteor) return
    if (tSec < nextMeteorAt) return
    const angleDeg = rand(128, 148)
    meteor = {
      x: width * rand(0.45, 0.55),
      y: -30,
      angleRad: (angleDeg * Math.PI) / 180,
      speed: rand(7.2, 10),
      age: 0,
      maxTailLen: rand(65, 95),
      tailLen: 0,
    }
    nextMeteorAt = tSec + rand(10, 20)
  }

  const updateMeteor = () => {
    if (!meteor) return
    meteor.x += Math.cos(meteor.angleRad) * meteor.speed
    meteor.y += Math.sin(meteor.angleRad) * meteor.speed
    meteor.age += 1
    meteor.tailLen = Math.min(meteor.maxTailLen, meteor.tailLen + meteor.maxTailLen / 20)
    if (meteor.age > 600 || meteor.x < -meteor.tailLen || meteor.y > height + meteor.tailLen) {
      meteor = null
    }
  }

  const drawMeteor = () => {
    if (!meteor) return
    const dx = Math.cos(meteor.angleRad)
    const dy = Math.sin(meteor.angleRad)
    const tailX = meteor.x - dx * meteor.tailLen
    const tailY = meteor.y - dy * meteor.tailLen

    const gradient = ctx.createLinearGradient(meteor.x, meteor.y, tailX, tailY)
    theme.meteor.gradientStops.forEach((stop) => gradient.addColorStop(stop.offset, stop.color))

    ctx.save()
    ctx.filter = "blur(3.5px)"
    ctx.strokeStyle = gradient
    ctx.lineWidth = 2.6
    ctx.beginPath()
    ctx.moveTo(meteor.x, meteor.y)
    ctx.lineTo(tailX, tailY)
    ctx.stroke()
    ctx.restore()

    ctx.save()
    ctx.filter = "none"
    ctx.strokeStyle = gradient
    ctx.lineWidth = theme.meteor.coreLineWidth
    ctx.beginPath()
    ctx.moveTo(meteor.x, meteor.y)
    ctx.lineTo(tailX, tailY)
    ctx.stroke()
    ctx.restore()

    ctx.save()
    ctx.translate(meteor.x, meteor.y)
    ctx.scale(1.6, 1)
    ctx.filter = "blur(2px)"
    const headGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 8)
    headGradient.addColorStop(0, theme.meteor.headGlowColor(0.9))
    headGradient.addColorStop(1, theme.meteor.headGlowColor(0))
    ctx.fillStyle = headGradient
    ctx.beginPath()
    ctx.arc(0, 0, 8, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  const drawNebula = (scrollBoost: number) => {
    nebulaBlobs.forEach((blob) => {
      const offsetX = (mouseX - 0.5) * blob.depth
      const offsetY = (mouseY - 0.5) * blob.depth
      const x = blob.x + offsetX
      const y = blob.y + offsetY
      ctx.save()
      ctx.filter = `blur(${blob.blur}px)`
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, blob.radius)
      const [r, g, b] = blob.color
      gradient.addColorStop(0, `rgba(${r},${g},${b},${blob.alpha * scrollBoost})`)
      gradient.addColorStop(1, `rgba(${r},${g},${b},0)`)
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(x, y, blob.radius, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    })
  }

  const drawDust = (tSec: number, scrollBoost: number) => {
    const [r, g, b] = theme.dustColor
    dustParticles.forEach((d) => {
      const offsetX = (mouseX - 0.5) * d.depth + Math.sin(tSec * d.driftSpeed + d.driftPhase) * 6
      const offsetY = (mouseY - 0.5) * d.depth + Math.cos(tSec * d.driftSpeed * 0.8 + d.driftPhase) * 4
      const x = d.x + offsetX
      const y = d.y + offsetY
      ctx.fillStyle = `rgba(${r},${g},${b},${d.opacity * scrollBoost})`
      ctx.beginPath()
      ctx.arc(x, y, d.size * 0.5, 0, Math.PI * 2)
      ctx.fill()
    })
  }

  const drawMilkyWay = (tSec: number, scrollBoost: number) => {
    const [r, g, b] = theme.milkyWayColor
    const driftX = Math.sin(tSec * 0.01) * width * 0.02
    ctx.save()
    ctx.translate(width / 2 + driftX, height / 2)
    ctx.rotate((theme.milkyWayAngleDeg * Math.PI) / 180)
    const bandLength = Math.max(width, height) * 1.6
    const bandWidth = Math.min(width, height) * 0.55
    const gradient = ctx.createLinearGradient(0, -bandWidth / 2, 0, bandWidth / 2)
    gradient.addColorStop(0, `rgba(${r},${g},${b},0)`)
    gradient.addColorStop(0.5, `rgba(${r},${g},${b},${theme.milkyWayAlpha * scrollBoost})`)
    gradient.addColorStop(1, `rgba(${r},${g},${b},0)`)
    ctx.fillStyle = gradient
    ctx.fillRect(-bandLength / 2, -bandWidth / 2, bandLength, bandWidth)
    ctx.restore()
  }

  const drawBokeh = () => {
    bokehBlobs.forEach((blob) => {
      const offsetX = (mouseX - 0.5) * blob.depth
      const offsetY = (mouseY - 0.5) * blob.depth
      const x = blob.x + offsetX
      const y = blob.y + offsetY
      ctx.save()
      ctx.filter = `blur(${blob.blur}px)`
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, blob.radius)
      const [r, g, b] = blob.color
      gradient.addColorStop(0, `rgba(${r},${g},${b},${blob.alpha})`)
      gradient.addColorStop(1, `rgba(${r},${g},${b},0)`)
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(x, y, blob.radius, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    })
  }

  const drawStars = (tSec: number) => {
    const mousePxX = mouseX * width
    const mousePxY = mouseY * height
    const proximityRadius = 140

    stars.forEach((star) => {
      const offsetX = (mouseX - 0.5) * star.depth
      const offsetY = (mouseY - 0.5) * star.depth
      const x = star.x + offsetX
      const y = star.y + offsetY
      const twinkle = Math.sin(tSec * star.speed + star.phase)
      let alpha = star.opacity * (0.65 + 0.35 * twinkle)

      const dist = Math.hypot(x - mousePxX, y - mousePxY)
      let scale = 1
      if (dist < proximityRadius) {
        const proximity = 1 - dist / proximityRadius
        alpha += proximity * 0.3
        scale = 1 + proximity * 0.35
      }

      const { r, g, b } = star.color
      const a = Math.max(alpha, 0)
      ctx.save()
      ctx.shadowBlur = star.size * theme.starShadowBlurMultiplier
      ctx.shadowColor = `rgba(${r},${g},${b},${a})`
      ctx.fillStyle = `rgba(${r},${g},${b},${a})`
      ctx.beginPath()
      ctx.arc(x, y, star.size * 0.5 * scale, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    })
  }

  const drawVignette = () => {
    const cx = width / 2
    const cy = height / 2
    const radius = Math.hypot(width, height) / 2
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
    gradient.addColorStop(0, "rgba(0,0,0,0)")
    gradient.addColorStop(1, theme.vignetteColor)
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
  }

  let rafId = 0

  const animate = (t: number) => {
    const tSec = t / 1000
    mouseX += (targetMouseX - mouseX) * 0.07
    mouseY += (targetMouseY - mouseY) * 0.07
    const scrollBoost = 1 + (scrollProgressRef?.current ?? 0) * 0.6

    ctx.clearRect(0, 0, width, height)
    theme.paintBase(ctx, width, height)
    drawMilkyWay(tSec, scrollBoost)
    drawNebula(scrollBoost)
    drawDust(tSec, scrollBoost)
    drawBokeh()
    drawStars(tSec)

    maybeSpawnMeteor(tSec)
    updateMeteor()
    drawMeteor()

    if (theme.vignette) drawVignette()

    rafId = requestAnimationFrame(animate)
  }

  resize()
  window.addEventListener("resize", resize)
  window.addEventListener("pointermove", handlePointerMove)
  rafId = requestAnimationFrame(animate)

  return () => {
    cancelAnimationFrame(rafId)
    window.removeEventListener("resize", resize)
    window.removeEventListener("pointermove", handlePointerMove)
  }
}
