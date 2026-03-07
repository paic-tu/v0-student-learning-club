"use client"

import Link from "next/link"
// import Image from "next/image"
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

function InstructorNav({ isCollapsed }: { isCollapsed?: boolean }) {
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

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function InstructorSidebar() {
  const pathname = usePathname()
  const segments = pathname.split("/")
  const locale = segments[1] || "ar"
  const isAr = locale === "ar"
  
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Load state from local storage
  useEffect(() => {
    setMounted(true)
    const storedState = localStorage.getItem("instructor-sidebar-collapsed")
    if (storedState) {
      setIsCollapsed(storedState === "true")
    }
  }, [])

  if (!mounted) {
    return (
      <aside className="hidden md:flex w-64 flex-col border-r bg-background h-screen sticky top-0">
        <div className="flex h-16 items-center border-b px-6">
          <Link href={`/${locale}/instructor/dashboard`} className="flex items-center gap-2 font-bold text-xl">
            <span>Instructor</span>
          </Link>
        </div>
        <InstructorNav />
      </aside>
    )
  }

  const toggleSidebar = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem("instructor-sidebar-collapsed", String(newState))
  }

  return (
    <aside 
      className={cn(
        "hidden md:flex flex-col border-r bg-background h-screen sticky top-0 transition-all duration-300",
        isCollapsed ? "w-[70px]" : "w-64"
      )}
    >
      <div className={cn("flex h-16 items-center border-b", isCollapsed ? "justify-center px-0" : "px-6")}>
        <Link href={`/${locale}/instructor/dashboard`} className="flex items-center gap-2 font-bold text-xl overflow-hidden whitespace-nowrap">
          {/* <Image src="/logo.svg" alt="Neon Logo" width={40} height={40} className="h-8 w-auto" /> */}
          {!isCollapsed ? (
            <span>Instructor</span>
          ) : (
            <span className="text-2xl text-primary">I</span>
          )}
        </Link>
      </div>
      
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <InstructorNav isCollapsed={isCollapsed} />
      </div>

      <div className="p-4 border-t flex justify-center">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center hover:bg-muted"
        >
          {isCollapsed ? (
             isAr ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
          ) : (
             isAr ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
    </aside>
  )
}

export function InstructorMobileNav() {
  const pathname = usePathname()
  const segments = pathname.split("/")
  const locale = segments[1] || "ar"

  return (
    <div className="flex flex-col h-full">
      <div className="flex h-16 items-center border-b px-6">
        <Link href={`/${locale}/instructor/dashboard`} className="flex items-center gap-2 font-bold text-xl">
          {/* <Image src="/logo.svg" alt="Neon Logo" width={40} height={40} className="h-8 w-auto" /> */}
          <span>Instructor</span>
        </Link>
      </div>
      <InstructorNav />
    </div>
  )
}
