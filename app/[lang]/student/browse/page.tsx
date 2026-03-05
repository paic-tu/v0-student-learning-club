
import { getAllCourses, getUserBookmarks } from "@/lib/db/queries"
import { getCurrentUser } from "@/lib/auth"
import { BrowseCoursesClient } from "@/components/student/browse-courses-client"
import { BookOpen } from "lucide-react"

export default async function BrowsePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const user = await getCurrentUser()
  const isAr = lang === "ar"
  
  // Fetch all published courses
  const allCourses = await getAllCourses()
  
  // Fetch user bookmarks if logged in
  let bookmarkedCourseIds = new Set<string>()
  if (user) {
    const bookmarks = await getUserBookmarks(user.id)
    bookmarks.forEach((b: any) => bookmarkedCourseIds.add(b.courseId))
  }
  
  // Combine data
  const coursesWithBookmarkStatus = allCourses.map((course: any) => ({
    ...course,
    is_bookmarked: bookmarkedCourseIds.has(course.id)
  }))

  return (
    <div className="container py-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BookOpen className="h-8 w-8 text-primary" />
          {isAr ? "تصفح الدورات" : "Browse Courses"}
        </h1>
      </div>
      
      <BrowseCoursesClient initialCourses={coursesWithBookmarkStatus} />
    </div>
  )
}
