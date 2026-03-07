"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
// import Image from "next/image"
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type { User } from "@/lib/auth"
import { hasPermission } from "@/lib/rbac/permissions"

interface AdminSidebarProps {
  user: User
  isCollapsed?: boolean
}

function AdminNav({ user, isCollapsed }: AdminSidebarProps) {
  const pathname = usePathname()
  const segments = pathname.split("/")
  const locale = segments[1] || "ar"
  
  // Helper to remove locale from path for comparison
  const pathWithoutLocale = "/" + segments.slice(2).join("/")

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
      href: "/admin/categories",
      label: "Categories",
      icon: BookOpen,
      permission: "courses:write" as const,
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
    <nav className="flex-1 space-y-1 overflow-y-auto p-4">
      {visibleItems.map((item) => {
        const Icon = item.icon
        // Compare without locale
        const isActive = pathWithoutLocale === item.href || pathWithoutLocale.startsWith(item.href + "/")
        const hrefWithLocale = `/${locale}${item.href}`

        return (
          <Link
            key={item.href}
            href={hrefWithLocale}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
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

export function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname()
  const segments = pathname.split("/")
  const locale = segments[1] || "ar"
  const isAr = locale === "ar"

  const [isCollapsed, setIsCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const storedState = localStorage.getItem("admin-sidebar-collapsed")
    if (storedState) {
      setIsCollapsed(storedState === "true")
    }
  }, [])

  if (!mounted) {
    return (
      <aside className="hidden md:flex w-64 flex-col border-r bg-background h-screen sticky top-0">
        <div className="flex h-16 items-center border-b px-6">
          <Link href={`/${locale}/admin`} className="flex items-center gap-2 font-bold text-xl">
            {/* <Image src="/logo.svg" alt="Neon Logo" width={40} height={40} className="h-8 w-auto" /> */}
            <span>Neon Admin</span>
          </Link>
        </div>
        <AdminNav user={user} />
      </aside>
    )
  }

  const toggleSidebar = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem("admin-sidebar-collapsed", String(newState))
  }

  return (
    <aside 
      className={cn(
        "hidden md:flex flex-col border-r bg-background h-screen sticky top-0 transition-all duration-300",
        isCollapsed ? "w-[70px]" : "w-64"
      )}
    >
      <div className={cn("flex h-16 items-center border-b", isCollapsed ? "justify-center" : "px-6 justify-between")}>
        {!isCollapsed && (
          <Link href={`/${locale}/admin`} className="flex items-center gap-2 font-bold text-xl overflow-hidden whitespace-nowrap">
            <span>Neon Admin</span>
          </Link>
        )}
        
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar}
          className={cn("hover:bg-muted", isCollapsed ? "h-10 w-10" : "h-8 w-8")}
        >
          {isCollapsed ? (
             isAr ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
          ) : (
             isAr ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <AdminNav user={user} isCollapsed={isCollapsed} />
      </div>
    </aside>
  )
}

export function AdminMobileNav({ user }: AdminSidebarProps) {
  const pathname = usePathname()
  const segments = pathname.split("/")
  const locale = segments[1] || "ar"

  return (
    <div className="flex flex-col h-full">
      <div className="flex h-16 items-center border-b px-6">
        <Link href={`/${locale}/admin`} className="flex items-center gap-2 font-bold text-xl">
          {/* <Image src="/logo.svg" alt="Neon Logo" width={40} height={40} className="h-8 w-auto" /> */}
          <span>Neon Admin</span>
        </Link>
      </div>
      <AdminNav user={user} />
    </div>
  )
}
