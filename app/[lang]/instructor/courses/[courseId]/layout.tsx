import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getCourseById, getCourseModules, getCourseLessons } from "@/lib/db/queries"
import { CourseSidebar } from "@/components/instructor/course-sidebar"

export default async function InstructorCourseLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string; courseId: string }>
}) {
  const { lang, courseId } = await params
  const session = await auth()

  if (!session?.user?.id || (session.user.role !== "instructor" && session.user.role !== "admin")) {
    redirect(`/${lang}/auth/login`)
  }

  // Fetch course, modules, lessons
  const course = await getCourseById(courseId)
  
  if (!course) {
    redirect(`/${lang}/instructor/courses`)
  }

  // Verify ownership
  if ((course as any).instructor_id !== session.user.id && session.user.role !== "admin") {
    redirect(`/${lang}/access-denied`)
  }

  const modules = await getCourseModules(courseId)
  const lessons = await getCourseLessons(courseId)

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-80 border-r bg-muted/10 hidden md:block overflow-y-auto">
        <CourseSidebar 
          course={course} 
          modules={modules} 
          lessons={lessons} 
          lang={lang} 
        />
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-background p-8">
        {children}
      </main>
    </div>
  )
}
