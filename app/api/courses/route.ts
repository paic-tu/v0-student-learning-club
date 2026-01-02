"use server"

import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const courses = await sql`
      SELECT 
        c.*,
        u.name as instructor_name,
        cat.name_en as category_name_en,
        cat.name_ar as category_name_ar
      FROM courses c
      JOIN users u ON c.instructor_id = u.id
      LEFT JOIN categories cat ON c.category_id = cat.id
      WHERE c.is_published = true
      ORDER BY c.created_at DESC
    `

    return Response.json(courses)
  } catch (error) {
    console.error("[v0] Error fetching courses:", error)
    return Response.json({ error: "Failed to fetch courses" }, { status: 500 })
  }
}
