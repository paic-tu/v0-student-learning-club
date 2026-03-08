import type { ReactNode } from "react"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { InstructorSidebar, InstructorMobileNav } from "@/components/instructor/instructor-sidebar"
import { PortalHeader } from "@/components/portal-header"

export default async function InstructorLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const session = await auth()

  if (!session?.user || session.user.role !== "instructor") {
    // Middleware handles this, but as safeguard
    redirect(`/${lang}/auth/login`)
  }

  const user = {
    name: session.user.name || "Instructor",
    email: session.user.email || "",
    role: session.user.role,
    image: session.user.image,
  }

  return (
    <div className="flex min-h-screen bg-muted/20">
      <InstructorSidebar />
      <div className="flex flex-1 flex-col">
        <PortalHeader user={user} mobileNav={<InstructorMobileNav />} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
