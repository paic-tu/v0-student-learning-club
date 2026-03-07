"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { t, Language } from "@/lib/i18n"
import {
  LayoutDashboard,
  BookOpen,
  Search,
  Award,
  Bookmark,
  StickyNote,
  User,
  Settings
} from "lucide-react"

export function StudentNav({ isCollapsed }: { isCollapsed?: boolean }) {
  const pathname = usePathname()
  const segments = pathname.split("/")
  const locale = (segments[1] || "ar") as Language
  const pathWithoutLocale = "/" + segments.slice(2).join("/")

  const menuItems = [
    {
      href: "/student/dashboard",
      label: t("dashboard", locale),
      icon: LayoutDashboard,
    },
    {
      href: "/student/my-courses",
      label: t("myCourses", locale),
      icon: BookOpen,
    },
    {
      href: "/student/browse",
      label: t("browse", locale),
      icon: Search,
    },
    {
      href: "/student/certificates",
      label: t("certificates", locale),
      icon: Award,
    },
    {
      href: "/student/bookmarks",
      label: t("bookmarks", locale),
      icon: Bookmark,
    },
    {
      href: "/student/notes",
      label: t("notes", locale),
      icon: StickyNote,
    },
    {
      href: "/student/profile",
      label: t("profile", locale),
      icon: User,
    },
    {
      href: "/student/settings",
      label: t("settings", locale),
      icon: Settings,
    },
  ]

  return (
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
                ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-400"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
              isCollapsed && "justify-center px-2"
            )}
            title={isCollapsed ? item.label : undefined}
          >
            <Icon className="h-5 w-5" />
            {!isCollapsed && <span>{item.label}</span>}
          </Link>
        )
      })}
    </nav>
  )
}
