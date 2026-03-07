"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Language } from "@/lib/i18n"
import { StudentNav } from "./student-nav"

export function StudentSidebar() {
  const pathname = usePathname()
  const segments = pathname.split("/")
  const locale = (segments[1] || "ar") as Language

  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-background h-screen sticky top-0">
      <div className="flex h-16 items-center border-b px-6">
        <Link href={`/${locale}/student/dashboard`} className="flex items-center gap-2 font-bold text-xl">
          {/* <Image src="/logo.svg" alt="Neon Logo" width={40} height={40} className="h-8 w-auto" /> */}
          <span>Student Portal</span>
        </Link>
      </div>
      <StudentNav />
    </aside>
  )
}

export function StudentMobileNav() {
  const pathname = usePathname()
  const segments = pathname.split("/")
  const locale = (segments[1] || "ar") as Language

  return (
    <div className="flex flex-col h-full">
      <div className="flex h-16 items-center border-b px-6">
        <Link href={`/${locale}/student/dashboard`} className="flex items-center gap-2 font-bold text-xl">
          {/* <Image src="/logo.svg" alt="Neon Logo" width={40} height={40} className="h-8 w-auto" /> */}
          <span>Student Portal</span>
        </Link>
      </div>
      <StudentNav />
    </div>
  )
}
