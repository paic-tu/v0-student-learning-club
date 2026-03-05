"use server"

import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  try {
    const courseId = Number.parseInt(params.id)

    if (isNaN(courseId)) {
      return NextResponse.json({ error: "Invalid course ID" }, { status: 400 })
    }

    const courses = await sql`
      SELECT 
        c.*,
        u.name as instructor_name,
        u.bio as instructor_bio,
        cat.name_en as category_name_en,
        cat.name_ar as category_name_ar
      FROM courses c
      JOIN users u ON c.instructor_id = u.id
      LEFT JOIN categories cat ON c.category_id = cat.id
      WHERE c.id = ${courseId}
      LIMIT 1
    `

    if (courses.length === 0) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    const lessons = await sql`
      SELECT * FROM lessons
      WHERE course_id = ${courseId}
      ORDER BY order_index ASC
    `

    return NextResponse.json({ ...courses[0], lessons })
  } catch (error) {
    console.error("[v0] Error fetching course:", error)
    return NextResponse.json({ error: "Failed to fetch course" }, { status: 500 })
  }
}
