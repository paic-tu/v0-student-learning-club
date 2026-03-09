"use server"

import { db } from "@/lib/db"
import { certificates, courses } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { nanoid } from "nanoid"

import { revalidatePath } from "next/cache"

export async function approveCertificateAction(certificateId: string) {
  const session = await auth()
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized")
  }

  await db
    .update(certificates)
    .set({ 
      status: "issued",
      issuedAt: new Date()
    })
    .where(eq(certificates.id, certificateId))

  revalidatePath("/admin/certificates")
  revalidatePath("/[lang]/admin/certificates", "page")
}

export async function getOrCreateCertificate(courseId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const userId = session.user.id

  // 1. Check if certificate already exists
  const existingCertificate = await db.query.certificates.findFirst({
    where: and(
      eq(certificates.userId, userId),
      eq(certificates.courseId, courseId)
    ),
  })

  if (existingCertificate) {
    return {
      certificateNumber: existingCertificate.certificateNumber,
      issuedAt: existingCertificate.issuedAt,
    }
  }

  // 2. If not, create a new one
  // Fetch course details for title
  const course = await db.query.courses.findFirst({
    where: eq(courses.id, courseId),
  })

  if (!course) {
    throw new Error("Course not found")
  }

  // Generate a unique certificate number starting with NEON
  // Using nanoid for uniqueness, but keeping it readable if possible
  const uniqueId = nanoid(10).toUpperCase()
  const certificateNumber = `NEON-${uniqueId}`

  const [newCertificate] = await db
    .insert(certificates)
    .values({
      userId,
      courseId,
      certificateNumber,
      titleEn: `${course.titleEn} Certificate`,
      titleAr: `شهادة ${course.titleAr}`,
      status: "issued",
      issuedAt: new Date(),
    })
    .returning()

  return {
    certificateNumber: newCertificate.certificateNumber,
    issuedAt: newCertificate.issuedAt,
  }
}
