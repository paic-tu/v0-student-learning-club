"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  BookOpen,
  MessageSquare,
  User,
  Settings,
  PlusCircle,
  BarChart
} from "lucide-react"

export function InstructorSidebar() {
  const pathname = usePathname()
  const segments = pathname.split("/")
  const locale = segments[1] || "ar"
  const pathWithoutLocale = "/" + segments.slice(2).join("/")

  const menuItems = [
    {
      href: "/instructor/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      href: "/instructor/courses",
      label: "My Courses",
      icon: BookOpen,
    },
    {
      href: "/instructor/courses/new",
      label: "Create Course",
      icon: PlusCircle,
    },
    {
      href: "/instructor/analytics", // Placeholder for analytics
      label: "Analytics",
      icon: BarChart,
    },
    {
      href: "/instructor/reviews",
      label: "Reviews",
      icon: MessageSquare,
    },
    {
      href: "/instructor/profile",
      label: "Profile",
      icon: User,
    },
    {
      href: "/instructor/settings",
      label: "Settings",
      icon: Settings,
    },
  ]

  return (
    <aside className="flex w-64 flex-col border-r bg-background h-screen sticky top-0">
      <div className="flex h-16 items-center border-b px-6">
        <Link href={`/${locale}/instructor/dashboard`} className="flex items-center gap-2 font-bold text-xl">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
            I
          </div>
          <span>Instructor</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathWithoutLocale === item.href || pathWithoutLocale.startsWith(item.href + "/")
          const hrefWithLocale = `/${locale}${item.href}`

          return (
            <Link
              key={item.href}
              href={hrefWithLocale}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-indigo-100 text-indigo-900"
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
