import { Suspense } from "react"
import { PageHeader } from "@/components/admin/page-header"
import { UserForm } from "@/components/admin/user-form"
import { requirePermission } from "@/lib/rbac/require-permission"

export default async function NewUserPage() {
  await requirePermission("users:write")

  return (
    <div>
      <PageHeader
        title="Create New User"
        description="Add a new user to the platform"
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Users", href: "/admin/users" }, { label: "New" }]}
      />

      <Suspense fallback={<div>Loading form...</div>}>
        <UserForm />
      </Suspense>
    </div>
  )
}
