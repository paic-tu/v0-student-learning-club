import { getCourseModules, getCourseLessons } from "@/lib/db/queries"
import { CourseLessonsManager } from "@/components/instructor/course-lessons-manager"

export default async function InstructorCourseLessonsPage({
  params,
}: {
  params: Promise<{ lang: string; courseId: string }>
}) {
  const { lang, courseId } = await params
  const [modules, lessons] = await Promise.all([getCourseModules(courseId), getCourseLessons(courseId)])

  return <CourseLessonsManager courseId={courseId} lang={lang} modules={modules} initialLessons={lessons} />
}
