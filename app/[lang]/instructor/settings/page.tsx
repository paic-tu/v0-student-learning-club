import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { SettingsForm } from "@/components/instructor/settings-form"
import { getCurrentUser } from "@/lib/auth"
import { getUserProfile } from "@/lib/db/queries"
import { redirect } from "next/navigation"

export default async function SettingsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const isAr = lang === "ar"
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    redirect(`/${lang}/auth/login`)
  }

  const userProfile = await getUserProfile(currentUser.id)
  
  const user = userProfile || {
    ...currentUser,
    bio: "",
    headline: "",
    websiteUrl: "",
    twitterUrl: "",
    linkedinUrl: "",
    avatarUrl: "",
    coverUrl: "",
    phoneNumber: "",
    points: 0,
    level: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{isAr ? "الإعدادات" : "Settings"}</h1>
      <Card>
        <CardHeader>
          <CardTitle>{isAr ? "إعدادات الحساب" : "Account Settings"}</CardTitle>
           <CardDescription>
            {isAr ? "قم بتحديث معلومات ملفك الشخصي." : "Update your profile information."}
          </CardDescription>
        </CardHeader>
        <CardContent>
           <SettingsForm user={user} lang={lang} />
        </CardContent>
      </Card>
    </div>
  )
}
