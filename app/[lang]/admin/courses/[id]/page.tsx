import { requirePermission } from "@/lib/rbac/require-permission"
import { notFound, redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus } from "lucide-react"
import Link from "next/link"
import { CourseEditForm } from "@/components/admin/course-edit-form"
import { LessonsList } from "@/components/admin/lessons-list"
import { ModulesList } from "@/components/admin/modules-list"
import { db } from "@/lib/db"
import { courses, users, categories, lessons, modules } from "@/lib/db/schema"
import { eq, asc, or, desc } from "drizzle-orm"

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string; lang: string }> }) {
  const { id, lang } = await params

  if (id === "new") {
    redirect(`/${lang}/admin/courses/new`)
  }

  await requirePermission("courses:read")

  const courseId = id

  if (!courseId || courseId.length < 10) {
    notFound()
  }

  const courseResult = await db
    .select({
      // Spread all course fields manually to ensure type safety and inclusion
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
      streamProductId: courses.streamProductId,
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
      category_name: categories.nameEn,
    })
    .from(courses)
    .innerJoin(users, eq(courses.instructorId, users.id))
    .leftJoin(categories, eq(courses.categoryId, categories.id))
    .where(eq(courses.id, courseId))
    .limit(1)

  if (courseResult.length === 0) {
    notFound()
  }

  // Transform to match the shape expected by components (snake_case properties if needed)
  // The existing components seem to expect snake_case based on the previous SQL query
  const rawCourse = courseResult[0]
  const course = {
    ...rawCourse,
    title_en: rawCourse.titleEn,
    title_ar: rawCourse.titleAr,
    is_published: rawCourse.isPublished,
    instructor_id: rawCourse.instructorId,
    category_id: rawCourse.categoryId,
    subtitle_en: rawCourse.subtitleEn,
    subtitle_ar: rawCourse.subtitleAr,
    description_en: rawCourse.descriptionEn,
    description_ar: rawCourse.descriptionAr,
    thumbnail_url: rawCourse.thumbnailUrl,
    preview_video_url: rawCourse.previewVideoUrl,
    is_free: rawCourse.isFree,
    stream_product_id: rawCourse.streamProductId,
    learning_outcomes: rawCourse.learningOutcomes,
    enrollment_count: rawCourse.enrollmentCount,
    reviews_count: rawCourse.reviewsCount,
    created_at: rawCourse.createdAt,
    updated_at: rawCourse.updatedAt,
  }

  const courseLessons = await db
    .select()
    .from(lessons)
    .where(eq(lessons.courseId, courseId))
    .orderBy(asc(lessons.orderIndex))

  const courseModules = await db
    .select()
    .from(modules)
    .where(eq(modules.courseId, courseId))
    .orderBy(asc(modules.orderIndex))

  const allCategories = await db
    .select()
    .from(categories)
    .orderBy(asc(categories.nameEn))

  const instructors = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
    })
    .from(users)
    .where(or(eq(users.role, "instructor"), eq(users.role, "admin")))
    .orderBy(asc(users.name))

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${lang}/admin/courses`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{course.titleEn}</h1>
          <p className="text-muted-foreground">by {course.instructor_name}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/${lang}/admin/enrollments?courseId=${courseId}`}>Enrollments</Link>
          </Button>
          <Badge variant={course.isPublished ? "default" : "secondary"}>
            {course.isPublished ? "Published" : "Draft"}
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Course Information</CardTitle>
        </CardHeader>
        <CardContent>
          <CourseEditForm 
            course={course as any} 
            categories={allCategories.map(c => ({...c, name_en: c.nameEn, name_ar: c.nameAr})) as any} 
            instructors={instructors} 
            lang={lang}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Modules ({courseModules.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ModulesList modules={courseModules as any} courseId={courseId} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lessons ({courseLessons.length})</CardTitle>
            <Button size="sm" asChild>
              <Link href={`/${lang}/admin/courses/${courseId}/lessons/new`}>
                <Plus className="mr-2 h-4 w-4" />
                Add Lesson
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <LessonsList lessons={courseLessons} courseId={courseId} />
        </CardContent>
      </Card>
    </div>
  )
}
