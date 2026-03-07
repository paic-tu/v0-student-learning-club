import type React from "react"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { canAccessAdmin } from "@/lib/rbac/permissions"
import { AdminSidebar, AdminMobileNav } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import { RotateDevicePrompt } from "@/components/rotate-device-prompt"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const userPromise = Promise.race([
    getCurrentUser(),
    new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), 5000) // 5 second timeout
    }),
  ])

  const user = (await userPromise) as any

  if (!user) {
    redirect("/auth/login?redirect=/admin")
  }

  if (!canAccessAdmin(user.role as any)) {
    redirect("/?error=unauthorized")
  }

  return (
    <div className="flex h-screen bg-muted/20">
      <RotateDevicePrompt />
      <AdminSidebar user={user} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader user={user} mobileNav={<AdminMobileNav user={user} />} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
