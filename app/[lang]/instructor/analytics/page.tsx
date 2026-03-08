import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getInstructorAnalytics } from "@/lib/db/queries"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Users, BookOpen, DollarSign, Star } from "lucide-react"

export default async function AnalyticsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect(`/${lang}/auth/login`)
  }

  const analytics = await getInstructorAnalytics(session.user.id)
  
  const isAr = lang === "ar"

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{isAr ? "التحليلات" : "Analytics"}</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isAr ? "إجمالي الطلاب" : "Total Students"}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalStudents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isAr ? "عدد الكورسات" : "Total Courses"}
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalCourses}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isAr ? "الإيرادات" : "Total Revenue"}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${Number(analytics.totalRevenue || 0).toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isAr ? "متوسط تقييم الدورات" : "Avg. Course Rating"}
            </CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.rating}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {isAr ? "تقييم المدرب: " : "Instructor Rating: "} {analytics.instructorRating}
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{isAr ? "نظرة عامة على الأداء" : "Performance Overview"}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {isAr 
              ? "سيتم إضافة رسوم بيانية تفصيلية هنا قريباً." 
              : "Detailed analytics charts will go here soon."}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
