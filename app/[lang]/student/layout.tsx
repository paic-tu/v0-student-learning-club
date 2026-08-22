import type { ReactNode } from "react"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { StudentPortalChrome } from "@/components/student/student-portal-chrome"

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

  return <StudentPortalChrome user={user}>{children}</StudentPortalChrome>
}
