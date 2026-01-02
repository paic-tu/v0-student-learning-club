"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"
import { useRouter } from "next/navigation"
import { NavBar } from "@/components/nav-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { logout } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { getUserEnrollments } from "@/lib/db/queries"
import { User, Trophy, BookOpen } from "lucide-react"

export default function ProfilePage() {
  const { user } = useAuth()
  const { language } = useLanguage()
  const router = useRouter()
  const { toast } = useToast()
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const isRTL = language === "ar"

  useEffect(() => {
    if (!user) {
      router.push("/auth/login")
      return
    }

    const loadEnrollments = async () => {
      const data = await getUserEnrollments(user.id)
      setEnrollments(data)
      setLoading(false)
    }

    loadEnrollments()
  }, [user, router])

  const handleLogout = async () => {
    await logout()
    router.push("/")
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <NavBar />
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground">{isRTL ? "جاري التحميل..." : "Loading..."}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">{isRTL ? "ملفي الشخصي" : "My Profile"}</h1>

        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Profile Card */}
          <Card className="md:col-span-1">
            <CardContent className="pt-6 space-y-6 text-center">
              <div className="w-24 h-24 bg-primary rounded-full mx-auto flex items-center justify-center">
                <User className="h-12 w-12 text-primary-foreground" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold">{user?.name}</h2>
                <Badge>{user?.role === "admin" ? (isRTL ? "مسؤول" : "Admin") : isRTL ? "طالب" : "Student"}</Badge>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>

              <div className="space-y-2">
                <div className="text-sm">
                  <span className="text-muted-foreground">{isRTL ? "المستوى:" : "Level:"}</span>
                  <span className="ml-2 font-semibold">{user?.level}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">{isRTL ? "النقاط:" : "Points:"}</span>
                  <span className="ml-2 font-semibold">{user?.points}</span>
                </div>
              </div>

              <Button onClick={handleLogout} variant="destructive" className="w-full">
                {isRTL ? "تسجيل خروج" : "Logout"}
              </Button>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="md:col-span-2 space-y-4">
            <Card>
              <CardContent className="pt-6 flex items-center gap-4">
                <BookOpen className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">{isRTL ? "الدورات المسجلة" : "Enrolled Courses"}</p>
                  <p className="text-2xl font-bold">{enrollments.length}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 flex items-center gap-4">
                <Trophy className="h-8 w-8 text-amber-500" />
                <div>
                  <p className="text-sm text-muted-foreground">{isRTL ? "إنجازات" : "Achievements"}</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Enrollments */}
        <Card>
          <CardHeader>
            <CardTitle>{isRTL ? "دوراتي" : "My Courses"}</CardTitle>
          </CardHeader>
          <CardContent>
            {enrollments.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                {isRTL ? "لم تسجل في أي دورات بعد" : "You haven't enrolled in any courses yet"}
              </p>
            ) : (
              <div className="space-y-4">
                {enrollments.map((enrollment) => (
                  <div key={enrollment.id} className="border rounded p-4 flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold">{isRTL ? enrollment.title_ar : enrollment.title_en}</h3>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">{enrollment.progress}%</Badge>
                        <Badge variant="outline">{isRTL ? enrollment.difficulty : enrollment.difficulty}</Badge>
                      </div>
                    </div>
                    <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary transition-all" style={{ width: `${enrollment.progress}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
