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

  if (session.user.role !== "admin") {
      redirect(`/${lang}/student/dashboard`)
  }

  const initialConversations = await getConversations()
  const isAr = lang === "ar"

  return (
    <div className="-m-6 md:m-0 p-2 md:p-6 h-full">
      <h1 className="hidden md:block text-3xl font-bold mb-6">{isAr ? "المحادثات" : "Chat"}</h1>
      <div className="h-full">
        <ChatLayout userId={session.user.id} initialConversations={initialConversations} />
      </div>
    </div>
  )
}
