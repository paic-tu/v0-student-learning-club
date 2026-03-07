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
    
    // Default to 4.9 (98%) if no reviews, as a fallback for empty DB
    const rawRating = ratingResult?.value ? Number(ratingResult.value) : 4.9
    const rawSatisfaction = Math.round((rawRating / 5) * 100)

    if (!stats) {
      return {
        courses: 172, // 156 * 1.1
        students: 13750, // 12500 * 1.1
        certificates: 9174, // 8340 * 1.1
        satisfaction: 98
      }
    }

    // Apply 10% increase logic as requested
    const increase = (val: number) => Math.ceil(val * 1.10)

    return {
      courses: increase(stats.course_count),
      students: increase(stats.student_count),
      certificates: increase(stats.certificate_count),
      // For satisfaction, we apply 10% increase but cap at 100%
      // Or maybe the user meant the count of satisfied users? 
      // Given the context "Satisfaction 98%", it's likely a percentage.
      // If we have 90%, 10% increase -> 99%.
      satisfaction: Math.min(Math.ceil(rawSatisfaction * 1.10), 100)
    }
  } catch (error) {
    console.error("Error fetching landing page stats:", error)
    return {
      courses: 172,
      students: 13750,
      certificates: 9174,
      satisfaction: 98
    }
  }
}
