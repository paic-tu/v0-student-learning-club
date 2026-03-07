import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { courses, modules } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { z } from "zod"

const createModuleSchema = z.object({
  title_en: z.string().min(1),
  title_ar: z.string().min(1),
  order: z.coerce.number().optional(),
})

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  try {
    const session = await auth()
    const { id: courseId } = params

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const course = await db.query.courses.findFirst({
      where: eq(courses.id, courseId),
    })

    if (!course) {
      return new NextResponse("Not found", { status: 404 })
    }

    if (course.instructorId !== session.user.id && session.user.role !== "admin") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const parsed = createModuleSchema.safeParse(body)

    if (!parsed.success) {
        return new NextResponse("Invalid data", { status: 400 })
    }

    const { title_en, title_ar, order } = parsed.data

    // Calculate order if not provided
    let orderIndex = order
    if (orderIndex === undefined) {
        const lastModule = await db.query.modules.findFirst({
            where: eq(modules.courseId, courseId),
            orderBy: [desc(modules.orderIndex)],
        })
        orderIndex = (lastModule?.orderIndex ?? -1) + 1
    }

    const [module] = await db.insert(modules).values({
        courseId,
        titleEn: title_en,
        titleAr: title_ar,
        orderIndex: orderIndex,
    }).returning()

    return NextResponse.json(module)
  } catch (error) {
    console.log("[MODULES_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
