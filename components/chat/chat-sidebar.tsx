"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PlusCircle, MessageSquare, Users } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

interface ChatSidebarProps {
  conversations: any[]
  selectedId?: string
  onSelect: (id: string) => void
  onCommunityChat: () => void
  action?: React.ReactNode
}

export function ChatSidebar({ conversations, selectedId, onSelect, onCommunityChat, action }: ChatSidebarProps) {
  const { language } = useLanguage()
  const isAr = language === "ar"
  return (
    <div className={cn("flex flex-col h-full w-full md:w-80 bg-background overflow-hidden", isAr ? "md:border-l" : "md:border-r")}>
      <div className="h-16 px-4 border-b flex items-center justify-between bg-background/95 backdrop-blur z-10 shrink-0">
        <h2 className="font-semibold text-lg">{isAr ? "الرسائل" : "Messages"}</h2>
        {action}
      </div>

      <div className="p-2 space-y-1">
        <Button
          variant={selectedId === "community" ? "secondary" : "ghost"}
          className={cn(
            "w-full justify-start gap-3 h-12",
            selectedId === "community" && "bg-secondary"
          )}
          onClick={onCommunityChat}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <span className="font-medium">{isAr ? "الدردشة العامة" : "Community Chat"}</span>
        </Button>
      </div>

      <div className="flex-1 min-h-0 relative" dir={isAr ? "rtl" : "ltr"}>
        <ScrollArea className="h-full w-full absolute inset-0">
          <div className="flex flex-col gap-1 p-2">
            {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg transition-all text-left group",
                selectedId === conv.id 
                  ? "bg-accent text-accent-foreground shadow-sm" 
                  : "hover:bg-muted/50"
              )}
            >
              <div className="relative">
                <Avatar className="h-10 w-10 border-2 border-background">
                  <AvatarImage src={conv.image || "/placeholder-user.jpg"} />
                  <AvatarFallback>{conv.name[0]}</AvatarFallback>
                </Avatar>
                {/* Online indicator could go here */}
                {conv.unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-medium text-white ring-2 ring-background">
                    {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                  </span>
                )}
              </div>
              
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center justify-between mb-0.5" dir={isAr ? "ltr" : "ltr"}>
                  <span className={cn("font-medium truncate text-sm", isAr && "text-left")}>{conv.name}</span>
                  {conv.lastMessage && (
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {new Date(conv.lastMessage.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
                {conv.lastMessage ? (
                  <p className={cn("text-xs text-muted-foreground truncate opacity-80 group-hover:opacity-100 transition-opacity", isAr && "text-left")} dir={isAr ? "ltr" : "ltr"}>
                    <span className="font-medium text-foreground/80">
                      {conv.lastMessage.senderId === "me" ? (isAr ? "أنا: " : "You: ") : ""} 
                    </span>
                    {conv.lastMessage.content}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground italic">{isAr ? "لا توجد رسائل بعد" : "No messages yet"}</p>
                )}
              </div>
            </button>
          ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
