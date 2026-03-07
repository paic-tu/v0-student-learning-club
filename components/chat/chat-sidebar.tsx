"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PlusCircle, MessageSquare, Users } from "lucide-react"

interface ChatSidebarProps {
  conversations: any[]
  selectedId?: string
  onSelect: (id: string) => void
  onCommunityChat: () => void
  action?: React.ReactNode
}

export function ChatSidebar({ conversations, selectedId, onSelect, onCommunityChat, action }: ChatSidebarProps) {
  return (
    <div className="flex flex-col h-full border-r w-80 bg-background">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-semibold text-lg">Messages</h2>
        {action}
      </div>

      <div className="p-2">
        <Button
          variant={selectedId === "community" ? "secondary" : "ghost"}
          className="w-full justify-start gap-2 mb-2"
          onClick={onCommunityChat}
        >
          <Users className="h-4 w-4" />
          Community Chat
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-1 p-2">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg transition-colors hover:bg-muted text-left",
                selectedId === conv.id && "bg-muted"
              )}
            >
              <Avatar>
                <AvatarImage src={conv.image} />
                <AvatarFallback>{conv.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium truncate">{conv.name}</span>
                  {conv.lastMessage && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(conv.lastMessage.createdAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
                {conv.lastMessage && (
                  <p className="text-sm text-muted-foreground truncate">
                    {conv.lastMessage.content}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
