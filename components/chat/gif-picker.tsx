"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Smile, Search, Loader2 } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

type PickerTab = "gifs" | "stickers"
type TenorType = "gif" | "sticker"

async function fetchTenor(params: { type: TenorType; q: string; pos?: string | null; limit?: number }) {
  const url = new URL("/api/tenor", window.location.origin)
  url.searchParams.set("type", params.type)
  if (params.q) url.searchParams.set("q", params.q)
  if (params.pos) url.searchParams.set("pos", params.pos)
  url.searchParams.set("limit", String(params.limit ?? 24))
  const res = await fetch(url.toString())
  const json = (await res.json()) as { results?: string[]; next?: string | null }
  return { results: json.results ?? [], next: json.next ?? null }
}

interface GifPickerProps {
  onSelect: (url: string, type: "gif" | "sticker") => void
}

export function GifPicker({ onSelect }: GifPickerProps) {
  const { language } = useLanguage()
  const isAr = language === "ar"
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<PickerTab>("gifs")
  const [search, setSearch] = useState("")
  const [query, setQuery] = useState("")
  const [gifs, setGifs] = useState<string[]>([])
  const [stickers, setStickers] = useState<string[]>([])
  const [gifNext, setGifNext] = useState<string | null>(null)
  const [stickerNext, setStickerNext] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const activeRequestRef = useRef(0)

  useEffect(() => {
    const t = setTimeout(() => setQuery(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    if (!open) return
    const requestId = ++activeRequestRef.current
    const type: TenorType = tab === "gifs" ? "gif" : "sticker"

    setLoading(true)
    void (async () => {
      const { results, next } = await fetchTenor({ type, q: query, limit: 30 })
      if (activeRequestRef.current !== requestId) return

      if (tab === "gifs") {
        setGifs(results)
        setGifNext(next)
      } else {
        setStickers(results)
        setStickerNext(next)
      }
      setLoading(false)
    })()
  }, [open, tab, query])

  const activeItems = tab === "gifs" ? gifs : stickers
  const activeNext = tab === "gifs" ? gifNext : stickerNext

  const loadMore = async () => {
    if (!open) return
    if (!activeNext) return
    const type: TenorType = tab === "gifs" ? "gif" : "sticker"
    setLoadingMore(true)
    const { results, next } = await fetchTenor({ type, q: query, pos: activeNext, limit: 30 })
    if (tab === "gifs") {
      setGifs((prev) => [...prev, ...results])
      setGifNext(next)
    } else {
      setStickers((prev) => [...prev, ...results])
      setStickerNext(next)
    }
    setLoadingMore(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground hover:text-foreground rounded-full shrink-0">
          <Smile className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start" side="top">
        <Tabs value={tab} onValueChange={(v) => setTab(v as PickerTab)} className="w-full">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={isAr ? "بحث..." : "Search..."}
                className="pl-8 h-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <TabsList className="w-full mt-3 grid grid-cols-2">
              <TabsTrigger value="gifs">GIFs</TabsTrigger>
              <TabsTrigger value="stickers">{isAr ? "ملصقات" : "Stickers"}</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="gifs" className="mt-0">
            <ScrollArea className="h-64 p-2">
              {loading && tab === "gifs" ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : (
                activeItems.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
                    {isAr ? "لا توجد نتائج" : "No results"}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {activeItems.map((gif, i) => (
                      <button
                        key={`${gif}-${i}`}
                        className="relative aspect-video rounded-md overflow-hidden hover:opacity-80 transition-opacity"
                        onClick={() => onSelect(gif, "gif")}
                      >
                        <Image src={gif} alt="GIF" fill className="object-cover" unoptimized />
                      </button>
                    ))}
                  </div>
                )
              )}
              <div className="pt-2">
                {activeNext && tab === "gifs" && (
                  <Button type="button" variant="outline" className="w-full" disabled={loadingMore} onClick={loadMore}>
                    {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : (isAr ? "تحميل المزيد" : "Load more")}
                  </Button>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="stickers" className="mt-0">
            <ScrollArea className="h-64 p-2">
              {loading && tab === "stickers" ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : (
                activeItems.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
                    {isAr ? "لا توجد نتائج" : "No results"}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {activeItems.map((sticker, i) => (
                      <button
                        key={`${sticker}-${i}`}
                        className="relative aspect-square rounded-md overflow-hidden hover:opacity-80 transition-opacity p-1"
                        onClick={() => onSelect(sticker, "sticker")}
                      >
                        <Image src={sticker} alt="Sticker" fill className="object-contain" unoptimized />
                      </button>
                    ))}
                  </div>
                )
              )}
              <div className="pt-2">
                {activeNext && tab === "stickers" && (
                  <Button type="button" variant="outline" className="w-full" disabled={loadingMore} onClick={loadMore}>
                    {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : (isAr ? "تحميل المزيد" : "Load more")}
                  </Button>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  )
}
