import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { courses, modules } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { z } from "zod"

const updateModuleSchema = z.object({
  title_en: z.string().min(1).optional(),
  title_ar: z.string().min(1).optional(),
  order: z.coerce.number().optional(),
})

export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ id: string, moduleId: string }> }
) {
  const params = await props.params
  try {
    const session = await auth()
    const { id: courseId, moduleId } = params

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
    const parsed = updateModuleSchema.safeParse(body)

    if (!parsed.success) {
        return new NextResponse("Invalid data", { status: 400 })
    }

    const { title_en, title_ar, order } = parsed.data
    
    const updateData: any = {}
    if (title_en) updateData.titleEn = title_en
    if (title_ar) updateData.titleAr = title_ar
    if (order !== undefined) updateData.orderIndex = order

    const [module] = await db.update(modules)
        .set(updateData)
        .where(and(eq(modules.id, moduleId), eq(modules.courseId, courseId)))
        .returning()

    if (!module) {
        return new NextResponse("Module not found", { status: 404 })
    }

    return NextResponse.json(module)
  } catch (error) {
    console.log("[MODULE_PATCH]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string, moduleId: string }> }
) {
  const params = await props.params
  try {
    const session = await auth()
    const { id: courseId, moduleId } = params

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

    const [deletedModule] = await db.delete(modules)
        .where(and(eq(modules.id, moduleId), eq(modules.courseId, courseId)))
        .returning()

    if (!deletedModule) {
        return new NextResponse("Module not found", { status: 404 })
    }

    return NextResponse.json(deletedModule)
  } catch (error) {
    console.log("[MODULE_DELETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
