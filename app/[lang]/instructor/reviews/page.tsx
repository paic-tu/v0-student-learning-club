import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getInstructorReviews } from "@/lib/db/queries"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star } from "lucide-react"

export default async function InstructorReviewsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const session = await auth()
  const isAr = lang === "ar"
  
  if (!session?.user?.id || (session.user.role !== "instructor" && session.user.role !== "admin")) {
    redirect(`/${lang}/auth/login`)
  }

  const reviews = await getInstructorReviews(session.user.id)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">{isAr ? "مراجعات الطلاب" : "Student Reviews"}</h1>
        <p className="text-muted-foreground">{isAr ? "تعرف على رأي الطلاب في دوراتك" : "See what students are saying about your courses."}</p>
      </div>

      {reviews.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{isAr ? "لا توجد مراجعات" : "No reviews found"}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{isAr ? "لم تتلق أي مراجعات بعد." : "You haven't received any reviews yet."}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={review.user_avatar || ""} />
                    <AvatarFallback>{review.user_name?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">{review.user_name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{isAr ? review.course_title_ar || review.course_title_en : review.course_title_en}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                  <span className="font-medium">{review.rating}</span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm mt-2">{review.comment}</p>
                <p className="text-xs text-muted-foreground mt-4">
                  {new Date(review.createdAt).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
