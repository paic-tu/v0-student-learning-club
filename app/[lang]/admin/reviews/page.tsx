import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getAllReviews } from "@/lib/db/queries"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star } from "lucide-react"

export default async function AdminReviewsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const user = await getCurrentUser()

  if (!user || user.role !== "admin") {
    redirect(`/${lang}/login`)
  }

  const reviews = await getAllReviews()
  const isAr = lang === "ar"

  return (
    <div className="container py-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{isAr ? "كل المراجعات" : "All Reviews"}</h1>
      </div>

      <div className="grid gap-4">
        {reviews.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {isAr ? "لا توجد مراجعات حتى الآن." : "No reviews yet."}
            </CardContent>
          </Card>
        ) : (
          reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={review.user.avatarUrl || "/default-avatar.svg"} />
                    <AvatarFallback>{review.user.name?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-lg">{review.user.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {isAr ? "دورة:" : "Course:"} {isAr ? review.course.titleAr : review.course.titleEn}
                        </p>
                        {review.course.instructor && (
                           <p className="text-xs text-muted-foreground mt-1">
                             {isAr ? "المدرب:" : "Instructor:"} {review.course.instructor.name}
                           </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                         <div className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/30 px-3 py-1 rounded-full border border-yellow-200 dark:border-yellow-800">
                          <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                          <span className="font-bold text-yellow-700 dark:text-yellow-500">
                            {review.rating}/5
                          </span>
                        </div>
                         {review.instructorRating && (
                             <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                 <span>{isAr ? "تقييم المدرب:" : "Instructor Rating:"}</span>
                                 <span className="font-medium">{review.instructorRating}/5</span>
                             </div>
                         )}
                      </div>
                    </div>
                    
                    {review.comment && (
                      <p className="text-base leading-relaxed bg-muted/30 p-4 rounded-lg border">
                        {review.comment}
                      </p>
                    )}
                    
                    <div className="text-xs text-muted-foreground pt-2">
                      {new Date(review.createdAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
