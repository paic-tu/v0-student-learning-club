
import { Metadata } from "next"
import { getCurrentUser } from "@/lib/auth"
import { hasPermission } from "@/lib/rbac/permissions"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { docsPages } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import ReactMarkdown from "react-markdown"

export const metadata: Metadata = {
  title: "Stream Payment Integration Guide | Neon",
  description: "Complete guide to integrating Stream payment gateway into your application.",
}

export default async function StreamDocsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const user = await getCurrentUser()

  if (!user) {
    redirect(`/${lang}/auth/login?redirectTo=/${lang}/docs/stream`)
  }

  if (!hasPermission(user.role as any, "docs:read")) {
    redirect(`/${lang}/access-denied`)
  }

  const doc =
    (await db.query.docsPages.findFirst({
      where: and(eq(docsPages.slug, "stream"), eq(docsPages.lang, lang)),
    })) ||
    (await db.query.docsPages.findFirst({
      where: and(eq(docsPages.slug, "stream"), eq(docsPages.lang, "en")),
    }))

  if (!doc) {
    return (
      <div className="container mx-auto py-12 px-4 max-w-4xl" dir={lang === "ar" ? "rtl" : "ltr"}>
        <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm">
          {lang === "ar"
            ? "توثيق Stream غير موجود بعد. شغّل db:push ثم نفّذ POST على /api/admin/docs/seed-stream."
            : "Stream docs are not seeded yet. Run db:push then POST /api/admin/docs/seed-stream."}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl" dir={lang === "ar" ? "rtl" : "ltr"}>
      <article className="prose dark:prose-invert max-w-none">
        <ReactMarkdown>{doc.contentMd}</ReactMarkdown>
      </article>
    </div>
  )
}
