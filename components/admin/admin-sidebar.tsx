"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  ShoppingCart,
  Trophy,
  Award,
  Settings,
  FileText,
  BookOpen,
  Zap,
} from "lucide-react"
import type { User } from "@/lib/auth"
import { hasPermission } from "@/lib/rbac/permissions"

interface AdminSidebarProps {
  user: User
}

export function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname()

  const menuItems = [
    {
      href: "/admin",
      label: "Dashboard",
      icon: LayoutDashboard,
      permission: null,
    },
    {
      href: "/admin/users",
      label: "Users & Roles",
      icon: Users,
      permission: "users:read" as const,
    },
    {
      href: "/admin/courses",
      label: "Courses",
      icon: GraduationCap,
      permission: "courses:read" as const,
    },
    {
      href: "/admin/lessons",
      label: "Lessons",
      icon: BookOpen,
      permission: "lessons:read" as const,
    },
    {
      href: "/admin/enrollments",
      label: "Enrollments",
      icon: Users,
      permission: "enrollments:read" as const,
    },
    {
      href: "/admin/store",
      label: "Store",
      icon: ShoppingCart,
      permission: "store:read" as const,
    },
    {
      href: "/admin/orders",
      label: "Orders",
      icon: FileText,
      permission: "orders:read" as const,
    },
    {
      href: "/admin/challenges",
      label: "Challenges",
      icon: Zap,
      permission: "challenges:read" as const,
    },
    {
      href: "/admin/contests",
      label: "Contests",
      icon: Trophy,
      permission: "contests:read" as const,
    },
    {
      href: "/admin/certificates",
      label: "Certificates",
      icon: Award,
      permission: "certificates:read" as const,
    },
    {
      href: "/admin/settings",
      label: "Settings",
      icon: Settings,
      permission: "settings:read" as const,
    },
    {
      href: "/admin/audit-logs",
      label: "Audit Logs",
      icon: FileText,
      permission: "audit:read" as const,
    },
  ]

  const visibleItems = menuItems.filter((item) => {
    if (!item.permission) return true
    return hasPermission(user.role as any, item.permission)
  })

  return (
    <aside className="flex w-64 flex-col border-r bg-background">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/admin" className="flex items-center gap-2 font-bold text-xl">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            N
          </div>
          <span>Neon Admin</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {visibleItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
