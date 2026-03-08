"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Language } from "@/lib/i18n"
import { StudentNav } from "./student-nav"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function StudentSidebar() {
  const pathname = usePathname()
  const segments = pathname.split("/")
  const locale = (segments[1] || "ar") as Language
  const isAr = locale === "ar"
  
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Load state from local storage
  useEffect(() => {
    setMounted(true)
    const storedState = localStorage.getItem("sidebar-collapsed")
    if (storedState) {
      setIsCollapsed(storedState === "true")
    }
  }, [])

  if (!mounted) {
    return (
      <aside className="hidden md:flex w-64 flex-col border-r bg-background h-screen sticky top-0">
        <div className="flex h-16 items-center border-b px-6">
          <Link href={`/${locale}/student/dashboard`} className="flex items-center gap-2 font-bold text-xl">
            <span>{isAr ? "بوابة الطالب" : "Student Portal"}</span>
          </Link>
        </div>
        <StudentNav />
      </aside>
    )
  }

  const toggleSidebar = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem("sidebar-collapsed", String(newState))
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
          <Link href={`/${locale}/student/dashboard`} className="flex items-center gap-2 font-bold text-xl overflow-hidden whitespace-nowrap">
            <span>{isAr ? "بوابة الطالب" : "Student Portal"}</span>
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
        <StudentNav isCollapsed={isCollapsed} />
      </div>
    </aside>
  )
}

export function StudentMobileNav() {
  const pathname = usePathname()
  const segments = pathname.split("/")
  const locale = (segments[1] || "ar") as Language
  const isAr = locale === "ar"

  return (
    <div className="flex flex-col h-full">
      <div className="flex h-16 items-center border-b px-6">
        <Link href={`/${locale}/student/dashboard`} className="flex items-center gap-2 font-bold text-xl">
          {/* <Image src="/logo.svg" alt="Neon Logo" width={40} height={40} className="h-8 w-auto" /> */}
          <span>{isAr ? "بوابة الطالب" : "Student Portal"}</span>
        </Link>
      </div>
      <StudentNav />
    </div>
  )
}
