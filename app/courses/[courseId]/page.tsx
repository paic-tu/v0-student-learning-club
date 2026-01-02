"use client"
import { NavBar } from "@/components/nav-bar"
import { Suspense } from "react"
import { notFound } from "next/navigation"
import { getCourseById } from "@/lib/db/queries"
import { CourseDetailClient } from "@/components/course-detail-client"

export default async function CourseDetailPage({ params }: { params: { courseId: string } }) {
  const courseId = Number.parseInt(params.courseId)

  if (Number.isNaN(courseId)) {
    notFound()
  }

  const course = await getCourseById(courseId)

  if (!course) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <Suspense fallback={<div className="p-8 text-center">Loading course...</div>}>
        <CourseDetailClient course={course} />
      </Suspense>
    </div>
  )
}
