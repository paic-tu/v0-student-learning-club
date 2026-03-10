"use server"

import { getPlatformStats } from "@/lib/db/queries"
import { db } from "@/lib/db"
import { courses, reviews, users } from "@/lib/db/schema"
import { and, avg, desc, eq, isNotNull, sql } from "drizzle-orm"

export async function getLandingPageStats() {
  try {
    const stats = await getPlatformStats()
    
    // Fetch average rating for satisfaction
    const [ratingResult] = await db
      .select({ value: avg(reviews.rating) })
      .from(reviews)
    
    // Default to 0 if no reviews
    const rawRating = ratingResult?.value ? Number(ratingResult.value) : 0
    const rawSatisfaction = rawRating ? Math.round((rawRating / 5) * 100) : 0

    if (!stats) {
      return {
        courses: 0,
        students: 0,
        certificates: 0,
        satisfaction: 0
      }
    }

    return {
      courses: stats.course_count,
      students: stats.student_count,
      certificates: stats.certified_student_count,
      satisfaction: rawSatisfaction
    }
  } catch (error) {
    console.error("Error fetching landing page stats:", error)
    return {
      courses: 0,
      students: 0,
      certificates: 0,
      satisfaction: 0
    }
  }
}

export async function getLandingPageReviews(limit = 6) {
  try {
    const rows = await db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        comment: reviews.comment,
        createdAt: reviews.createdAt,
        userName: users.name,
        userAvatarUrl: users.avatarUrl,
        courseTitleAr: courses.titleAr,
        courseTitleEn: courses.titleEn,
      })
      .from(reviews)
      .innerJoin(users, eq(reviews.userId, users.id))
      .innerJoin(courses, eq(reviews.courseId, courses.id))
      .where(
        and(
          eq(reviews.isPublished, true),
          isNotNull(reviews.comment),
          sql`length(${reviews.comment}) > 0`
        )
      )
      .orderBy(desc(reviews.createdAt))
      .limit(Math.max(1, Math.min(12, Number(limit) || 6)))

    return rows
  } catch (error) {
    console.error("Error fetching landing page reviews:", error)
    return []
  }
}
