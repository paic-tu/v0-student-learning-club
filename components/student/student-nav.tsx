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
  Settings,
  MessageCircle,
  Video,
  FileText
} from "lucide-react"
import { useEffect, useState } from "react"

export function StudentNav({ isCollapsed }: { isCollapsed?: boolean }) {
  const pathname = usePathname()
  const segments = pathname.split("/")
  const locale = (segments[1] || "ar") as Language
  const pathWithoutLocale = "/" + segments.slice(2).join("/")
  const isAr = locale === "ar"

  const [liveCourses, setLiveCourses] = useState<Array<{ id: string; titleEn: string; titleAr: string }>>([])
  const [loadingLive, setLoadingLive] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    let timeout: ReturnType<typeof setTimeout> | null = null
    let stopped = false

    const fetchLive = async (isInitial = false) => {
      try {
        if (isInitial) setLoadingLive(true)
        const res = await fetch("/api/live/courses", { signal: controller.signal })
        const data = await res.json()
        const next = (data?.courses || []).slice(0, 6)
        setLiveCourses(next)
        return Array.isArray(next) ? next.length : 0
      } catch {
        return null
      } finally {
        if (isInitial) setLoadingLive(false)
      }
    }

    const schedule = async (isInitial = false) => {
      if (stopped) return
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        timeout = setTimeout(() => schedule(false), 60_000)
        return
      }
      const count = await fetchLive(isInitial)
      const nextDelay = typeof count === "number" ? (count > 0 ? 10_000 : 120_000) : 60_000
      timeout = setTimeout(() => schedule(false), nextDelay)
    }

    const onVisibility = () => {
      if (typeof document === "undefined") return
      if (document.visibilityState === "visible") {
        if (timeout) clearTimeout(timeout)
        schedule(false)
      }
    }

    schedule(true)
    document.addEventListener("visibilitychange", onVisibility)
    return () => {
      stopped = true
      controller.abort()
      if (timeout) clearTimeout(timeout)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [])

  const navGroups = [
    {
      id: "main",
      titleAr: "الرئيسية",
      titleEn: "Main",
      items: [
        {
          href: "/student/dashboard",
          label: t("dashboard", locale),
          icon: LayoutDashboard,
        },
      ],
    },
    {
      id: "learning",
      titleAr: "التعلم",
      titleEn: "Learning",
      items: [
        {
          href: "/student/my-courses",
          label: t("myCourses", locale),
          icon: BookOpen,
        },
        {
          href: "/student/assignments",
          label: isAr ? "واجباتي" : "My Assignments",
          icon: FileText,
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
      ],
    },
    {
      id: "tools",
      titleAr: "الأدوات",
      titleEn: "Tools",
      items: [
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
      ],
    },
    {
      id: "community",
      titleAr: "المجتمع",
      titleEn: "Community",
      items: [
        {
          href: "/student/chat",
          label: locale === "ar" ? "المحادثات" : "Chat",
          icon: MessageCircle,
        },
        {
          href: "/student/consultations?room=consultation-tech",
          label: locale === "ar" ? "استشارات تقنية" : "Tech Consultation",
          icon: Video,
        },
      ],
    },
    {
      id: "account",
      titleAr: "الحساب",
      titleEn: "Account",
      items: [
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
      ],
    },
  ]

  return (
    <nav className="flex-1 overflow-y-auto py-4">
      {navGroups.map((group) => (
        <div key={group.id} className={cn(!isCollapsed && "mt-4 pt-4 border-t")}>
          {!isCollapsed && (
            <div className="px-6 pb-2 text-xs font-semibold text-muted-foreground">
              {isAr ? group.titleAr : group.titleEn}
            </div>
          )}
          {group.items.map((item) => {
            const Icon = item.icon
            const itemPath = item.href.split("?")[0]
            const isActive = pathWithoutLocale === itemPath || pathWithoutLocale.startsWith(itemPath + "/")
            const hrefWithLocale = `/${locale}${item.href}`

            return (
              <Link
                key={item.href}
                href={hrefWithLocale}
                className={cn(
                  "flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors border-s-4 border-transparent",
                  isActive
                    ? "bg-primary/10 border-primary text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  isCollapsed && "justify-center px-2 border-s-0",
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            )
          })}
        </div>
      ))}
      
      {!isCollapsed && (
        <div className="mt-4 pt-4 border-t">
          <div className="px-6 pb-2 text-xs font-semibold text-muted-foreground">
            {isAr ? "الدورات المباشرة" : "Live Courses"}
          </div>
          {loadingLive && (
            <div className="px-6 py-2 text-xs text-muted-foreground">
              {isAr ? "جاري التحميل..." : "Loading..."}
            </div>
          )}
          {liveCourses.map((c) => {
            const hrefWithLocale = `/${locale}/student/course/${c.id}/live`
            const isActive = pathWithoutLocale.startsWith(`/student/course/${c.id}/live`)
            return (
              <Link
                key={c.id}
                href={hrefWithLocale}
                className={cn(
                  "flex items-center gap-3 px-6 py-2 text-sm transition-colors border-s-4 border-transparent",
                  isActive
                    ? "bg-red-50 border-red-500 text-red-600"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Video className="h-4 w-4 text-red-600" />
                <span className="truncate">
                  {isAr ? c.titleAr : c.titleEn}
                </span>
              </Link>
            )
          })}
          {!loadingLive && liveCourses.length === 0 && (
            <div className="px-6 py-2 text-xs text-muted-foreground">
              {isAr ? "لا يوجد بث مباشر الآن" : "No live courses now"}
            </div>
          )}
        </div>
      )}
    </nav>
  )
}
