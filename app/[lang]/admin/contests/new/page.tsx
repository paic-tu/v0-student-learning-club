import { Suspense } from "react"
import { PageHeader } from "@/components/admin/page-header"
import { ContestForm } from "@/components/admin/contest-form"
import { requirePermission } from "@/lib/rbac/require-permission"

export default async function NewContestPage() {
  await requirePermission("contests:write")

  return (
    <div>
      <PageHeader
        title="Create New Contest"
        description="Add a new contest to the platform"
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Contests", href: "/admin/contests" },
          { label: "New" },
        ]}
      />

      <Suspense fallback={<div>Loading form...</div>}>
        <ContestForm />
      </Suspense>
    </div>
  )
}
