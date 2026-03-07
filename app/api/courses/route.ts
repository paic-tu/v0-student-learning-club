"use server"

import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { courses, users, categories } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { auth } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const session = await auth()
    const values = await req.json()

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const [course] = await db
      .insert(courses)
      .values({
        instructorId: session.user.id,
        ...values,
      })
      .returning()

    return NextResponse.json(course)
  } catch (error) {
    console.error("[COURSES_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function GET() {
  try {
    const result = await db
      .select({
        // Spread all course fields
        id: courses.id,
        titleEn: courses.titleEn,
        titleAr: courses.titleAr,
        subtitleEn: courses.subtitleEn,
        subtitleAr: courses.subtitleAr,
        descriptionEn: courses.descriptionEn,
        descriptionAr: courses.descriptionAr,
        slug: courses.slug,
        thumbnailUrl: courses.thumbnailUrl,
        previewVideoUrl: courses.previewVideoUrl,
        instructorId: courses.instructorId,
        categoryId: courses.categoryId,
        difficulty: courses.difficulty,
        language: courses.language,
        duration: courses.duration,
        price: courses.price,
        isFree: courses.isFree,
        isPublished: courses.isPublished,
        tags: courses.tags,
        requirements: courses.requirements,
        learningOutcomes: courses.learningOutcomes,
        enrollmentCount: courses.enrollmentCount,
        rating: courses.rating,
        reviewsCount: courses.reviewsCount,
        createdAt: courses.createdAt,
        updatedAt: courses.updatedAt,
        
        // Joined fields
        instructor_name: users.name,
        category_name_en: categories.nameEn,
        category_name_ar: categories.nameAr,
      })
      .from(courses)
      .innerJoin(users, eq(courses.instructorId, users.id))
      .leftJoin(categories, eq(courses.categoryId, categories.id))
      .where(eq(courses.isPublished, true))
      .orderBy(desc(courses.createdAt))

    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Error fetching courses:", error)
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 })
  }
}
