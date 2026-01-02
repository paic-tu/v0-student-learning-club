"use server"

import { neon } from "@neondatabase/serverless"
import { z } from "zod"

const sql = neon(process.env.DATABASE_URL!)

const EnrollmentSchema = z.object({
  userId: z.number(),
  courseId: z.number(),
})

const OrderSchema = z.object({
  userId: z.number(),
  items: z.array(
    z.object({
      itemId: z.number(),
      quantity: z.number(),
      price: z.string(),
    }),
  ),
  totalAmount: z.string(),
  shippingAddress: z.string().optional(),
  notes: z.string().optional(),
})

const CertificateSchema = z.object({
  userId: z.number(),
  courseId: z.number().optional(),
  contestId: z.number().optional(),
})

const ChallengeSubmissionSchema = z.object({
  userId: z.number(),
  challengeId: z.number(),
  code: z.string(),
})

// Enrollment actions
export async function createUserEnrollment(userId: number, courseId: number) {
  try {
    const validated = EnrollmentSchema.parse({ userId, courseId })

    // Check if enrollment already exists
    const existing = await sql`
      SELECT id FROM enrollments 
      WHERE user_id = ${validated.userId} AND course_id = ${validated.courseId}
      LIMIT 1
    `

    if (existing.length > 0) {
      return { success: false, error: "Already enrolled" }
    }

    // Check if course is paid and user needs to purchase
    const course = await sql`
      SELECT is_free, price FROM courses WHERE id = ${validated.courseId}
    `

    if (course.length === 0) {
      return { success: false, error: "Course not found" }
    }

    if (!course[0].is_free) {
      return { success: false, error: "Must purchase paid course first" }
    }

    const result = await sql`
      INSERT INTO enrollments (user_id, course_id, progress, completed_lessons)
      VALUES (${validated.userId}, ${validated.courseId}, 0, '[]'::jsonb)
      RETURNING *
    `

    return { success: true, data: result[0] }
  } catch (error) {
    console.error("[v0] Enrollment error:", error)
    return { success: false, error: "Failed to create enrollment" }
  }
}

export async function markLessonComplete(userId: number, courseId: number, lessonId: number) {
  try {
    // Get current completed lessons
    const enrollment = await sql`
      SELECT completed_lessons FROM enrollments
      WHERE user_id = ${userId} AND course_id = ${courseId}
    `

    if (enrollment.length === 0) {
      return { success: false, error: "Enrollment not found" }
    }

    const completed = (enrollment[0].completed_lessons as number[]) || []
    if (!completed.includes(lessonId)) {
      completed.push(lessonId)
    }

    // Get total lessons in course
    const totalLessons = await sql`
      SELECT COUNT(*) as count FROM lessons WHERE course_id = ${courseId}
    `

    const progressPct = Math.round((completed.length / totalLessons[0].count) * 100)

    // Update enrollment
    await sql`
      UPDATE enrollments
      SET 
        completed_lessons = ${JSON.stringify(completed)}::jsonb,
        progress = ${progressPct},
        last_accessed_at = NOW()
      WHERE user_id = ${userId} AND course_id = ${courseId}
    `

    // Check if 100% - auto-issue certificate
    if (progressPct === 100) {
      const course = await sql`
        SELECT title_en, title_ar FROM courses WHERE id = ${courseId}
      `

      const certNumber = `CERT-${Date.now()}-${userId}-${courseId}`
      await sql`
        INSERT INTO certificates (user_id, course_id, certificate_number, title_en, title_ar, status, issued_at)
        VALUES (
          ${userId},
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

    return { success: true, progress: progressPct }
  } catch (error) {
    console.error("[v0] Mark lesson error:", error)
    return { success: false, error: "Failed to mark lesson complete" }
  }
}

// Order actions
export async function createUserOrder(data: z.infer<typeof OrderSchema>) {
  try {
    const validated = OrderSchema.parse(data)

    const result = await sql`
      INSERT INTO orders (user_id, items, total_amount, status)
      VALUES (
        ${validated.userId},
        ${JSON.stringify(validated.items)}::jsonb,
        ${validated.totalAmount}::decimal,
        'pending'
      )
      RETURNING *
    `

    return { success: true, data: result[0] }
  } catch (error) {
    console.error("[v0] Order creation error:", error)
    return { success: false, error: "Failed to create order" }
  }
}

// Certificate actions
export async function autoIssueCertificate(userId: number, courseId: number) {
  try {
    // Check if already issued
    const existing = await sql`
      SELECT id FROM certificates
      WHERE user_id = ${userId} AND course_id = ${courseId} AND status = 'issued'
    `

    if (existing.length > 0) {
      return { success: true, message: "Certificate already issued" }
    }

    const course = await sql`
      SELECT title_en, title_ar FROM courses WHERE id = ${courseId}
    `

    const certNumber = `CERT-${Date.now()}-${userId}-${courseId}`
    const result = await sql`
      INSERT INTO certificates (user_id, course_id, certificate_number, title_en, title_ar, status)
      VALUES (
        ${userId},
        ${courseId},
        ${certNumber},
        ${course[0].title_en},
        ${course[0].title_ar},
        'issued'
      )
      RETURNING *
    `

    return { success: true, data: result[0] }
  } catch (error) {
    console.error("[v0] Certificate issuance error:", error)
    return { success: false, error: "Failed to issue certificate" }
  }
}

export async function verifyCertificate(certificateNumber: string) {
  try {
    const result = await sql`
      SELECT 
        cert.*,
        u.name as user_name,
        c.title_en as course_title_en,
        c.title_ar as course_title_ar
      FROM certificates cert
      JOIN users u ON cert.user_id = u.id
      LEFT JOIN courses c ON cert.course_id = c.id
      WHERE cert.certificate_number = ${certificateNumber}
      LIMIT 1
    `

    if (result.length === 0) {
      return { success: false, error: "Certificate not found" }
    }

    return { success: true, data: result[0] }
  } catch (error) {
    console.error("[v0] Certificate verification error:", error)
    return { success: false, error: "Failed to verify certificate" }
  }
}

// Challenge submission
export async function submitChallengeCode(data: z.infer<typeof ChallengeSubmissionSchema>) {
  try {
    const validated = ChallengeSubmissionSchema.parse(data)

    // Mock verdict for demo
    const verdict = Math.random() > 0.3 ? "PASSED" : "FAILED"

    const result = await sql`
      INSERT INTO challenge_submissions (user_id, challenge_id, code, is_passed, result)
      VALUES (
        ${validated.userId},
        ${validated.challengeId},
        ${validated.code},
        ${verdict === "PASSED"},
        ${JSON.stringify({ verdict })}::jsonb
      )
      RETURNING *
    `

    return { success: true, data: result[0], verdict }
  } catch (error) {
    console.error("[v0] Challenge submission error:", error)
    return { success: false, error: "Failed to submit challenge" }
  }
}
