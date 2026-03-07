
import { getCurrentUser } from "@/lib/auth"
import { getUserProfile, getStudentDashboardData } from "@/lib/db/queries"
import { redirect } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { 
  Mail, 
  Calendar, 
  Globe, 
  Linkedin, 
  Twitter, 
  BookOpen, 
  Award, 
  CheckCircle, 
  Trophy,
  User,
  Edit
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
  const dashboardData = await getStudentDashboardData(currentUser.id)
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
            <Link href={`/${lang}/student/settings`}>
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
              {isAr ? "الدورات المسجلة" : "Enrolled Courses"}
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCourses}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isAr ? "الدورات المكتملة" : "Completed Courses"}
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedCourses}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isAr ? "الشهادات" : "Certificates"}
            </CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.certificates}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isAr ? "النقاط" : "Total Points"}
            </CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPoints}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* About Section */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{isAr ? "عنّي" : "About Me"}</CardTitle>
          </CardHeader>
          <CardContent>
            {user.bio ? (
              <p className="text-muted-foreground whitespace-pre-wrap">{user.bio}</p>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <User className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>{isAr ? "لم تقم بإضافة نبذة تعريفية بعد." : "You haven't added a bio yet."}</p>
                <Button variant="link" asChild className="mt-2">
                  <Link href={`/${lang}/student/settings`}>
                    {isAr ? "أضف نبذة تعريفية" : "Add Bio"}
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact & Social Section */}
        <Card>
          <CardHeader>
            <CardTitle>{isAr ? "معلومات التواصل" : "Contact & Social"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <Mail className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-xs text-muted-foreground">{isAr ? "البريد الإلكتروني" : "Email"}</p>
                <p className="font-medium truncate" title={user.email}>{user.email}</p>
              </div>
            </div>

            {(user.websiteUrl || user.twitterUrl || user.linkedinUrl) && <hr className="my-4" />}

            {user.websiteUrl && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs text-muted-foreground">{isAr ? "الموقع الإلكتروني" : "Website"}</p>
                  <a href={user.websiteUrl} target="_blank" rel="noopener noreferrer" className="font-medium truncate hover:underline text-primary">
                    {user.websiteUrl.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              </div>
            )}

            {user.twitterUrl && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <Twitter className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs text-muted-foreground">Twitter / X</p>
                  <a href={user.twitterUrl} target="_blank" rel="noopener noreferrer" className="font-medium truncate hover:underline text-primary">
                    Profile
                  </a>
                </div>
              </div>
            )}

            {user.linkedinUrl && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <Linkedin className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs text-muted-foreground">LinkedIn</p>
                  <a href={user.linkedinUrl} target="_blank" rel="noopener noreferrer" className="font-medium truncate hover:underline text-primary">
                    Profile
                  </a>
                </div>
              </div>
            )}

            {!user.websiteUrl && !user.twitterUrl && !user.linkedinUrl && (
               <div className="text-center py-4">
                 <p className="text-xs text-muted-foreground mb-2">
                   {isAr ? "لا توجد روابط تواصل اجتماعي" : "No social links added"}
                 </p>
                 <Button variant="outline" size="sm" asChild className="w-full">
                    <Link href={`/${lang}/student/settings`}>
                      {isAr ? "أضف روابط" : "Add Links"}
                    </Link>
                 </Button>
               </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
