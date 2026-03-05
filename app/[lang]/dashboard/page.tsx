import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function DashboardPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const session = await auth()
  
  if (!session?.user) {
    redirect(`/${lang}/auth/login`)
  }

  const role = session.user.role

  if (role === "admin") {
    redirect(`/${lang}/admin`)
  } else if (role === "instructor") {
    redirect(`/${lang}/instructor/dashboard`)
  } else if (role === "student") {
    redirect(`/${lang}/student/dashboard`)
  } else {
    redirect(`/${lang}`)
  }
}
