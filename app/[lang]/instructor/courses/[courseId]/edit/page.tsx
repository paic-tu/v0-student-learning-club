import { redirect } from "next/navigation"

export default async function InstructorCourseEditPage({
  params,
}: {
  params: Promise<{ lang: string; courseId: string }>
}) {
  const { lang, courseId } = await params
  redirect(`/${lang}/instructor/courses/${courseId}/settings`)
}
