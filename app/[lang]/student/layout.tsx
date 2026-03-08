import type { ReactNode } from "react"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { StudentSidebar, StudentMobileNav } from "@/components/student/student-sidebar"
import { PortalHeader } from "@/components/portal-header"

export default async function StudentLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const session = await auth()

  if (!session?.user || !["student", "instructor", "admin"].includes(session.user.role)) {
    // Middleware handles this, but as safeguard
    redirect(`/${lang}/auth/login`)
  }

  const user = {
    name: session.user.name || "Student",
    email: session.user.email || "",
    role: session.user.role,
    image: session.user.image,
  }

  return (
    <div className="flex h-screen overflow-hidden bg-muted/20">
      <StudentSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <PortalHeader user={user} mobileNav={<StudentMobileNav />} />
        <main className="flex-1 overflow-y-auto p-6 scrollbar-hide">{children}</main>
      </div>
    </div>
  )
}
