import { Suspense } from "react"
import { db } from "@/lib/db"
import { categories } from "@/lib/db/schema"
import { asc } from "drizzle-orm"
import { PageHeader } from "@/components/admin/page-header"
import { ContestForm } from "@/components/admin/contest-form"
import { ChallengeForm } from "@/components/admin/challenge-form"
import { requirePermission } from "@/lib/rbac/require-permission"

async function getCategories() {
  try {
    return await db.query.categories.findMany({
      columns: {
        id: true,
        nameEn: true,
        nameAr: true,
      },
      orderBy: [asc(categories.nameEn)],
    })
  } catch {
    return []
  }
}

export default async function NewContestPage(props: {
  params: Promise<{ lang: string }>
  searchParams?: Promise<{ mode?: string }>
}) {
  const { lang } = await props.params
  const sp = props.searchParams ? await props.searchParams : undefined
  const mode = sp?.mode
  const isFindBug = mode === "find-bug"

  if (isFindBug) {
    await requirePermission("challenges:write")
    const categoriesData = await getCategories()

    return (
      <div>
        <PageHeader
          title="Create Find the Bug (Python)"
          description="Add a Find the Bug challenge and publish it in Challenges"
          breadcrumbs={[
            { label: "Admin", href: `/${lang}/admin` },
            { label: "Contests", href: `/${lang}/admin/contests` },
            { label: "New Challenge" },
          ]}
        />

        <Suspense fallback={<div>Loading form...</div>}>
          <ChallengeForm
            categories={categoriesData as any}
            redirectTo={`/${lang}/challenges/{id}?created=1`}
            preset={{ type: "coding", codingFormat: "find_bug_python" }}
          />
        </Suspense>
      </div>
    )
  }

  await requirePermission("contests:write")

  return (
    <div>
      <PageHeader
        title="Create New Contest"
        description="Add a new contest to the platform"
        breadcrumbs={[
          { label: "Admin", href: `/${lang}/admin` },
          { label: "Contests", href: `/${lang}/admin/contests` },
          { label: "New" },
        ]}
      />

      <Suspense fallback={<div>Loading form...</div>}>
        <ContestForm />
      </Suspense>
    </div>
  )
}
