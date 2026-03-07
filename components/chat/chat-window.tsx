"use client"

import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, Loader2 } from "lucide-react"
import { getMessages, sendMessage } from "@/lib/actions/chat"
import { cn } from "@/lib/utils"

const formSchema = z.object({
  content: z.string().min(1),
})

interface ChatWindowProps {
  conversationId: string
  currentUserId: string
  recipientName?: string
  recipientImage?: string
}

export function ChatWindow({ conversationId, currentUserId, recipientName, recipientImage }: ChatWindowProps) {
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: "",
    },
  })

  // Poll for new messages
  useEffect(() => {
    let interval: NodeJS.Timeout

    const fetchMessages = async () => {
      try {
        const data = await getMessages(conversationId)
        setMessages(data)
        setLoading(false)
      } catch (error) {
        console.error("Failed to fetch messages:", error)
      }
    }

    fetchMessages()
    interval = setInterval(fetchMessages, 3000) // Poll every 3 seconds

    return () => clearInterval(interval)
  }, [conversationId])

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  async function onSubmit(values: z.infer<typeof formSchema>) {
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

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b flex items-center gap-3">
        <Avatar>
            <AvatarImage src={recipientImage} />
            <AvatarFallback>{recipientName?.[0]}</AvatarFallback>
        </Avatar>
        <h2 className="font-semibold">{recipientName || "Chat"}</h2>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="flex flex-col gap-4">
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
                  "flex items-start gap-4 hover:bg-muted/50 p-2 rounded-lg transition-colors group",
                  !isSameSender && "mt-4"
                )}
              >
                {!isSameSender ? (
                  <Avatar className="w-10 h-10 mt-0.5 cursor-pointer hover:drop-shadow-md transition-all">
                    <AvatarImage src={msg.sender?.avatarUrl} />
                    <AvatarFallback>{msg.sender?.name?.[0]}</AvatarFallback>
                  </Avatar>
                ) : (
                   <div className="w-10" /> 
                )}
                
                <div className="flex-1 min-w-0">
                  {!isSameSender && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm hover:underline cursor-pointer">
                        {msg.sender?.name}
                      </span>
                      {msg.sender?.role && (
                        <span className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded text-white font-medium uppercase tracking-wider",
                          msg.sender.role === "admin" ? "bg-red-500" :
                          msg.sender.role === "instructor" ? "bg-blue-500" :
                          "bg-green-500" // Default for student
                        )}>
                          {msg.sender.role}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground ml-1">
                        {new Date(msg.createdAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                  <p className={cn("text-sm leading-relaxed whitespace-pre-wrap text-foreground/90")}>
                    {msg.content}
                  </p>
                </div>
              </div>
            )
          })
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-2">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input placeholder="Type a message..." {...field} autoComplete="off" />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button type="submit" size="icon" disabled={form.formState.isSubmitting}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </Form>
      </div>
    </div>
  )
}
