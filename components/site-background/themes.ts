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
  dustDensityDivisor: number
  dustColor: [number, number, number]
  dustAlphaMin: number
  dustAlphaMax: number
  dustSizeMin: number
  dustSizeMax: number
  milkyWayColor: [number, number, number]
  milkyWayAlpha: number
  milkyWayAngleDeg: number
}

// Derived from the site's #212A6B identity color so the nebula/bokeh tint
// reads as an extension of that palette rather than a separate accent.
const IDENTITY_COLORS: [number, number, number][] = [
  [33, 42, 107],
  [63, 78, 168],
  [86, 64, 150],
]

// The light theme instead pulls straight from the live brand tokens
// (--primary / --accent, rgb(122,112,255) and rgb(0,191,183)) rather than the
// dark #212A6B family above - those read as muddy smudges on a near-white
// page instead of the logo's bright indigo-to-teal gradient.
const BRAND_LIGHT_COLORS: [number, number, number][] = [
  [122, 112, 255],
  [0, 191, 183],
  [86, 84, 220],
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
    { r: 255, g: 255, b: 255, weight: 0.48 },
    { r: 198, g: 213, b: 255, weight: 0.19 },
    { r: 150, g: 230, b: 255, weight: 0.08 },
    { r: 190, g: 170, b: 255, weight: 0.08 },
    { r: 255, g: 244, b: 214, weight: 0.11 },
    { r: 255, g: 209, b: 160, weight: 0.04 },
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
  dustDensityDivisor: 3500,
  dustColor: [200, 210, 255],
  dustAlphaMin: 0.02,
  dustAlphaMax: 0.05,
  dustSizeMin: 0.3,
  dustSizeMax: 0.7,
  milkyWayColor: [190, 205, 255],
  milkyWayAlpha: 0.05,
  milkyWayAngleDeg: -50,
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
    { share: 0.7, sizeMin: 1, sizeMax: 1.8, opacityMin: 0.35, opacityMax: 0.55, depthMin: 4, depthMax: 12 },
    { share: 0.3, sizeMin: 1.8, sizeMax: 2.6, opacityMin: 0.5, opacityMax: 0.75, depthMin: 18, depthMax: 32 },
  ],
  starColors: [
    { r: 122, g: 112, b: 255, weight: 0.42 },
    { r: 0, g: 191, b: 183, weight: 0.33 },
    { r: 86, g: 84, b: 220, weight: 0.25 },
  ],
  starShadowBlurMultiplier: 3.5,
  nebulaColors: BRAND_LIGHT_COLORS,
  nebulaAlphaMin: 0.1,
  nebulaAlphaMax: 0.16,
  nebulaBlurMin: 75,
  nebulaBlurMax: 105,
  nebulaDepthMin: 8,
  nebulaDepthMax: 34,
  bokehRadiusMin: 60,
  bokehRadiusMax: 130,
  bokehAlphaMin: 0.14,
  bokehAlphaMax: 0.2,
  bokehBlur: 22,
  bokehDepth: 65,
  vignette: true,
  vignetteColor: "rgba(50,40,120,0.12)",
  meteor: {
    gradientStops: [
      { offset: 0, color: "rgba(122,112,255,0.9)" },
      { offset: 0.3, color: "rgba(122,112,255,0.55)" },
      { offset: 0.65, color: "rgba(0,191,183,0.25)" },
      { offset: 1, color: "rgba(0,191,183,0)" },
    ],
    coreLineWidth: 0.8,
    headGlowColor: (a) => `rgba(122,112,255,${a})`,
  },
  dustDensityDivisor: 6000,
  dustColor: [100, 90, 220],
  dustAlphaMin: 0.05,
  dustAlphaMax: 0.09,
  dustSizeMin: 0.4,
  dustSizeMax: 0.8,
  milkyWayColor: [100, 110, 230],
  milkyWayAlpha: 0.08,
  milkyWayAngleDeg: -50,
}
