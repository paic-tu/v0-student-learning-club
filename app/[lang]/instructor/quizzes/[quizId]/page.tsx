import { redirect } from "next/navigation"

export default async function QuizPage({ params }: { params: Promise<{ lang: string; quizId: string }> }) {
  const { lang, quizId } = await params
  redirect(`/${lang}/instructor/quizzes/${quizId}/edit`)
}
