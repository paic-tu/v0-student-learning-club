import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getInstructorReviews } from "@/lib/db/queries"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star } from "lucide-react"

export default async function ReviewsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect(`/${lang}/auth/login`)
  }

  const reviews = await getInstructorReviews(session.user.id)
  
  const isAr = lang === "ar"

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{isAr ? "المراجعات" : "Reviews"}</h1>
      
      <div className="grid gap-4">
        {reviews.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              {isAr ? "لا توجد مراجعات حتى الآن." : "No reviews yet."}
            </CardContent>
          </Card>
        ) : (
          reviews.map((review: any) => (
            <Card key={review.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={review.user_avatar || "/default-avatar.svg"} />
                      <AvatarFallback>{review.user_name?.[0] || "U"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">{review.user_name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {isAr ? review.course_title_ar : review.course_title_en}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center bg-primary/10 px-2 py-1 rounded-full">
                    <Star className="w-4 h-4 fill-primary text-primary mr-1" />
                    <span className="font-bold text-sm">{review.rating}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p>{review.comment}</p>
                <p className="text-xs text-muted-foreground mt-4">
                  {new Date(review.created_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
