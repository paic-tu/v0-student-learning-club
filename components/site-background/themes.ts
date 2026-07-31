export interface WeightedColor {
  r: number
  g: number
  b: number
  weight: number
}

export interface StarLayerConfig {
  share: number
  sizeMin: number
  sizeMax: number
  opacityMin: number
  opacityMax: number
  depthMin: number
  depthMax: number
}

export interface MeteorGradientStop {
  offset: number
  color: string
}

export interface MeteorConfig {
  gradientStops: MeteorGradientStop[]
  coreLineWidth: number
  headGlowColor: (alpha: number) => string
}

export interface BackgroundTheme {
  mode: "dark" | "light"
  paintBase: (ctx: CanvasRenderingContext2D, w: number, h: number) => void
  starDensityDivisor: number
  starLayers: StarLayerConfig[]
  starColors: WeightedColor[]
  starShadowBlurMultiplier: number
  nebulaColors: [number, number, number][]
  nebulaAlphaMin: number
  nebulaAlphaMax: number
  nebulaBlurMin: number
  nebulaBlurMax: number
  nebulaDepthMin: number
  nebulaDepthMax: number
  bokehRadiusMin: number
  bokehRadiusMax: number
  bokehAlphaMin: number
  bokehAlphaMax: number
  bokehBlur: number
  bokehDepth: number
  vignette: boolean
  vignetteColor: string
  meteor: MeteorConfig
}

const IDENTITY_COLORS: [number, number, number][] = [
  [110, 61, 243],
  [12, 216, 193],
  [74, 94, 238],
]

export const DARK_THEME: BackgroundTheme = {
  mode: "dark",
  paintBase: (ctx, w, h) => {
    ctx.fillStyle = "#05050d"
    ctx.fillRect(0, 0, w, h)
  },
  starDensityDivisor: 1800,
  starLayers: [
    { share: 0.75, sizeMin: 0.4, sizeMax: 1, opacityMin: 0.15, opacityMax: 0.35, depthMin: 3, depthMax: 9 },
    { share: 0.25, sizeMin: 1.8, sizeMax: 2.6, opacityMin: 0.45, opacityMax: 0.65, depthMin: 32, depthMax: 50 },
  ],
  starColors: [
    { r: 255, g: 255, b: 255, weight: 0.55 },
    { r: 198, g: 213, b: 255, weight: 0.23 },
    { r: 255, g: 244, b: 214, weight: 0.14 },
    { r: 255, g: 209, b: 160, weight: 0.06 },
    { r: 255, g: 180, b: 138, weight: 0.02 },
  ],
  starShadowBlurMultiplier: 2,
  nebulaColors: IDENTITY_COLORS,
  nebulaAlphaMin: 0.025,
  nebulaAlphaMax: 0.04,
  nebulaBlurMin: 65,
  nebulaBlurMax: 100,
  nebulaDepthMin: 8,
  nebulaDepthMax: 34,
  bokehRadiusMin: 34,
  bokehRadiusMax: 60,
  bokehAlphaMin: 0.03,
  bokehAlphaMax: 0.04,
  bokehBlur: 14,
  bokehDepth: 65,
  vignette: true,
  vignetteColor: "rgba(0,0,0,0.22)",
  meteor: {
    gradientStops: [
      { offset: 0, color: "rgba(255,255,255,0.9)" },
      { offset: 1, color: "rgba(150,180,255,0)" },
    ],
    coreLineWidth: 0.7,
    headGlowColor: (a) => `rgba(255,255,255,${a})`,
  },
}

export const LIGHT_THEME: BackgroundTheme = {
  mode: "light",
  paintBase: (ctx, w, h) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, h)
    gradient.addColorStop(0, "#d7ddf3")
    gradient.addColorStop(0.32, "#e3e1f6")
    gradient.addColorStop(0.62, "#f0edf9")
    gradient.addColorStop(1, "#f8f6fb")
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, w, h)

    const sky = ctx.createRadialGradient(w / 2, h * 0.18, 0, w / 2, h * 0.18, Math.max(w, h) * 0.65)
    sky.addColorStop(0, "rgba(255,255,255,0.35)")
    sky.addColorStop(0.4, "rgba(255,255,255,0.12)")
    sky.addColorStop(1, "rgba(255,255,255,0)")
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, w, h)
  },
  starDensityDivisor: 4300,
  starLayers: [
    { share: 0.7, sizeMin: 1, sizeMax: 1.8, opacityMin: 0.12, opacityMax: 0.22, depthMin: 4, depthMax: 12 },
    { share: 0.3, sizeMin: 1.8, sizeMax: 2.6, opacityMin: 0.18, opacityMax: 0.3, depthMin: 18, depthMax: 32 },
  ],
  starColors: [
    { r: 110, g: 61, b: 243, weight: 1 / 3 },
    { r: 74, g: 94, b: 238, weight: 1 / 3 },
    { r: 12, g: 216, b: 193, weight: 1 / 3 },
  ],
  starShadowBlurMultiplier: 3,
  nebulaColors: IDENTITY_COLORS,
  nebulaAlphaMin: 0.045,
  nebulaAlphaMax: 0.065,
  nebulaBlurMin: 75,
  nebulaBlurMax: 105,
  nebulaDepthMin: 8,
  nebulaDepthMax: 34,
  bokehRadiusMin: 60,
  bokehRadiusMax: 130,
  bokehAlphaMin: 0.06,
  bokehAlphaMax: 0.09,
  bokehBlur: 22,
  bokehDepth: 65,
  vignette: true,
  vignetteColor: "rgba(35,30,70,0.1)",
  meteor: {
    gradientStops: [
      { offset: 0, color: "rgba(90,70,235,0.85)" },
      { offset: 0.3, color: "rgba(110,61,243,0.5)" },
      { offset: 0.65, color: "rgba(12,180,193,0.22)" },
      { offset: 1, color: "rgba(12,180,193,0)" },
    ],
    coreLineWidth: 0.8,
    headGlowColor: (a) => `rgba(120,100,255,${a})`,
  },
}
