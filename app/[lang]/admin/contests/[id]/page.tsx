
import { Suspense } from "react"
import { notFound } from "next/navigation"
import { PageHeader } from "@/components/admin/page-header"
import { ContestForm } from "@/components/admin/contest-form"
import { requirePermission } from "@/lib/rbac/require-permission"
import { db } from "@/lib/db"
import { contests } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

interface EditContestPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditContestPage(props: EditContestPageProps) {
  const params = await props.params;
  await requirePermission("contests:read")

  const contest = await db.query.contests.findFirst({
    where: eq(contests.id, params.id),
  })

  if (!contest) {
    notFound()
  }

  return (
    <div>
      <PageHeader
        title="Edit Contest"
        description={`Edit details for ${contest.titleEn}`}
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Contests", href: "/admin/contests" },
          { label: contest.titleEn },
        ]}
      />

      <Suspense fallback={<div>Loading form...</div>}>
        <ContestForm initialData={contest} />
      </Suspense>
    </div>
  )
}
