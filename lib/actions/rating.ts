"use server"

import { db } from "@/lib/db"
import { reviews, courses } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function submitRating({
  courseId,
  rating,
  instructorRating,
  comment,
}: {
  courseId: string
  rating: number
  instructorRating: number
  comment?: string
}) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  const userId = session.user.id

  try {
    // Check if user already reviewed this course
    const existingReview = await db.query.reviews.findFirst({
      where: and(
        eq(reviews.userId, userId),
        eq(reviews.courseId, courseId)
      ),
    })

    if (existingReview) {
      // Update existing review
      await db
        .update(reviews)
        .set({
          rating,
          instructorRating,
          comment,
          updatedAt: new Date(),
        })
        .where(eq(reviews.id, existingReview.id))
    } else {
      // Create new review
      await db.insert(reviews).values({
        userId,
        courseId,
        rating,
        instructorRating,
        comment,
      })
    }

    // Update course average rating (simple average of course ratings)
    // In a real app, you might want to do this in a background job or use a trigger
    // For now, we'll just calculate it on the fly or leave it to be aggregated
    // But let's try to update the course table if we can
    
    // Fetch all ratings for this course to calculate new average
    const courseReviews = await db.query.reviews.findMany({
      where: eq(reviews.courseId, courseId),
      columns: {
        rating: true,
      }
    })

    if (courseReviews.length > 0) {
      const totalRating = courseReviews.reduce((sum, r) => sum + r.rating, 0)
      const avgRating = (totalRating / courseReviews.length).toFixed(1)
      
      await db.update(courses)
        .set({ 
          rating: avgRating,
          reviewsCount: courseReviews.length
        })
        .where(eq(courses.id, courseId))
    }

    revalidatePath(`/courses/${courseId}`)
    revalidatePath(`/student/learn/${courseId}`)
    
    return { success: true }
  } catch (error) {
    console.error("Failed to submit rating:", error)
    return { error: "Failed to submit rating" }
  }
}

export async function checkUserRating(courseId: string) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return false
  }

  const userId = session.user.id

  try {
    const existingReview = await db.query.reviews.findFirst({
      where: and(
        eq(reviews.userId, userId),
        eq(reviews.courseId, courseId)
      ),
    })

    return !!existingReview
  } catch (error) {
    console.error("Failed to check user rating:", error)
    return false
  }
}
