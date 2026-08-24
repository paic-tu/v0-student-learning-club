import { getCourseModules } from "@/lib/db/queries"
import { CourseModulesManager } from "@/components/instructor/course-modules-manager"

export default async function InstructorCourseModulesPage({
  params,
}: {
  params: Promise<{ lang: string; courseId: string }>
}) {
  const { lang, courseId } = await params
  const modules = await getCourseModules(courseId)

  return <CourseModulesManager courseId={courseId} lang={lang} initialModules={modules} />
}
