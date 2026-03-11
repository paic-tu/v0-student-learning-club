import { NextResponse, type NextRequest } from "next/server"

type TenorMediaFormat = {
  url: string
  dims?: [number, number]
}

type TenorResult = {
  id: string
  media_formats: Record<string, TenorMediaFormat>
}

type TenorResponse = {
  results: TenorResult[]
  next?: string
}

function pickUrl(r: TenorResult): string | null {
  const mf = r.media_formats || {}
  return (
    mf.tinygif?.url ||
    mf.gif?.url ||
    mf.tinymp4?.url ||
    mf.mp4?.url ||
    mf.tinywebm?.url ||
    mf.webm?.url ||
    null
  )
}

const FALLBACK_GIFS: string[] = [
  "https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif",
  "https://media.giphy.com/media/l0HlHFRb68qVPnGv6/giphy.gif",
  "https://media.giphy.com/media/xT5LMHxhOfscxPfIfm/giphy.gif",
  "https://media.giphy.com/media/3o6Zt481isNVuQI1l6/giphy.gif",
  "https://media.giphy.com/media/l0MYt5qxb9d3DJBzk/giphy.gif",
  "https://media.giphy.com/media/xT9IgG50Fb7Mi0prBC/giphy.gif",
  "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif",
  "https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif",
  "https://media.giphy.com/media/l4pTfx2qLszoacZRS/giphy.gif",
  "https://media.giphy.com/media/3o7aCTfyhYawdOXcFW/giphy.gif",
  "https://media.giphy.com/media/26BRzozg4TCBXv6QU/giphy.gif",
  "https://media.giphy.com/media/5GoVLqeAOo6PK/giphy.gif",
]

const FALLBACK_STICKERS: string[] = [
  "https://media.giphy.com/media/l4KibWpbgWchgzRFK/giphy.gif",
  "https://media.giphy.com/media/3o7aD2saalBwwftBIY/giphy.gif",
  "https://media.giphy.com/media/l0HlMw7YnQ6q35jMs/giphy.gif",
  "https://media.giphy.com/media/xT9IgzoKnwFNmISR8I/giphy.gif",
  "https://media.giphy.com/media/3o7aD4oYf8lPpG4fWg/giphy.gif",
  "https://media.giphy.com/media/3o6Zt6ML6BklcajjsA/giphy.gif",
  "https://media.giphy.com/media/3oEduSbSGpGaRX2Vri/giphy.gif",
  "https://media.giphy.com/media/3o7aCTfyhYawdOXcFW/giphy.gif",
]

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = (searchParams.get("type") || "gif").toLowerCase()
  const q = (searchParams.get("q") || "").trim()
  const pos = searchParams.get("pos") || undefined
  const limit = Math.min(Number(searchParams.get("limit") || 24) || 24, 48)

  const key = process.env.TENOR_API_KEY
  const clientKey = process.env.TENOR_CLIENT_KEY || "neon-web"

  if (!key) {
    const data = type === "sticker" ? FALLBACK_STICKERS : FALLBACK_GIFS
    const filtered = q
      ? data.filter((u) => u.toLowerCase().includes(q.toLowerCase()))
      : data
    return NextResponse.json({ results: filtered.slice(0, limit), next: null, source: "fallback" })
  }

  const isSticker = type === "sticker"
  const endpoint = q ? "search" : "featured"
  const url = new URL(`https://tenor.googleapis.com/v2/${endpoint}`)
  url.searchParams.set("key", key)
  url.searchParams.set("client_key", clientKey)
  url.searchParams.set("limit", String(limit))
  url.searchParams.set("media_filter", "gif,tinygif,mp4,tinymp4,webm,tinywebm")
  url.searchParams.set("contentfilter", "medium")
  url.searchParams.set("country", "SA")
  url.searchParams.set("locale", "ar_SA")
  url.searchParams.set("searchfilter", isSticker ? "sticker" : "gif")
  if (q) url.searchParams.set("q", q)
  if (pos) url.searchParams.set("pos", pos)

  try {
    const resp = await fetch(url.toString(), { next: { revalidate: 300 } })
    if (!resp.ok) {
      return NextResponse.json({ results: [], next: null, error: "Tenor request failed" }, { status: 200 })
    }
    const json = (await resp.json()) as TenorResponse
    const results = (json.results || [])
      .map(pickUrl)
      .filter((u): u is string => Boolean(u))
    return NextResponse.json({ results, next: json.next || null, source: "tenor" })
  } catch {
    return NextResponse.json({ results: [], next: null, error: "Tenor request error" }, { status: 200 })
  }
}

