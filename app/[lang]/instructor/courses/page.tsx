import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { getInstructorCourses } from "@/lib/db/queries"
import { redirect } from "next/navigation"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Users, Clock, Star } from "lucide-react"

export default async function InstructorCoursesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const session = await auth()
  
  if (!session?.user?.id || (session.user.role !== "instructor" && session.user.role !== "admin")) {
    redirect(`/${lang}/auth/login`)
  }

  const courses = await getInstructorCourses(session.user.id)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Courses</h1>
          <p className="text-muted-foreground mt-2">Manage your courses and track student progress</p>
        </div>
        <Button asChild>
          <Link href={`/${lang}/instructor/courses/new`}>Create New Course</Link>
        </Button>
      </div>

      {courses.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No courses found</CardTitle>
            <CardDescription>You have not created any courses yet.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href={`/${lang}/instructor/courses/new`}>Get Started</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card key={course.id} className="overflow-hidden flex flex-col h-full hover:shadow-lg transition-shadow">
              <div className="relative aspect-video w-full bg-muted">
                {course.thumbnail_url ? (
                  <Image 
                    src={course.thumbnail_url} 
                    alt={lang === "ar" ? course.title_ar : course.title_en}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-secondary text-secondary-foreground">
                    No Image
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <Badge variant={course.is_published ? "default" : "secondary"}>
                    {course.is_published ? "Published" : "Draft"}
                  </Badge>
                </div>
              </div>
              <CardHeader>
                <CardTitle className="line-clamp-1">
                  {lang === "ar" ? course.title_ar : course.title_en}
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {lang === "ar" ? course.description_ar : course.description_en}
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto space-y-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{course.students_count || 0} Students</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span>{course.rating || "0.0"}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="outline" className="flex-1">
                    <Link href={`/${lang}/instructor/courses/${course.id}/edit`}>Edit</Link>
                  </Button>
                  <Button asChild className="flex-1">
                    <Link href={`/${lang}/instructor/courses/${course.id}/edit`}>Manage</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
