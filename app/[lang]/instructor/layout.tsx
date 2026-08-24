import type { ReactNode } from "react"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { InstructorPortalChrome } from "@/components/instructor/instructor-portal-chrome"

export default async function InstructorLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const session = await auth()

  if (!session?.user?.id) {
    redirect(`/${lang}/auth/login?callbackUrl=/${lang}/instructor/dashboard`)
  }

  if (session.user.role === "admin") {
    redirect(`/${lang}/admin/dashboard`)
  }

  if (session.user.role !== "instructor") {
    redirect(`/${lang}/access-denied`)
  }

  const user = {
    name: session.user.name || "Instructor",
    email: session.user.email || "",
    role: session.user.role,
    image: session.user.image,
  }

  return <InstructorPortalChrome user={user}>{children}</InstructorPortalChrome>
}
