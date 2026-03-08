"use client"

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { CurriculumSidebar } from "@/components/learn/curriculum-sidebar"
import { useState } from "react"

interface MobileCurriculumSidebarProps {
  course: any
  currentLessonId: string
  lang: string
}

export function MobileCurriculumSidebar({ course, currentLessonId, lang }: MobileCurriculumSidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const isAr = lang === "ar"

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden shrink-0">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side={isAr ? "right" : "left"} className="p-0 w-80">
        <CurriculumSidebar 
          course={course} 
          currentLessonId={currentLessonId} 
          lang={lang} 
          className="w-full h-full pt-12"
          onLessonSelect={() => setIsOpen(false)}
        />
      </SheetContent>
    </Sheet>
  )
}
