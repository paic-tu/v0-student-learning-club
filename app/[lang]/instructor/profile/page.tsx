import { getCurrentUser } from "@/lib/auth"
import { getUserProfile, getInstructorDashboardData } from "@/lib/db/queries"
import { redirect } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { 
  Calendar, 
  Edit, 
  BookOpen, 
  Users, 
  Star, 
  MessageSquare 
} from "lucide-react"

export default async function InstructorProfilePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const user = await getCurrentUser()
  const isAr = lang === "ar"

  if (!user) {
    redirect(`/${lang}/auth/login?callbackUrl=/${lang}/instructor/profile`)
  }

  if (user.role !== "instructor") {
    redirect(`/${lang}/dashboard`)
  }

  const profile = await getUserProfile(user.id)
  const stats = await getInstructorDashboardData(user.id)

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
              <AvatarImage src={profile?.avatarUrl || "/default-avatar.svg"} alt={profile?.name || ""} />
              <AvatarFallback className="text-2xl">{profile?.name?.charAt(0).toUpperCase() || "I"}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold">{profile?.name}</h1>
                  <p className="text-muted-foreground">{profile?.email}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="secondary">{isAr ? "مدرب" : "Instructor"}</Badge>
                    <Badge variant="outline">{isAr ? `انضم في ${new Date(profile?.createdAt || "").getFullYear()}` : `Joined ${new Date(profile?.createdAt || "").getFullYear()}`}</Badge>
                  </div>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/${lang}/instructor/settings`}>
                    <Edit className="w-4 h-4 mr-2" />
                    {isAr ? "تعديل الملف الشخصي" : "Edit Profile"}
                  </Link>
                </Button>
              </div>
              {profile?.bio && (
                <p className="text-sm text-muted-foreground max-w-2xl">
                  {profile.bio}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{isAr ? "إجمالي الطلاب" : "Total Students"}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.stats.students}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{isAr ? "الدورات النشطة" : "Active Courses"}</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.stats.courses}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{isAr ? "متوسط التقييم" : "Average Rating"}</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.stats.rating}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{isAr ? "المراجعات" : "Total Reviews"}</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.stats.reviews}</div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Info Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{isAr ? "حول المدرب" : "About Me"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">{isAr ? "نبذة مختصرة" : "Bio"}</h4>
                <p className="text-sm text-muted-foreground">
                  {profile?.bio || (isAr ? "لا توجد نبذة مختصرة." : "No bio provided.")}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">{isAr ? "تاريخ الانضمام" : "Join Date"}</h4>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4 mr-2" />
                    {new Date(profile?.createdAt || "").toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
