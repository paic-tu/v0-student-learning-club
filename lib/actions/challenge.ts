"use server"

import { db } from "@/lib/db"
import { 
  challenges, 
  challengeSubmissions 
} from "@/lib/db/schema"
import { auth } from "@/lib/auth"
import { eq, and, desc } from "drizzle-orm"
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
        console.error("[Action] getChallengeAction error:", error)
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
            const isCorrect = userAnswer === q.answer
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
