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
  // Pre-rendered (shadowBlur baked in) once per unique color+size bucket and
  // reused via drawImage — see getStarSprite.
  sprite: HTMLCanvasElement
  spriteSize: number
}

interface Blob {
  x: number
  y: number
  radius: number
  alpha: number
  blur: number
  depth: number
  color: [number, number, number]
  // Pre-rendered (ctx.filter blur baked in) once when the blob is created,
  // then reused every frame via drawImage instead of re-running the blur
  // filter and rebuilding the gradient on every frame.
  sprite: HTMLCanvasElement
  spriteSize: number
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
  // opacity is fixed at creation time, so the rgba() string is built once
  // here instead of every particle on every frame.
  fillStyle: string
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
): () => void {
  const ctx = canvas.getContext("2d")
  if (!ctx) return () => {}

  let width = 0
  let height = 0
  let dpr = 1
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

  // Touch devices have no real cursor — "pointermove" also fires while
  // scrolling/dragging on touch, which made the parallax appear to jump
  // around during scroll. On devices without a fine hover-capable pointer
  // (i.e. touch/mobile), drive the same parallax target automatically with
  // a slow ambient drift instead of listening to pointer input; desktops
  // with a real mouse keep the existing cursor-driven parallax untouched.
  const hasFinePointer =
    typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches

  // Backdrop = base fill + Milky Way (at its undrifted baseline position) +
  // vignette, composited once per resize onto an offscreen canvas that is
  // exactly the same size as the main canvas (no extra margin/bounding
  // box — unlike the earlier per-blob sprite approach, this image is drawn
  // 1:1 with no scaling, so there's no oversized-transparent-area cost).
  // Every frame this collapses to a single drawImage instead of separately
  // repainting the base, retransforming for the Milky Way band, and
  // refilling the vignette. The Milky Way's slow horizontal drift is
  // preserved by offsetting where the backdrop is blitted, not by
  // redrawing it — see animate().
  let backdropCanvas: HTMLCanvasElement | null = null

  const buildBackdrop = () => {
    const canvasEl = document.createElement("canvas")
    canvasEl.width = width * dpr
    canvasEl.height = height * dpr
    const bctx = canvasEl.getContext("2d")!
    bctx.scale(dpr, dpr)

    // a) base fill — gradients (light theme) built once here instead of
    // every animation frame.
    theme.paintBase(bctx, width, height)

    // b) Milky Way, drawn once at drift = 0.
    const [mr, mg, mb] = theme.milkyWayColor
    const bandLength = Math.max(width, height) * 1.6
    const bandWidth = Math.min(width, height) * 0.55
    bctx.save()
    bctx.translate(width / 2, height / 2)
    bctx.rotate((theme.milkyWayAngleDeg * Math.PI) / 180)
    const milkyWayGradient = bctx.createLinearGradient(0, -bandWidth / 2, 0, bandWidth / 2)
    milkyWayGradient.addColorStop(0, `rgba(${mr},${mg},${mb},0)`)
    milkyWayGradient.addColorStop(0.5, `rgba(${mr},${mg},${mb},${theme.milkyWayAlpha})`)
    milkyWayGradient.addColorStop(1, `rgba(${mr},${mg},${mb},0)`)
    bctx.fillStyle = milkyWayGradient
    bctx.fillRect(-bandLength / 2, -bandWidth / 2, bandLength, bandWidth)
    bctx.restore()

    // c) vignette.
    if (theme.vignette) {
      const cx = width / 2
      const cy = height / 2
      const radius = Math.hypot(width, height) / 2
      const vignetteGradient = bctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
      vignetteGradient.addColorStop(0, "rgba(0,0,0,0)")
      vignetteGradient.addColorStop(1, theme.vignetteColor)
      bctx.fillStyle = vignetteGradient
      bctx.fillRect(0, 0, width, height)
    }

    backdropCanvas = canvasEl
  }

  // Pre-rendered star sprites, keyed by color + size bucket (rounded to
  // 0.1px — far below what's perceptible at these sizes). Each unique
  // combination pays for shadowBlur exactly once instead of every frame for
  // every star; drawStars then just blits the cached bitmap.
  const starSpriteCache = new Map<string, { canvas: HTMLCanvasElement; size: number }>()

  const getStarSprite = (size: number, color: WeightedColor) => {
    const bucketedSize = Math.round(size * 10) / 10
    const key = `${color.r},${color.g},${color.b}|${bucketedSize}|${dpr}`
    const cached = starSpriteCache.get(key)
    if (cached) return cached

    const shadowBlur = bucketedSize * theme.starShadowBlurMultiplier
    const radius = bucketedSize * 0.5
    // Generous margin so the blurred halo never gets clipped by the sprite
    // canvas edge (shadowBlur's visible falloff extends well past its own
    // pixel value).
    const margin = shadowBlur * 3
    const spriteSize = Math.ceil((radius + margin) * 2)

    const spriteCanvas = document.createElement("canvas")
    spriteCanvas.width = spriteSize * dpr
    spriteCanvas.height = spriteSize * dpr
    const spriteCtx = spriteCanvas.getContext("2d")!
    spriteCtx.scale(dpr, dpr)
    const center = spriteSize / 2
    spriteCtx.shadowBlur = shadowBlur
    spriteCtx.shadowColor = `rgba(${color.r},${color.g},${color.b},1)`
    spriteCtx.fillStyle = `rgba(${color.r},${color.g},${color.b},1)`
    spriteCtx.beginPath()
    spriteCtx.arc(center, center, radius, 0, Math.PI * 2)
    spriteCtx.fill()

    const entry = { canvas: spriteCanvas, size: spriteSize }
    starSpriteCache.set(key, entry)
    return entry
  }

  const createStars = () => {
    const total = Math.round((width * height) / theme.starDensityDivisor)
    const next: Star[] = []
    theme.starLayers.forEach((layer) => {
      const count = Math.round(total * layer.share)
      for (let i = 0; i < count; i++) {
        const size = rand(layer.sizeMin, layer.sizeMax)
        const color = pickWeightedColor(theme.starColors)
        const sprite = getStarSprite(size, color)
        next.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size,
          opacity: rand(layer.opacityMin, layer.opacityMax),
          depth: rand(layer.depthMin, layer.depthMax),
          phase: rand(0, Math.PI * 2),
          speed: rand(0.4, 1.4),
          color,
          sprite: sprite.canvas,
          spriteSize: sprite.size,
        })
      }
    })
    stars = next
  }

  // A blob's blurred gradient circle only depends on its radius/alpha/blur/
  // color, none of which change between frames — pre-render it once (blur
  // filter baked in) to an offscreen canvas instead of re-running
  // ctx.filter + createRadialGradient on every frame.
  const buildBlobSprite = (radius: number, blur: number, alpha: number, color: [number, number, number]) => {
    const margin = blur * 2.5
    const spriteSize = Math.ceil((radius + margin) * 2)
    const spriteCanvas = document.createElement("canvas")
    spriteCanvas.width = spriteSize * dpr
    spriteCanvas.height = spriteSize * dpr
    const spriteCtx = spriteCanvas.getContext("2d")!
    spriteCtx.scale(dpr, dpr)
    const center = spriteSize / 2
    const [r, g, b] = color
    spriteCtx.filter = `blur(${blur}px)`
    const gradient = spriteCtx.createRadialGradient(center, center, 0, center, center, radius)
    gradient.addColorStop(0, `rgba(${r},${g},${b},${alpha})`)
    gradient.addColorStop(1, `rgba(${r},${g},${b},0)`)
    spriteCtx.fillStyle = gradient
    spriteCtx.beginPath()
    spriteCtx.arc(center, center, radius, 0, Math.PI * 2)
    spriteCtx.fill()
    return { canvas: spriteCanvas, size: spriteSize }
  }

  const createNebula = () => {
    nebulaBlobs = Array.from({ length: 5 }, () => {
      const radius = rand(0.35, 0.6) * Math.max(width, height)
      const alpha = rand(theme.nebulaAlphaMin, theme.nebulaAlphaMax)
      const blur = rand(theme.nebulaBlurMin, theme.nebulaBlurMax)
      const color = theme.nebulaColors[Math.floor(Math.random() * theme.nebulaColors.length)]
      const sprite = buildBlobSprite(radius, blur, alpha, color)
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        radius,
        alpha,
        blur,
        depth: rand(theme.nebulaDepthMin, theme.nebulaDepthMax),
        color,
        sprite: sprite.canvas,
        spriteSize: sprite.size,
      }
    })
  }

  const createBokeh = () => {
    bokehBlobs = Array.from({ length: 5 }, () => {
      const radius = rand(theme.bokehRadiusMin, theme.bokehRadiusMax)
      const alpha = rand(theme.bokehAlphaMin, theme.bokehAlphaMax)
      const blur = theme.bokehBlur
      const color = theme.nebulaColors[Math.floor(Math.random() * theme.nebulaColors.length)]
      const sprite = buildBlobSprite(radius, blur, alpha, color)
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        radius,
        alpha,
        blur,
        depth: theme.bokehDepth,
        color,
        sprite: sprite.canvas,
        spriteSize: sprite.size,
      }
    })
  }

  const createDust = () => {
    const total = Math.round((width * height) / theme.dustDensityDivisor)
    const [dr, dg, db] = theme.dustColor
    dustParticles = Array.from({ length: total }, () => {
      const opacity = rand(theme.dustAlphaMin, theme.dustAlphaMax)
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        size: rand(theme.dustSizeMin, theme.dustSizeMax),
        opacity,
        depth: rand(2, 6),
        driftPhase: rand(0, Math.PI * 2),
        driftSpeed: rand(0.02, 0.05),
        fillStyle: `rgba(${dr},${dg},${db},${opacity})`,
      }
    })
  }

  const applyResize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2)
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
    buildBackdrop()
  }

  let resizeDebounceId: ReturnType<typeof setTimeout> | undefined

  // Mobile browsers show/hide their URL bar while scrolling, which fires
  // "resize" repeatedly with only a small height change (no width change).
  // Rebuilding the whole starfield on every one of those made the stars
  // appear to jump around rapidly while scrolling. Ignore resize events
  // that are just that toolbar toggling, and debounce genuine resizes so a
  // burst of events (e.g. dragging a window edge) only triggers one rebuild.
  const resize = () => {
    if (resizeDebounceId !== undefined) clearTimeout(resizeDebounceId)
    resizeDebounceId = setTimeout(() => {
      const widthChanged = window.innerWidth !== width
      const heightChangedSignificantly = Math.abs(window.innerHeight - height) > 120
      if (widthChanged || heightChangedSignificantly) {
        applyResize()
      }
    }, 150)
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

  const drawNebula = () => {
    nebulaBlobs.forEach((blob) => {
      const offsetX = (mouseX - 0.5) * blob.depth
      const offsetY = (mouseY - 0.5) * blob.depth
      const x = blob.x + offsetX
      const y = blob.y + offsetY
      ctx.drawImage(blob.sprite, x - blob.spriteSize / 2, y - blob.spriteSize / 2, blob.spriteSize, blob.spriteSize)
    })
  }

  const drawDust = (tSec: number) => {
    dustParticles.forEach((d) => {
      const offsetX = (mouseX - 0.5) * d.depth + Math.sin(tSec * d.driftSpeed + d.driftPhase) * 6
      const offsetY = (mouseY - 0.5) * d.depth + Math.cos(tSec * d.driftSpeed * 0.8 + d.driftPhase) * 4
      const x = d.x + offsetX
      const y = d.y + offsetY
      ctx.fillStyle = d.fillStyle
      ctx.beginPath()
      ctx.arc(x, y, d.size * 0.5, 0, Math.PI * 2)
      ctx.fill()
    })
  }

  // Blits the cached backdrop (base + Milky Way + vignette), offset
  // horizontally to reproduce the Milky Way's slow drift. Because the
  // backdrop is exactly viewport-sized (no margin), an offset blit alone
  // would leave a thin gap at one edge; drawing the same image a second
  // time at the wrapped-around position guarantees full coverage. The
  // second draw is almost entirely off-canvas (driftX is at most 2% of
  // width) so it costs next to nothing.
  const drawBackdrop = (tSec: number) => {
    if (!backdropCanvas) return
    const driftX = Math.sin(tSec * 0.01) * width * 0.02
    ctx.drawImage(backdropCanvas, driftX, 0)
    if (driftX > 0) {
      ctx.drawImage(backdropCanvas, driftX - width, 0)
    } else if (driftX < 0) {
      ctx.drawImage(backdropCanvas, driftX + width, 0)
    }
  }

  const drawBokeh = () => {
    bokehBlobs.forEach((blob) => {
      const offsetX = (mouseX - 0.5) * blob.depth
      const offsetY = (mouseY - 0.5) * blob.depth
      const x = blob.x + offsetX
      const y = blob.y + offsetY
      ctx.drawImage(blob.sprite, x - blob.spriteSize / 2, y - blob.spriteSize / 2, blob.spriteSize, blob.spriteSize)
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

      const a = Math.min(1, Math.max(alpha, 0))
      const drawSize = star.spriteSize * scale
      ctx.globalAlpha = a
      ctx.drawImage(star.sprite, x - drawSize / 2, y - drawSize / 2, drawSize, drawSize)
    })
    ctx.globalAlpha = 1
  }

  let rafId = 0
  let isRunning = true

  const animate = (t: number) => {
    if (!isRunning) return
    const tSec = t / 1000

    if (!hasFinePointer) {
      // Gentle ambient wander (two different slow frequencies so the path
      // doesn't feel like a simple back-and-forth) drives the same
      // parallax target that a real cursor would on desktop.
      targetMouseX = 0.5 + Math.sin(tSec * 0.15) * 0.28
      targetMouseY = 0.5 + Math.cos(tSec * 0.11) * 0.22
    }

    mouseX += (targetMouseX - mouseX) * 0.07
    mouseY += (targetMouseY - mouseY) * 0.07

    ctx.clearRect(0, 0, width, height)
    drawBackdrop(tSec)
    drawNebula()
    drawDust(tSec)
    drawBokeh()
    drawStars(tSec)

    maybeSpawnMeteor(tSec)
    updateMeteor()
    drawMeteor()

    rafId = requestAnimationFrame(animate)
  }

  const handleVisibilityChange = () => {
    isRunning = document.visibilityState === "visible"
    if (isRunning) {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(animate)
    }
  }

  applyResize()
  window.addEventListener("resize", resize)
  if (hasFinePointer) {
    window.addEventListener("pointermove", handlePointerMove)
  }
  document.addEventListener("visibilitychange", handleVisibilityChange)
  rafId = requestAnimationFrame(animate)

  return () => {
    cancelAnimationFrame(rafId)
    if (resizeDebounceId !== undefined) clearTimeout(resizeDebounceId)
    window.removeEventListener("resize", resize)
    if (hasFinePointer) {
      window.removeEventListener("pointermove", handlePointerMove)
    }
    document.removeEventListener("visibilitychange", handleVisibilityChange)
  }
}
