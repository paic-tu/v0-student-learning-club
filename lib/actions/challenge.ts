"use server"

import { db } from "@/lib/db"
import { 
  challenges, 
  challengeSubmissions,
  users,
} from "@/lib/db/schema"
import { auth } from "@/lib/auth"
import { eq, and, desc, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function getChallengesAction() {
    console.log("[Action] getChallengesAction started")
    try {
        // Return all challenges of type 'quiz'
        return await db.query.challenges.findMany({
            where: eq(challenges.type, 'quiz'),
            with: {
                category: true
            },
            orderBy: [desc(challenges.createdAt)]
        })
    } catch (error) {
        console.error("[Action] getChallengesAction error:", error)
        return []
    }
}

export async function getAdminQuizzesAction() {
    console.log("[Action] getAdminQuizzesAction started")
    try {
        const session = await auth()
        if (!session?.user?.id || session.user.role !== "admin") {
             return { error: "Unauthorized" }
        }

        const quizzes = await db.query.challenges.findMany({
            where: eq(challenges.type, 'quiz'),
            with: {
                category: true,
                course: {
                    columns: {
                        titleEn: true,
                        titleAr: true
                    }
                },
                instructor: {
                    columns: {
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: [desc(challenges.createdAt)]
        })
        return { quizzes }
    } catch (error) {
        console.error("[Action] getAdminQuizzesAction error:", error)
        return { error: "Failed to fetch quizzes" }
    }
}

export async function getChallengeAction(id: string) {
    console.log("[Action] getChallengeAction started", { id })
    try {
        const session = await auth()
        const userId = session?.user?.id

        const challenge = await db.query.challenges.findFirst({
            where: eq(challenges.id, id),
            with: {
                category: true
            }
        })

        if (!challenge) return { error: "Challenge not found" }

        // Check if user has submitted before
        let previousSubmission = null
        if (userId) {
            previousSubmission = await db.query.challengeSubmissions.findFirst({
                where: and(
                    eq(challengeSubmissions.challengeId, id),
                    eq(challengeSubmissions.userId, userId)
                ),
                orderBy: [desc(challengeSubmissions.submittedAt)]
            })
        }

        return { challenge, previousSubmission }
    } catch (error) {
        return { error: "Failed to get challenge" }
    }
}

export async function submitQuizAction(challengeId: string, answers: Record<number, string>) {
    console.log("[Action] submitQuizAction started", { challengeId })
    try {
        const session = await auth()
        if (!session?.user?.id) {
            console.log("[Action] Unauthorized submitQuiz")
            return { error: "Unauthorized" }
        }
        const userId = session.user.id

        const challenge = await db.query.challenges.findFirst({
            where: eq(challenges.id, challengeId)
        })

        if (!challenge) return { error: "Challenge not found" }

        const questions = challenge.testCases as any[] // Array of { question, options, answer }
        if (!questions || !Array.isArray(questions)) return { error: "Invalid quiz format" }

        let score = 0
        const totalQuestions = questions.length
        const results: any[] = []

        questions.forEach((q, index) => {
            const userAnswer = answers[index]
            
            // Normalize for comparison (trim whitespace, handle type differences)
            const normalize = (val: any) => String(val || "").trim()
            
            let isCorrect = normalize(userAnswer) === normalize(q.answer)
            
            // If strict match fails, try index-based matching if options exist
            if (!isCorrect && Array.isArray(q.options)) {
                // Check if q.answer is an index pointing to the user's answer string
                const answerIndex = parseInt(String(q.answer), 10)
                if (!isNaN(answerIndex) && q.options[answerIndex] === userAnswer) {
                    isCorrect = true
                }
                
                // Check if user's answer is an index pointing to the correct answer string
                // (Less likely given the UI, but possible if UI changes)
            }

            console.log(`[Quiz Check] Q${index + 1}: User="${userAnswer}", Correct="${q.answer}", Match=${isCorrect}`)

            if (isCorrect) score++
            results.push({
                questionIndex: index,
                isCorrect,
                userAnswer,
                correctAnswer: q.answer
            })
        })

        const percentage = Math.round((score / totalQuestions) * 100)
        const isPassed = percentage >= 70

        // Save submission
        await db.insert(challengeSubmissions).values({
            userId,
            challengeId,
            result: results,
            score: percentage,
            isPassed
        })
        
        // TODO: Update user points if passed

        revalidatePath(`/challenges/${challengeId}`)
        return { success: true, score: percentage, isPassed, results }
    } catch (error) {
        console.error("[Action] submitQuizAction error:", error)
        return { error: "Failed to submit quiz" }
    }
}

function normalizePython(code: string) {
  return String(code || "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n")
    .trim()
}

export async function submitFindBugAction(
  challengeId: string,
  code: string,
  meta?: { timeMs?: number },
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }
    const userId = session.user.id

    const challenge = await db.query.challenges.findFirst({
      where: eq(challenges.id, challengeId),
    })

    if (!challenge) return { error: "Challenge not found" }

    const testCases = challenge.testCases as any
    const isFindBug =
      challenge.type === "coding" &&
      testCases &&
      typeof testCases === "object" &&
      testCases.format === "find_bug_python"

    if (!isFindBug) return { error: "Unsupported challenge type" }

    const now = Date.now()
    const startAtMs = testCases?.startAt ? new Date(testCases.startAt).getTime() : null
    const endAtMs = testCases?.endAt ? new Date(testCases.endAt).getTime() : null

    if (Number.isFinite(startAtMs as any) && typeof startAtMs === "number" && now < startAtMs) {
      return { error: "Challenge has not started yet" }
    }

    if (Number.isFinite(endAtMs as any) && typeof endAtMs === "number" && now > endAtMs) {
      return { error: "Challenge has ended" }
    }

    const [attemptCountRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(challengeSubmissions)
      .where(and(eq(challengeSubmissions.challengeId, challengeId), eq(challengeSubmissions.userId, userId)))

    const attempts = Number(attemptCountRow?.count || 0) + 1

    const [previousPassed] = await db
      .select({ id: challengeSubmissions.id })
      .from(challengeSubmissions)
      .where(
        and(
          eq(challengeSubmissions.challengeId, challengeId),
          eq(challengeSubmissions.userId, userId),
          eq(challengeSubmissions.isPassed, true),
        ),
      )
      .limit(1)

    const alreadyPassed = Boolean(previousPassed?.id)

    const safeTimeMsRaw = typeof meta?.timeMs === "number" ? meta.timeMs : 0
    const timeMs = Math.max(0, Math.min(24 * 60 * 60 * 1000, Math.floor(safeTimeMsRaw)))
    const timeMinutes = Math.floor(timeMs / 60000)

    const limitMinutes = typeof challenge.timeLimit === "number" && Number.isFinite(challenge.timeLimit) ? challenge.timeLimit : null
    const limitMs = limitMinutes != null ? Math.max(0, limitMinutes) * 60000 : null
    const timeLimitExceeded = limitMs != null && limitMs > 0 && timeMs > limitMs

    const expected = normalizePython(challenge.solution || "")
    const submitted = normalizePython(code || "")

    const isPassed = !timeLimitExceeded && Boolean(expected) && submitted === expected

    const basePoints = Number.isFinite(challenge.points) ? Number(challenge.points) : 100
    const bonus = Math.max(0, 50 - timeMinutes * 5 - Math.max(0, attempts - 1) * 10)
    const awardedPoints = isPassed && !alreadyPassed ? basePoints + bonus : 0

    await db.insert(challengeSubmissions).values({
      userId,
      challengeId,
      code,
      result: {
        format: "find_bug_python",
        timeMs,
        timeLimitMinutes: limitMinutes,
        timeLimitExceeded,
        attempts,
        basePoints,
        bonus,
        awardedPoints,
        alreadyPassed,
      },
      score: awardedPoints,
      isPassed,
    })

    if (awardedPoints > 0) {
      await db
        .update(users)
        .set({ points: sql`${users.points} + ${awardedPoints}` })
        .where(eq(users.id, userId))
    }

    revalidatePath(`/ar/challenges/${challengeId}`)
    revalidatePath(`/en/challenges/${challengeId}`)
    revalidatePath(`/ar/challenges`)
    revalidatePath(`/en/challenges`)

    return { success: true, isPassed, awardedPoints, bonus, attempts, timeMs, timeLimitExceeded }
  } catch (error) {
    console.error("[Action] submitFindBugAction error:", error)
    return { error: "Failed to submit code" }
  }
}

export async function getInstructorQuizzesAction() {
    console.log("[Action] getInstructorQuizzesAction started")
    try {
        const session = await auth()
        if (!session?.user?.id) return { error: "Unauthorized" }
        
        const userId = session.user.id
        
        // Return challenges where instructorId matches OR created by admin if needed?
        // For now, only return quizzes created by this instructor
        const quizzes = await db.query.challenges.findMany({
            where: and(
                eq(challenges.type, 'quiz'),
                eq(challenges.instructorId, userId)
            ),
            orderBy: [desc(challenges.createdAt)]
        })
        
        return { quizzes }
    } catch (error) {
        console.error("[Action] getInstructorQuizzesAction error:", error)
        return { error: "Failed to fetch quizzes" }
    }
}

export async function getInstructorQuizAction(id: string) {
    console.log("[Action] getInstructorQuizAction started", { id })
    try {
        const session = await auth()
        if (!session?.user?.id) return { error: "Unauthorized" }
        
        const userId = session.user.id
        
        // Verify ownership and fetch (allow admin)
        const whereClause = session.user.role === 'admin'
            ? eq(challenges.id, id)
            : and(eq(challenges.id, id), eq(challenges.instructorId, userId))

        const quiz = await db.query.challenges.findFirst({
            where: whereClause
        })
        
        if (!quiz) return { error: "Quiz not found or unauthorized" }
        
        return { quiz }
    } catch (error) {
        console.error("[Action] getInstructorQuizAction error:", error)
        return { error: "Failed to fetch quiz" }
    }
}

export async function createQuizAction(data: any) {
    console.log("[Action] createQuizAction started")
    try {
        const session = await auth()
        if (!session?.user?.id) return { error: "Unauthorized" }
        
        const userId = session.user.id
        
        // Force type to quiz and set instructorId
        const quizData = {
            ...data,
            type: 'quiz',
            instructorId: userId,
            difficulty: data.difficulty || 'beginner',
            points: data.points || 10,
            testCases: data.questions || [], // Map questions to testCases
            solution: '', // Not used for quizzes
            isActive: true
        }
        
        // Remove questions from data if it exists separately (we mapped it to testCases)
        delete quizData.questions
        
        await db.insert(challenges).values(quizData)
        
        revalidatePath('/instructor/quizzes')
        revalidatePath('/admin/quizzes')
        return { success: true }
    } catch (error) {
        console.error("[Action] createQuizAction error:", error)
        return { error: "Failed to create quiz" }
    }
}

export async function updateQuizAction(id: string, data: any) {
    console.log("[Action] updateQuizAction started", { id })
    try {
        const session = await auth()
        if (!session?.user?.id) return { error: "Unauthorized" }
        
        const userId = session.user.id
        
        // Verify ownership (allow admin)
        const whereClause = session.user.role === 'admin'
            ? eq(challenges.id, id)
            : and(eq(challenges.id, id), eq(challenges.instructorId, userId))

        const existing = await db.query.challenges.findFirst({
            where: whereClause
        })
        
        if (!existing) return { error: "Quiz not found or unauthorized" }
        
        const quizData = {
            ...data,
            testCases: data.questions || existing.testCases,
        }
        delete quizData.questions
        
        await db.update(challenges)
            .set(quizData)
            .where(eq(challenges.id, id))
            
        revalidatePath('/instructor/quizzes')
        revalidatePath('/admin/quizzes')
        return { success: true }
    } catch (error) {
        console.error("[Action] updateQuizAction error:", error)
        return { error: "Failed to update quiz" }
    }
}

export async function deleteQuizAction(id: string) {
    console.log("[Action] deleteQuizAction started", { id })
    try {
        const session = await auth()
        if (!session?.user?.id) return { error: "Unauthorized" }
        
        const userId = session.user.id
        
        // Verify ownership (allow admin)
        const whereClause = session.user.role === 'admin'
            ? eq(challenges.id, id)
            : and(eq(challenges.id, id), eq(challenges.instructorId, userId))

        const existing = await db.query.challenges.findFirst({
            where: whereClause
        })
        
        if (!existing) return { error: "Quiz not found or unauthorized" }
        
        await db.delete(challenges).where(eq(challenges.id, id))
            
        revalidatePath('/instructor/quizzes')
        revalidatePath('/admin/quizzes')
        return { success: true }
    } catch (error) {
        console.error("[Action] deleteQuizAction error:", error)
        return { error: "Failed to delete quiz" }
    }
}
