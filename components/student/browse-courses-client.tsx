"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useLanguage } from "@/lib/language-context"
import { t } from "@/lib/i18n"
import { BookOpen, Search } from "lucide-react"
import { CourseCard } from "@/components/course-card"

interface BrowseCoursesClientProps {
  initialCourses: any[]
}

export function BrowseCoursesClient({ initialCourses }: BrowseCoursesClientProps) {
  const { language } = useLanguage()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  
  const isAr = language === "ar"

  const categories = [
    { nameEn: "all", nameAr: "الكل" },
    ...Array.from(new Map(initialCourses.map(c => [c.category_name_en, { nameEn: c.category_name_en, nameAr: c.category_name_ar }])).values()).filter(c => c.nameEn)
  ]

  const filteredCourses = initialCourses.filter((course) => {
    const title = (isAr ? course.title_ar : course.title_en) || ""
    const instructorName = course.instructor_name || ""
    const matchesSearch =
      title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      instructorName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory =
      selectedCategory === "all" ||
      course.category_name_en === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={isAr ? "ابحث عن دورة..." : "Search courses..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <Button
              key={cat.nameEn}
              variant={selectedCategory === cat.nameEn ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat.nameEn)}
            >
              {isAr ? (cat.nameAr || cat.nameEn) : cat.nameEn}
            </Button>
          ))}
        </div>
      </div>

      {filteredCourses.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">{t("noCourses", language)}</h3>
          <p className="text-muted-foreground">
            {isAr ? "جرب البحث بكلمات مختلفة" : "Try searching with different terms"}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  )
}
