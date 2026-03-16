export function extractYouTubeVideoId(input: string) {
  const url = (input || "").trim()
  if (!url) return null

  if (url.startsWith("yt:")) {
    const id = url.slice(3).trim()
    return id.length === 11 ? id : null
  }

  const re = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i
  const m = url.match(re)
  return m?.[1] || null
}

export function toYouTubeStorageValue(videoId: string) {
  return `yt:${videoId}`
}

export function buildYouTubeNoCookieEmbedUrl(videoId: string) {
  const params = new URLSearchParams({
    modestbranding: "1",
    rel: "0",
    playsinline: "1",
    enablejsapi: "1",
    origin: process.env.NEXT_PUBLIC_APP_URL ? String(process.env.NEXT_PUBLIC_APP_URL).replace(/\/+$/, "") : "",
  })
  if (!params.get("origin")) params.delete("origin")
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`
}

