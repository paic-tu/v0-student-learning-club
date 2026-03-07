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

  if (session.user.role !== "instructor" && session.user.role !== "admin") {
      redirect(`/${lang}/student/dashboard`)
  }

  const initialConversations = await getConversations()

  return (
    <div className="container mx-auto p-6 h-full">
      <h1 className="text-3xl font-bold mb-6">Chat</h1>
      <ChatLayout userId={session.user.id} initialConversations={initialConversations} />
    </div>
  )
}
