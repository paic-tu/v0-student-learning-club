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

export default async function ProfilePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const isAr = lang === "ar"
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    redirect(`/${lang}/auth/login`)
  }

  // Fetch full profile data
  const userProfile = await getUserProfile(currentUser.id)
  
  // Fetch stats
  const dashboardData = await getInstructorDashboardData(currentUser.id)
  const stats = dashboardData.stats

  // Fallback if profile fetch fails
  const user = userProfile || currentUser

  const formatDate = (date: Date | string | null) => {
    if (!date) return isAr ? "غير محدد" : "N/A"
    return new Date(date).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="container py-8 space-y-8">
      {/* Header Section */}
      <div className="relative mb-12">
        <div className="h-32 w-full bg-gradient-to-r from-primary/20 to-primary/5 rounded-t-xl" />
        <div className="absolute -bottom-10 left-8 flex items-end gap-6">
          <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
            <AvatarImage src={user.image || user.avatarUrl || "/default-avatar.svg"} alt={user.name} />
            <AvatarFallback className="text-2xl">{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="mb-2">
            <h1 className="text-2xl font-bold">{user.name}</h1>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Badge variant="secondary" className="capitalize">
                {user.role}
              </Badge>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {isAr ? "انضم في" : "Joined"} {formatDate(user.createdAt || new Date())}
              </span>
            </div>
          </div>
        </div>
        <div className="absolute bottom-2 right-8">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/${lang}/instructor/settings`}>
              <Edit className="w-4 h-4 mr-2" />
              {isAr ? "تعديل الملف الشخصي" : "Edit Profile"}
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 pt-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isAr ? "الدورات المنشورة" : "Published Courses"}
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.courses}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isAr ? "الطلاب المسجلين" : "Enrolled Students"}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.students}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isAr ? "متوسط التقييم" : "Average Rating"}
            </CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rating.toFixed(1)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isAr ? "عدد المراجعات" : "Total Reviews"}
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.reviews}</div>
          </CardContent>
        </Card>
      </div>

      {/* Bio Section */}
      <Card>
        <CardHeader>
          <CardTitle>{isAr ? "نبذة عني" : "About Me"}</CardTitle>
        </CardHeader>
        <CardContent>
          {user.bio ? (
            <p className="whitespace-pre-wrap text-muted-foreground">{user.bio}</p>
          ) : (
            <p className="text-muted-foreground italic">
              {isAr ? "لم يتم إضافة نبذة بعد." : "No bio added yet."}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
