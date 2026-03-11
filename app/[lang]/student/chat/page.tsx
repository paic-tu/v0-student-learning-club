import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ChatLayout } from "@/components/chat/chat-layout"
import { getConversations } from "@/lib/actions/chat"

export default async function ChatPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const session = await auth()
  
  if (!session?.user) {
    redirect(`/${lang}/login`)
  }

  const initialConversations = await getConversations()

  const isAr = lang === "ar"

  return (
    <div className="container mx-auto p-2 md:p-6 h-full">
      <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 hidden md:block">
        {isAr ? "المحادثات" : "Chat"}
      </h1>
      <ChatLayout userId={session.user.id} initialConversations={initialConversations} />
    </div>
  )
}
