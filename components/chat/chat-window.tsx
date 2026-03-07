"use client"

import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, Loader2, ArrowLeft, Paperclip, Smile } from "lucide-react"
import { getMessages, sendMessage, notifyTyping, getTypingUsers } from "@/lib/actions/chat"
import { cn } from "@/lib/utils"
import { GifPicker } from "./gif-picker"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const formSchema = z.object({
  content: z.string().min(1),
})

interface ChatWindowProps {
  conversationId: string
  currentUserId: string
  recipientName?: string
  recipientImage?: string
  onBack?: () => void
}

export function ChatWindow({ conversationId, currentUserId, recipientName, recipientImage, onBack }: ChatWindowProps) {
  const [messages, setMessages] = useState<any[]>([])
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const lastTypedTime = useRef<number>(0)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: "",
    },
  })

  // Format date helper
  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === now.toDateString()) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    } else {
      return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  }

  // Poll for new messages and typing status
  useEffect(() => {
    let interval: NodeJS.Timeout

    const fetchData = async () => {
      try {
        const [msgsData, typingData] = await Promise.all([
          getMessages(conversationId),
          getTypingUsers(conversationId)
        ])
        setMessages(msgsData)
        setTypingUsers(typingData)
        setLoading(false)
      } catch (error) {
        console.error("Failed to fetch chat data:", error)
      }
    }

    fetchData()
    interval = setInterval(fetchData, 3000) // Poll every 3 seconds

    return () => clearInterval(interval)
  }, [conversationId])

  // Scroll to bottom on new messages
  const prevMessagesLength = useRef(0)

  useEffect(() => {
    if (messages.length > prevMessagesLength.current) {
      if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: "smooth" })
      }
    }
    prevMessagesLength.current = messages.length
  }, [messages.length])

  const watchContent = form.watch("content")

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!values.content.trim()) return

    try {
      await sendMessage(conversationId, values.content)
      form.reset()
      // Optimistic update could be added here
      const data = await getMessages(conversationId)
      setMessages(data)
    } catch (error) {
      console.error("Failed to send message:", error)
    }
  }

  async function onGifSelect(url: string, type: "gif" | "sticker") {
    try {
      await sendMessage(conversationId, type === "gif" ? "Sent a GIF" : "Sent a Sticker", type, url)
      const data = await getMessages(conversationId)
      setMessages(data)
    } catch (error) {
      console.error("Failed to send GIF/Sticker:", error)
    }
  }

  return (
    <div className="flex flex-col h-full bg-background w-full">
      <div className="h-16 px-4 border-b flex items-center gap-3 sticky top-0 bg-background/95 backdrop-blur z-10 shadow-sm">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden -ml-2 shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <Avatar className="h-9 w-9 border shrink-0">
            <AvatarImage src={recipientImage || "/placeholder-user.jpg"} />
            <AvatarFallback>{recipientName?.[0]}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col overflow-hidden">
          <h2 className="font-semibold text-sm leading-none truncate">{recipientName || "Chat"}</h2>
          {typingUsers.length > 0 && (
            <span className="text-[10px] text-muted-foreground animate-pulse truncate">
              {typingUsers.length === 1 ? "typing..." : "people typing..."}
            </span>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="flex flex-col gap-4 pb-4">
          {loading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
          messages.map((msg, index) => {
            const isMe = msg.senderId === currentUserId
            const isSameSender = index > 0 && messages[index - 1].senderId === msg.senderId
            
            return (
            <div
              key={msg.id}
              className={cn(
                "flex items-start gap-2 hover:bg-muted/30 p-1 rounded-xl transition-colors group max-w-[85%] md:max-w-[70%]",
                !isSameSender && "mt-6",
                isMe ? "flex-row-reverse ml-auto bg-primary/5 hover:bg-primary/10" : "mr-auto"
              )}
            >
              {!isSameSender ? (
                <Avatar className="w-8 h-8 mt-1 cursor-pointer hover:scale-105 transition-transform">
                  <AvatarImage src={msg.sender?.avatarUrl || "/placeholder-user.jpg"} />
                  <AvatarFallback>{msg.sender?.name?.[0]}</AvatarFallback>
                </Avatar>
              ) : (
                 <div className="w-8" /> 
              )}
              
              <div className={cn("flex-1 min-w-0 flex flex-col", isMe && "items-end")}>
                {!isSameSender && (
                  <div className={cn("flex items-center gap-2 mb-1 opacity-70 group-hover:opacity-100 transition-opacity", isMe && "flex-row-reverse")}>
                    <span className="font-semibold text-sm hover:underline cursor-pointer">
                      {msg.sender?.name}
                    </span>
                    {msg.sender?.role && (
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-full text-white font-medium uppercase tracking-wider",
                        msg.sender.role === "admin" ? "bg-red-500/90" :
                        msg.sender.role === "instructor" ? "bg-blue-500/90" :
                        "bg-green-500/90" // Default for student
                      )}>
                        {msg.sender.role}
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground mx-1">
                      {formatMessageDate(msg.createdAt)}
                    </span>
                  </div>
                )}
                <div className={cn(
                  "relative text-sm leading-relaxed whitespace-pre-wrap shadow-sm transition-all",
                  msg.type === "sticker" ? "bg-transparent shadow-none p-0 min-w-0" :
                  msg.type === "gif" ? "p-0 overflow-hidden rounded-[20px] min-w-[200px]" :
                  "px-4 py-2 pb-6 rounded-[22px] min-w-[120px]",
                  isMe 
                    ? (msg.type === "text" ? "bg-primary text-primary-foreground rounded-tr-none" : "")
                    : (msg.type === "text" ? "bg-white dark:bg-muted text-foreground/90 rounded-tl-none border" : "")
                )}>
                  {msg.type === "sticker" ? (
                    <img src={msg.attachmentUrl} alt="Sticker" className="w-32 h-32 object-contain" />
                  ) : msg.type === "gif" ? (
                    <img src={msg.attachmentUrl} alt="GIF" className="w-full max-w-[250px] h-auto object-cover" />
                  ) : (
                    msg.content
                  )}
                  
                  {msg.type === "text" && (
                    <span className={cn(
                      "text-[10px] absolute bottom-1.5 opacity-70 select-none font-medium",
                      isMe ? "left-3 text-primary-foreground/80" : "right-3 text-muted-foreground"
                    )}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
          })
          )}
          {typingUsers.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground px-2 animate-pulse">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>
                {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...
              </span>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="p-3 border-t bg-background/95 backdrop-blur">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-end gap-2 bg-muted/50 p-2 rounded-2xl border focus-within:ring-1 focus-within:ring-ring transition-all">
            <Button type="button" size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground hover:text-foreground rounded-full shrink-0">
              <Paperclip className="h-5 w-5" />
            </Button>

            <GifPicker onSelect={onGifSelect} />
            
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem className="flex-1 min-w-0">
                  <FormControl>
                    <Textarea 
                      placeholder="Type a message..." 
                      {...field} 
                      className="min-h-[20px] max-h-32 resize-none py-2.5 px-0 bg-transparent border-0 focus-visible:ring-0 shadow-none leading-relaxed"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          form.handleSubmit(onSubmit)()
                          return
                        }
                        
                        // Notify typing
                        const now = Date.now()
                        if (now - lastTypedTime.current > 2000) {
                          lastTypedTime.current = now
                          notifyTyping(conversationId)
                        }
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <Button type="submit" size="icon" disabled={form.formState.isSubmitting || !watchContent?.trim()} className="h-9 w-9 rounded-full shrink-0 mb-0.5 transition-all">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </Form>
      </div>
    </div>
  )
}
