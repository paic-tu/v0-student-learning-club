"use server"

import { getPlatformStats } from "@/lib/db/queries"
import { db } from "@/lib/db"
import { reviews } from "@/lib/db/schema"
import { avg } from "drizzle-orm"

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
