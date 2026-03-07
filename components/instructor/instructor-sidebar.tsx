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
  BarChart,
  HelpCircle,
  MessageCircle
} from "lucide-react"

function InstructorNav({ isCollapsed, unreadCount = 0 }: { isCollapsed?: boolean, unreadCount?: number }) {
  const pathname = usePathname()
  const segments = pathname.split("/")
  const locale = segments[1] || "ar"
  const pathWithoutLocale = "/" + segments.slice(2).join("/")
  const isAr = locale === "ar"

  const menuItems = [
    {
      href: "/instructor/dashboard",
      label: isAr ? "لوحة التحكم" : "Dashboard",
      icon: LayoutDashboard,
    },
    {
      href: "/instructor/courses",
      label: isAr ? "دوراتي" : "My Courses",
      icon: BookOpen,
    },
    {
      href: "/instructor/courses/new",
      label: isAr ? "إنشاء دورة" : "Create Course",
      icon: PlusCircle,
    },
    {
      href: "/instructor/quizzes",
      label: isAr ? "الكويزات" : "Quizzes",
      icon: HelpCircle,
    },
    {
      href: "/instructor/chat",
      label: isAr ? "المحادثات" : "Chat",
      icon: MessageCircle,
    },
    {
      href: "/instructor/analytics", // Placeholder for analytics
      label: isAr ? "التحليلات" : "Analytics",
      icon: BarChart,
    },
    {
      href: "/instructor/reviews",
      label: isAr ? "المراجعات" : "Reviews",
      icon: MessageSquare,
    },
    {
      href: "/instructor/profile",
      label: isAr ? "الملف الشخصي" : "Profile",
      icon: User,
    },
    {
      href: "/instructor/settings",
      label: isAr ? "الإعدادات" : "Settings",
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
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors relative",
              isActive
                ? "bg-indigo-100 text-indigo-900"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
              isCollapsed && "justify-center px-2"
            )}
            title={isCollapsed ? item.label : undefined}
          >
            <Icon className="h-5 w-5" />
            {!isCollapsed && <span>{item.label}</span>}
            {item.href === "/instructor/chat" && unreadCount > 0 && (
              <span className={cn(
                "bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center",
                isCollapsed ? "absolute -top-1 -right-1 h-4 w-4" : "ml-auto h-5 w-5"
              )}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getUnreadMessageCount } from "@/lib/actions/chat"

export function InstructorSidebar() {
  const pathname = usePathname()
  const segments = pathname.split("/")
  const locale = segments[1] || "ar"
  const isAr = locale === "ar"
  
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const count = await getUnreadMessageCount()
        setUnreadCount(count)
      } catch (error) {
        console.error("Failed to fetch unread count:", error)
      }
    }
    fetchCount()
    const interval = setInterval(fetchCount, 10000)
    return () => clearInterval(interval)
  }, [])

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
            <span>{isAr ? "لوحة المدرب" : "Instructor"}</span>
          </Link>
        </div>
        <InstructorNav unreadCount={0} />
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
      <div className={cn("flex h-16 items-center border-b", isCollapsed ? "justify-center" : "px-6 justify-between")}>
        {!isCollapsed && (
          <Link href={`/${locale}/instructor/dashboard`} className="flex items-center gap-2 font-bold text-xl overflow-hidden whitespace-nowrap">
            <span>{isAr ? "لوحة المدرب" : "Instructor"}</span>
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
        <InstructorNav isCollapsed={isCollapsed} unreadCount={unreadCount} />
      </div>
    </aside>
  )
}

export function InstructorMobileNav() {
  const pathname = usePathname()
  const segments = pathname.split("/")
  const locale = segments[1] || "ar"
  const isAr = locale === "ar"

  return (
    <div className="flex flex-col h-full">
      <div className="flex h-16 items-center border-b px-6">
        <Link href={`/${locale}/instructor/dashboard`} className="flex items-center gap-2 font-bold text-xl">
          {/* <Image src="/logo.svg" alt="Neon Logo" width={40} height={40} className="h-8 w-auto" /> */}
          <span>{isAr ? "لوحة المدرب" : "Instructor"}</span>
        </Link>
      </div>
      <InstructorNav />
    </div>
  )
}
