import { getCurrentUser } from "@/lib/auth"
import { getUserBookmarks } from "@/lib/db/queries"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Bookmark, PlayCircle, BookOpen } from "lucide-react"
import { BookmarkButton } from "@/components/bookmark-button"
import { Badge } from "@/components/ui/badge"

export default async function BookmarksPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const user = await getCurrentUser()
  const isAr = lang === "ar"

  if (!user) {
    return (
      <div className="container py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">{isAr ? "يجب تسجيل الدخول" : "Sign in required"}</h1>
        <Button asChild>
          <Link href={`/${lang}/auth/login`}>{isAr ? "تسجيل الدخول" : "Login"}</Link>
        </Button>
      </div>
    )
  }

  const bookmarks = await getUserBookmarks(user.id)

  return (
    <div className="container py-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Bookmark className="h-8 w-8 text-emerald-600" />
          {isAr ? "المحفوظات" : "Bookmarks"}
        </h1>
        <Button asChild variant="outline">
          <Link href={`/${lang}/student/browse`}>{isAr ? "تصفح المزيد" : "Browse More"}</Link>
        </Button>
      </div>

      {bookmarks.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {bookmarks.map((bookmark: any) => (
            <Card key={bookmark.id} className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full">
              <div className="aspect-video relative bg-muted group">
                {bookmark.course.thumbnailUrl ? (
                  <img 
                    src={bookmark.course.thumbnailUrl} 
                    alt={isAr ? bookmark.course.titleAr : bookmark.course.titleEn} 
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted/50">
                    <BookOpen className="h-12 w-12 text-muted-foreground/50" />
                  </div>
                )}
                <div className="absolute top-2 right-2 z-10">
                   <BookmarkButton 
                     courseId={bookmark.courseId} 
                     initialBookmarked={true} 
                     variant="secondary"
                     size="icon"
                     className="bg-background/80 backdrop-blur-sm hover:bg-background"
                   />
                </div>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <Button variant="secondary" size="lg" className="gap-2" asChild>
                     <Link href={`/${lang}/student/course/${bookmark.courseId}`}>
                       <PlayCircle className="h-5 w-5" />
                       {isAr ? "عرض التفاصيل" : "View Details"}
                     </Link>
                   </Button>
                </div>
              </div>
              
              <CardContent className="p-5 space-y-3 flex-1">
                <div className="flex justify-between items-start gap-2">
                  {(bookmark.course.category.nameEn || bookmark.course.category.nameAr) && (
                    <Badge variant="outline" className="text-xs font-normal">
                      {isAr ? (bookmark.course.category.nameAr || bookmark.course.category.nameEn) : (bookmark.course.category.nameEn || bookmark.course.category.nameAr)}
                    </Badge>
                  )}
                  {bookmark.course.isFree ? (
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200">
                      {isAr ? "مجاني" : "Free"}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      {bookmark.course.price} $
                    </Badge>
                  )}
                </div>

                <h3 className="font-semibold text-lg line-clamp-2 hover:text-primary transition-colors">
                  <Link href={`/${lang}/student/course/${bookmark.courseId}`}>
                    {isAr ? bookmark.course.titleAr : bookmark.course.titleEn}
                  </Link>
                </h3>
                
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {isAr ? "بواسطة" : "By"} {bookmark.course.instructor.name}
                </p>
              </CardContent>
              
              <CardFooter className="p-5 pt-0">
                <Button className="w-full" asChild>
                  <Link href={`/${lang}/student/course/${bookmark.courseId}`}>
                    {isAr ? "عرض الدورة" : "View Course"}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-16">
          <CardContent>
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Bookmark className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">{isAr ? "لا توجد محفوظات" : "No bookmarks yet"}</h2>
            <p className="text-muted-foreground max-w-sm mx-auto mb-6">
              {isAr 
                ? "يمكنك حفظ الدورات التي تهمك للعودة إليها لاحقاً" 
                : "Save courses you're interested in to revisit them later"}
            </p>
            <Button size="lg" asChild>
              <Link href={`/${lang}/student/browse`}>
                {isAr ? "تصفح الدورات" : "Browse Courses"}
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
