"use server"

import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { courses, users, categories, lessons } from "@/lib/db/schema"
import { eq, asc } from "drizzle-orm"

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  try {
    const courseId = params.id

    // Fetch course details with instructor and category
    const courseResult = await db
      .select({
        // Course fields
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
        instructor_bio: users.bio,
        category_name_en: categories.nameEn,
        category_name_ar: categories.nameAr,
      })
      .from(courses)
      .innerJoin(users, eq(courses.instructorId, users.id))
      .leftJoin(categories, eq(courses.categoryId, categories.id))
      .where(eq(courses.id, courseId))
      .limit(1)

    if (courseResult.length === 0) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    const course = courseResult[0]

    // Fetch lessons
    const courseLessons = await db
      .select()
      .from(lessons)
      .where(eq(lessons.courseId, courseId))
      .orderBy(asc(lessons.orderIndex))

    return NextResponse.json({ ...course, lessons: courseLessons })
  } catch (error) {
    console.error("[v0] Error fetching course:", error)
    return NextResponse.json({ error: "Failed to fetch course" }, { status: 500 })
  }
}
