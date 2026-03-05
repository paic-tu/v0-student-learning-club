"use server"

import { auth } from "@/lib/auth"
import { toggleBookmark, isBookmarked } from "@/lib/db/queries"
import { revalidatePath } from "next/cache"

export async function toggleCourseBookmark(courseId: string) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return { error: "Unauthorized" }
    }

    const result = await toggleBookmark(session.user.id, courseId)
    
    // Revalidate across all languages
    revalidatePath("/[lang]/student/bookmarks", "page")
    revalidatePath("/[lang]/student/browse", "page")
    revalidatePath(`/[lang]/courses/${courseId}`, "page")
    revalidatePath(`/[lang]/student/course/${courseId}`, "page")
    
    // Also revalidate specific known paths to be safe
    revalidatePath("/en/student/bookmarks")
    revalidatePath("/ar/student/bookmarks")
    
    return { success: true, bookmarked: result.bookmarked }
  } catch (error) {
    console.error("Error toggling bookmark:", error)
    return { error: "Failed to toggle bookmark" }
  }
}

export async function checkBookmarkStatus(courseId: string) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return false
    }

    return await isBookmarked(session.user.id, courseId)
  } catch (error) {
    console.error("Error checking bookmark status:", error)
    return false
  }
}
