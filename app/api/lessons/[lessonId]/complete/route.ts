import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"
import { NextResponse } from "next/server"
import { z } from "zod"

const sql = neon(process.env.DATABASE_URL!)

const CompleteSchema = z.object({
  courseId: z.number().int(),
  complete: z.boolean(),
})

export async function POST(request: Request, props: { params: Promise<{ lessonId: string }> }) {
  const params = await props.params
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { courseId, complete } = CompleteSchema.parse(body)
    const lessonId = Number.parseInt(params.lessonId)

    if (Number.isNaN(lessonId)) {
      return NextResponse.json({ error: "Invalid lesson ID" }, { status: 400 })
    }

    // Get current enrollment
    const enrollment = await sql`
      SELECT completed_lessons, progress FROM enrollments
      WHERE user_id = ${user.id} AND course_id = ${courseId}
      LIMIT 1
    `

    if (enrollment.length === 0) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 })
    }

    let completedLessons = []
    try {
      completedLessons = JSON.parse(enrollment[0].completed_lessons || "[]")
    } catch {
      completedLessons = []
    }

    // Add or remove lesson from completed list
    if (complete && !completedLessons.includes(lessonId)) {
      completedLessons.push(lessonId)
    } else if (!complete && completedLessons.includes(lessonId)) {
      completedLessons = completedLessons.filter((id: number) => id !== lessonId)
    }

    // Get total lessons in course
    const totalLessonsResult = await sql`
      SELECT COUNT(*) as count FROM lessons WHERE course_id = ${courseId}
    `

    const totalLessons = totalLessonsResult[0]?.count || 1
    const progressPct = Math.round((completedLessons.length / totalLessons) * 100)

    // Update enrollment
    await sql`
      UPDATE enrollments
      SET 
        completed_lessons = ${JSON.stringify(completedLessons)},
        progress = ${progressPct},
        last_accessed_at = NOW(),
        updated_at = NOW()
      WHERE user_id = ${user.id} AND course_id = ${courseId}
    `

    // Auto-issue certificate if 100% complete
    if (progressPct === 100 && complete) {
      const course = await sql`
        SELECT title_en, title_ar FROM courses WHERE id = ${courseId}
      `

      if (course.length > 0) {
        const certNumber = `CERT-${Date.now()}-${user.id}-${courseId}`
        await sql`
          INSERT INTO certificates (user_id, course_id, certificate_number, title_en, title_ar, status, issued_at)
          VALUES (
            ${user.id},
            ${courseId},
            ${certNumber},
            ${course[0].title_en},
            ${course[0].title_ar},
            'issued',
            NOW()
          )
          ON CONFLICT (user_id, course_id) DO NOTHING
        `
      }
    }

    return NextResponse.json({
      success: true,
      progress: progressPct,
      completedLessons,
      message: complete ? "Lesson marked complete" : "Lesson marked incomplete",
    })
  } catch (error) {
    console.error("[v0] Error marking lesson complete:", error)
    return NextResponse.json({ error: "Failed to update lesson completion" }, { status: 500 })
  }
}
