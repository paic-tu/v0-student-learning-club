import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { docsPages } from "@/lib/db/schema"
import { requirePermission } from "@/lib/rbac/require-permission"
import { STREAM_DOCS_MD_AR, STREAM_DOCS_MD_EN } from "@/lib/docs/stream-doc"
import { eq, and } from "drizzle-orm"

export async function POST() {
  const user = await requirePermission("docs:write")

  const upsert = async (lang: string, title: string, contentMd: string) => {
    const existing = await db.query.docsPages.findFirst({
      where: and(eq(docsPages.slug, "stream"), eq(docsPages.lang, lang)),
      columns: { id: true },
    })

    if (existing?.id) {
      await db
        .update(docsPages)
        .set({
          title,
          description: "Stream payment gateway documentation",
          contentMd,
          isPublic: false,
          updatedAt: new Date(),
          updatedByUserId: user.id,
        })
        .where(eq(docsPages.id, existing.id))
      return existing.id
    }

    const [created] = await db
      .insert(docsPages)
      .values({
        slug: "stream",
        lang,
        title,
        description: "Stream payment gateway documentation",
        contentMd,
        isPublic: false,
        updatedByUserId: user.id,
      })
      .returning({ id: docsPages.id })

    return created?.id
  }

  const arId = await upsert("ar", "توثيق Stream (داخلي)", STREAM_DOCS_MD_AR)
  const enId = await upsert("en", "Stream Docs (Internal)", STREAM_DOCS_MD_EN)

  return NextResponse.json({ success: true, ids: { ar: arId, en: enId } })
}

