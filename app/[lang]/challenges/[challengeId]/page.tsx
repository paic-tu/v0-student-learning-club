import { getChallengeAction } from "@/lib/actions"
import { QuizClient } from "@/components/quiz-client"
import { FindBugClient } from "@/components/find-bug-client"
import { SiteLeaderboard } from "@/components/site-leaderboard"
import { unstable_noStore as noStore } from "next/cache"

export const dynamic = "force-dynamic"

export default async function ChallengePage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string; challengeId: string }>
  searchParams?: Promise<{ created?: string }>
}) {
  noStore()
  const p = await params
  const sp = searchParams ? await searchParams : undefined
  const created = sp?.created === "1"
  const { challenge, previousSubmission, error } = await getChallengeAction(p.challengeId)

  if (error || !challenge) {
    return <div className="container mx-auto p-8">Error: {error || "Challenge not found"}</div>
  }

  const clientChallenge = { ...challenge, solution: null }
  const testCases = challenge.testCases as any
  const isFindBug = challenge.type === "coding" && testCases && typeof testCases === "object" && testCases.format === "find_bug_python"

  if (challenge.type === "quiz") {
    return <QuizClient challenge={clientChallenge} previousSubmission={previousSubmission} />
  }

  if (isFindBug) {
    return (
      <div className="space-y-6 py-6">
        {created && (
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm" dir={p.lang === "ar" ? "rtl" : "ltr"}>
              {p.lang === "ar" ? "تم إنشاء التحدي بنجاح ✅" : "Challenge created successfully ✅"}
            </div>
          </div>
        )}
        <FindBugClient challenge={clientChallenge} previousSubmission={previousSubmission} />
        <SiteLeaderboard lang={p.lang} />
      </div>
    )
  }

  return <div className="container mx-auto p-8">Challenge type not supported yet.</div>
}
