import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function ProfileRedirectPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const session = await auth()

  if (!session?.user) {
    redirect(`/${lang}/auth/login?callbackUrl=/${lang}/profile`)
  }

  const role = session.user.role

  if (role === "admin") {
    redirect(`/${lang}/admin/dashboard`)
  } else if (role === "instructor") {
    redirect(`/${lang}/instructor/profile`)
  } else {
    // Default to student
    redirect(`/${lang}/student/profile`)
  }
}
