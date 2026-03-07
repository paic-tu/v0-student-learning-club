import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function DashboardRouting({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const session = await auth()
  
  if (!session?.user) {
    console.log("[Dashboard] No user in session, redirecting to login")
    redirect(`/${lang}/auth/login`)
  }

  const role = session.user.role || "student" // Fallback to student if role is missing
  console.log("[Dashboard] User role:", role)

  if (role === "admin") {
    redirect(`/${lang}/admin`)
  } else if (role === "instructor") {
    redirect(`/${lang}/instructor/dashboard`)
  } else if (role === "student") {
    redirect(`/${lang}/student/dashboard`)
  } else {
    console.log("[Dashboard] Unknown role, redirecting to home")
    redirect(`/${lang}`)
  }

  // This return is unreachable but helps with TypeScript and potential component lifecycle
  return null
}
