"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useLanguage } from "@/lib/language-context"
import { t } from "@/lib/i18n"
import { Clock, BookOpen, Search, Star, Users } from "lucide-react"
import { BookmarkButton } from "@/components/bookmark-button"

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
            <Card key={course.id} className="flex flex-col hover:shadow-lg transition-shadow group relative overflow-hidden">
              <CardHeader className="p-0">
                <div className="relative h-48 w-full bg-muted rounded-t-lg overflow-hidden">
                  <img
                    src={course.thumbnail_url || "/placeholder.svg?height=200&width=300&query=course"}
                    alt={isAr ? course.title_ar : course.title_en}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute top-2 right-2 z-10">
                    <BookmarkButton 
                      courseId={course.id} 
                      initialBookmarked={course.is_bookmarked || false}
                      variant="secondary"
                      size="icon"
                      className="bg-background/80 backdrop-blur-sm hover:bg-background"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {isAr ? course.category_name_ar : course.category_name_en}
                    </Badge>
                    <Badge variant="outline">{t(course.difficulty, language)}</Badge>
                  </div>
                </div>
                
                <h3 className="font-semibold text-lg mb-2 line-clamp-2 hover:text-primary transition-colors">
                  <Link href={`/${language}/student/course/${course.id}`}>
                    {isAr ? course.title_ar : course.title_en}
                  </Link>
                </h3>
                
                <p className="text-sm text-muted-foreground mb-3">{course.instructor_name}</p>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>
                      {Math.floor(course.duration / 60)} {t("hours", language)}
                    </span>
                  </div>
                  {course.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{course.rating}</span>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 flex items-center justify-between">
                  <div className="font-bold text-lg text-primary">
                    {course.is_free || course.price === 0
                      ? t("free", language)
                      : `${course.price} ${isAr ? "ر.س" : "SAR"}`}
                  </div>
                  {course.enrollment_count > 0 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>{course.enrollment_count}</span>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button className="w-full" asChild>
                  <Link href={`/${language}/student/course/${course.id}`}>
                    {isAr ? "عرض التفاصيل" : "View Details"}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
