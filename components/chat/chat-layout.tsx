"use client"

import { useState, useEffect } from "react"
import { ChatSidebar } from "./chat-sidebar"
import { ChatWindow } from "./chat-window"
import { NewChatDialog } from "./new-chat-dialog"
import { getConversations, joinCommunityChat } from "@/lib/actions/chat"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface ChatLayoutProps {
  userId: string
  initialConversations?: any[]
}

export function ChatLayout({ userId, initialConversations = [] }: ChatLayoutProps) {
  const [conversations, setConversations] = useState(initialConversations)
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(!initialConversations.length)
  const [isMobile, setIsMobile] = useState(false)

  // Simple mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const fetchConversations = async () => {
    try {
      const data = await getConversations()
      setConversations(data)
      setLoading(false)
    } catch (error) {
      console.error("Failed to fetch conversations", error)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConversations()
    const interval = setInterval(fetchConversations, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleSelectConversation = (id: string) => {
    setSelectedId(id)
  }

  const handleJoinCommunity = async () => {
    try {
      const result = await joinCommunityChat()
      if (result.error) {
        toast.error(result.error)
      } else {
        await fetchConversations()
        setSelectedId(result.conversationId)
      }
    } catch (error) {
      toast.error("Failed to join community chat")
    }
  }

  const handleNewChat = async (id: string) => {
    await fetchConversations()
    setSelectedId(id)
  }

  const selectedConversation = conversations.find((c) => c.id === selectedId)

  // Mobile View Logic
  if (isMobile) {
    if (selectedId) {
      return (
        <div className="h-[calc(100dvh-4rem)] flex flex-col bg-background">
          <ChatWindow
            conversationId={selectedId}
            currentUserId={userId}
            recipientName={selectedConversation?.name}
            recipientImage={selectedConversation?.image}
            onBack={() => setSelectedId(undefined)}
          />
        </div>
      )
    }

    return (
      <div className="h-[calc(100dvh-4rem)] flex flex-col bg-background">
         <div className="flex-1 overflow-hidden w-full">
            <ChatSidebar
            conversations={conversations}
            selectedId={selectedId}
            onSelect={handleSelectConversation}
            onCommunityChat={handleJoinCommunity}
            action={<NewChatDialog onChatCreated={handleNewChat} />}
            />
         </div>
      </div>
    )
  }

  // Desktop View
  return (
    <div className="flex h-[calc(100dvh-8rem)] border rounded-lg overflow-hidden bg-background shadow-sm">
      <div className="flex-none h-full">
        <ChatSidebar
          conversations={conversations}
          selectedId={selectedId}
          onSelect={handleSelectConversation}
          onCommunityChat={handleJoinCommunity}
          action={<NewChatDialog onChatCreated={handleNewChat} />}
        />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        {selectedId ? (
          <ChatWindow
            conversationId={selectedId}
            currentUserId={userId}
            recipientName={selectedConversation?.name}
            recipientImage={selectedConversation?.image}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground bg-muted/10">
            <div className="flex flex-col items-center gap-2">
              <div className="p-4 rounded-full bg-muted">
                <Loader2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <p>Select a conversation to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
