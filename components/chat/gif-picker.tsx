"use client"

import { useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Smile, Search, Sticker } from "lucide-react"

// Mock data for GIFs and Stickers (In a real app, this would come from Giphy/Tenor API)
const GIFS = [
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbW5sYnR3b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5/3o7TKSjRrfIPjeiVyM/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbW5sYnR3b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5/l0HlHFRb68qVPnGv6/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbW5sYnR3b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5/xT5LMHxhOfscxPfIfm/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbW5sYnR3b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5/3o6Zt481isNVuQI1l6/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbW5sYnR3b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5/l0MYt5qxb9d3DJBzk/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbW5sYnR3b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5/xT9IgG50Fb7Mi0prBC/giphy.gif",
]

const STICKERS = [
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbW5sYnR3b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5/l4KibWpbgWchgzRFK/giphy.gif", // Sticker-like GIF
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbW5sYnR3b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5/3o7aD2saalBwwftBIY/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbW5sYnR3b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5/l0HlMw7YnQ6q35jMs/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbW5sYnR3b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5b3Z5/xT9IgzoKnwFNmISR8I/giphy.gif",
]

interface GifPickerProps {
  onSelect: (url: string, type: "gif" | "sticker") => void
}

export function GifPicker({ onSelect }: GifPickerProps) {
  const [search, setSearch] = useState("")

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground hover:text-foreground rounded-full shrink-0">
          <Smile className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start" side="top">
        <Tabs defaultValue="gifs" className="w-full">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-8 h-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <TabsList className="w-full mt-3 grid grid-cols-2">
              <TabsTrigger value="gifs">GIFs</TabsTrigger>
              <TabsTrigger value="stickers">Stickers</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="gifs" className="mt-0">
            <ScrollArea className="h-64 p-2">
              <div className="grid grid-cols-2 gap-2">
                {GIFS.map((gif, i) => (
                  <button
                    key={i}
                    className="relative aspect-video rounded-md overflow-hidden hover:opacity-80 transition-opacity"
                    onClick={() => onSelect(gif, "gif")}
                  >
                    <img src={gif} alt="GIF" className="object-cover w-full h-full" />
                  </button>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="stickers" className="mt-0">
            <ScrollArea className="h-64 p-2">
              <div className="grid grid-cols-3 gap-2">
                {STICKERS.map((sticker, i) => (
                  <button
                    key={i}
                    className="relative aspect-square rounded-md overflow-hidden hover:opacity-80 transition-opacity p-1"
                    onClick={() => onSelect(sticker, "sticker")}
                  >
                    <img src={sticker} alt="Sticker" className="object-contain w-full h-full" />
                  </button>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  )
}
