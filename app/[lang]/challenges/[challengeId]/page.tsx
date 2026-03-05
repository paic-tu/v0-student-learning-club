import { getChallengeAction } from "@/lib/actions"
import { QuizClient } from "@/components/quiz-client"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function ChallengePage({ params }: { params: { lang: string, challengeId: string } }) {
  const session = await auth()
  if (!session?.user) redirect(`/${params.lang}/auth/login`)

  const { challenge, previousSubmission, error } = await getChallengeAction(params.challengeId)

  if (error || !challenge) {
    return <div className="container mx-auto p-8">Error: {error || "Challenge not found"}</div>
  }

  return <QuizClient challenge={challenge} previousSubmission={previousSubmission} />
}