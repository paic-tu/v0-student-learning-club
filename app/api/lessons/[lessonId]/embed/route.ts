import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { courses, enrollments, lessons, modules } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import { buildYouTubeNoCookieEmbedUrl, extractYouTubeVideoId } from "@/lib/video/youtube"

export const runtime = "nodejs"

export async function GET(_req: NextRequest, props: { params: Promise<{ lessonId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 })

  const { lessonId } = await props.params
  if (!lessonId) return new NextResponse("Invalid params", { status: 400 })

  const rows = await db
    .select({
      id: lessons.id,
      type: lessons.type,
      videoProvider: lessons.videoProvider,
      videoUrl: lessons.videoUrl,
      isPreview: lessons.isPreview,
      courseId: lessons.courseId,
      moduleCourseId: modules.courseId,
      instructorId: courses.instructorId,
    })
    .from(lessons)
    .leftJoin(modules, eq(lessons.moduleId, modules.id))
    .leftJoin(courses, eq(courses.id, lessons.courseId))
    .where(eq(lessons.id, lessonId))
    .limit(1)

  const lesson = rows[0]
  if (!lesson) return new NextResponse("Not found", { status: 404 })

  const courseId = (lesson.courseId || lesson.moduleCourseId) as string | null
  if (!courseId) return new NextResponse("Not found", { status: 404 })

  const role = (session.user as any).role || "student"
  const userId = session.user.id

  if (role === "student" && !lesson.isPreview) {
    const e = await db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)))
      .limit(1)
    if (!e[0]) return new NextResponse("Forbidden", { status: 403 })
  } else if (role === "instructor") {
    const c = await db.select({ instructorId: courses.instructorId }).from(courses).where(eq(courses.id, courseId)).limit(1)
    if (!c[0] || c[0].instructorId !== userId) return new NextResponse("Forbidden", { status: 403 })
  } else if (role !== "admin" && role !== "student") {
    return new NextResponse("Forbidden", { status: 403 })
  }

  const youtubeId = extractYouTubeVideoId(String(lesson.videoUrl || ""))
  if (!youtubeId) return new NextResponse("Not found", { status: 404 })

  const embedUrl = buildYouTubeNoCookieEmbedUrl(youtubeId)

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      html, body { margin: 0; padding: 0; height: 100%; background: #000; }
      .wrap { position: fixed; inset: 0; }
      iframe { width: 100%; height: 100%; border: 0; display: block; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <iframe
        src="${embedUrl}"
        allow="autoplay; encrypted-media; picture-in-picture"
        allowfullscreen
        referrerpolicy="strict-origin-when-cross-origin"
      ></iframe>
    </div>
  </body>
</html>`

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  })
}

