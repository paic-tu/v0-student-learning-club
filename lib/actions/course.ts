"use server"

import { db } from "@/lib/db"
import { enrollments, progress, lessons } from "@/lib/db/schema"
import { auth } from "@/lib/auth"
import { eq, and, count } from "drizzle-orm"
import { revalidatePath } from "next/cache"

// --- Course Actions ---

export async function enrollAction(courseId: string) {
  console.log("[Action] enrollAction started", { courseId })
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      console.log("[Action] Unauthorized enrollment attempt")
      return { error: "Unauthorized" }
    }

    const userId = session.user.id

    // Check if already enrolled
    const existing = await db.query.enrollments.findFirst({
      where: and(
        eq(enrollments.userId, userId),
        eq(enrollments.courseId, courseId)
      )
    })

    if (existing) {
      return { success: true, alreadyEnrolled: true }
    }

    // Create enrollment
    await db.insert(enrollments).values({
      userId,
      courseId,
      status: "active",
      progress: 0,
      completedLessons: [],
    })

    revalidatePath(`/courses/${courseId}`)
    revalidatePath(`/library`)
    
    return { success: true }
  } catch (error) {
    console.error("Enrollment error:", error)
    return { error: "Failed to enroll" }
  }
}

export async function completeLessonAction(courseId: string, lessonId: string) {
  console.log("[Action] completeLessonAction started", { courseId, lessonId })
  try {
    const session = await auth()
    if (!session?.user?.id) {
      console.log("[Action] Unauthorized")
      return { error: "Unauthorized" }
    }

    const userId = session.user.id

    let enrollment = await db.query.enrollments.findFirst({
      where: and(
        eq(enrollments.userId, userId),
        eq(enrollments.courseId, courseId)
      )
    })

    if (!enrollment) {
      // If instructor or admin, auto-enroll them so they can track progress
      const role = (session.user as any).role
      if (role === "instructor" || role === "admin") {
          const [newEnrollment] = await db.insert(enrollments).values({
              userId,
              courseId,
              status: "active",
              progress: 0,
              completedLessons: [],
          }).returning()
          enrollment = newEnrollment
      } else {
          return { error: "Not enrolled" }
      }
    }

    // 1. Mark lesson as completed in progress table
    const existingProgress = await db.query.progress.findFirst({
      where: and(
        eq(progress.userId, userId),
        eq(progress.lessonId, lessonId)
      )
    })

    if (existingProgress) {
      await db.update(progress)
        .set({ 
          isCompleted: true, 
          progressPercentage: 100,
          lastAccessed: new Date()
        })
        .where(eq(progress.id, existingProgress.id))
    } else {
      await db.insert(progress).values({
        userId,
        lessonId,
        isCompleted: true,
        progressPercentage: 100,
      })
    }

    // 2. Recalculate Course Progress
    // Get all lessons for this course
    const courseLessons = await db.query.lessons.findMany({
      where: eq(lessons.courseId, courseId),
      columns: { id: true } // Only need IDs
    })

    const totalLessons = courseLessons.length

    // Get all completed lessons for this user in this course
    // We filter progress entries where lessonId is in courseLessons AND isCompleted is true
    const lessonIds = courseLessons.map(l => l.id)
    
    const completedProgressEntries = await db.query.progress.findMany({
      where: and(
        eq(progress.userId, userId),
        eq(progress.isCompleted, true)
        // We need to filter by lessons in this course. 
        // Drizzle doesn't support 'inArray' easily on relations in findMany without helper, 
        // but we can filter in JS if the set is small, or use raw SQL.
        // Given we have the lesson IDs, let's filter in memory or loop. 
        // Better: fetch progress for these specific lesson IDs.
      )
    })

    // Filter to only lessons in this course
    const completedLessonIds = completedProgressEntries
      .filter(p => lessonIds.includes(p.lessonId))
      .map(p => p.lessonId)

    const completedCount = completedLessonIds.length
    const progressPct = totalLessons > 0 
      ? Math.round((completedCount / totalLessons) * 100) 
      : 0

    // 3. Update Enrollment
    await db.update(enrollments)
      .set({ 
        completedLessons: completedLessonIds,
        progress: progressPct,
        lastAccessedAt: new Date()
      })
      .where(eq(enrollments.id, enrollment.id))

    revalidatePath(`/courses/${courseId}`)
    revalidatePath(`/student/course/${courseId}`)
    revalidatePath(`/student/learn/${courseId}/${lessonId}`)
    
    return { success: true, progress: progressPct }
  } catch (error) {
    console.error("Complete lesson error:", error)
    return { error: "Failed to complete lesson" }
  }
}
