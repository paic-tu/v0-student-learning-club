"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { NavBar } from "@/components/nav-bar"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useLanguage } from "@/lib/language-context"
import { t } from "@/lib/i18n"
import { Clock, BookOpen, Search, Star, Users } from "lucide-react"

export default function CoursesPage() {
  const { language } = useLanguage()
  const [courses, setCourses] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const response = await fetch("/api/courses")
        if (!response.ok) throw new Error("Failed to fetch courses")
        const data = await response.json()
        setCourses(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error("[v0] Error loading courses:", error)
        setCourses([])
      } finally {
        setLoading(false)
      }
    }

    loadCourses()
  }, [])

  const categories = [
    "all",
    ...Array.from(new Set(courses.map((c) => c.category_name_en).filter((cat) => cat && typeof cat === "string"))),
  ]

  const filteredCourses = courses.filter((course) => {
    const title = language === "ar" ? course.title_ar : course.title_en
    const matchesSearch =
      title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.instructor_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory =
      selectedCategory === "all" ||
      course.category_name_en === selectedCategory ||
      course.category_name_ar === selectedCategory
    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t("courses", language)}</h1>
          <p className="text-muted-foreground">
            {language === "ar" ? "استكشف دوراتنا التعليمية المتميزة" : "Explore our premium courses"}
          </p>
        </div>

        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={language === "ar" ? "ابحث عن دورة..." : "Search courses..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
              >
                {cat === "all" ? (language === "ar" ? "الكل" : "All") : cat}
              </Button>
            ))}
          </div>
        </div>

        {filteredCourses.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">{t("noCourses", language)}</h3>
            <p className="text-muted-foreground">
              {language === "ar" ? "جرب البحث بكلمات مختلفة" : "Try searching with different terms"}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <Card key={course.id} className="flex flex-col hover:shadow-lg transition-shadow">
                <CardHeader className="p-0">
                  <div className="relative h-48 w-full bg-muted rounded-t-lg overflow-hidden">
                    <img
                      src={course.thumbnail_url || "/placeholder.svg?height=200&width=300&query=course"}
                      alt={language === "ar" ? course.title_ar : course.title_en}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </CardHeader>
                <CardContent className="flex-1 pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">
                      {language === "ar" ? course.category_name_ar : course.category_name_en}
                    </Badge>
                    <Badge variant="outline">{t(course.difficulty, language)}</Badge>
                  </div>
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                    {language === "ar" ? course.title_ar : course.title_en}
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
                    {course.enrollment_count && (
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{course.enrollment_count}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 font-semibold text-primary">
                    {course.is_free || course.price === 0
                      ? t("free", language)
                      : `${course.price} ${language === "ar" ? "ر.س" : "SAR"}`}
                  </div>
                </CardContent>
                <CardFooter>
                  <Link href={`/${language}/courses/${course.id}`} className="w-full">
                    <Button className="w-full">{language === "ar" ? "عرض التفاصيل" : "View Details"}</Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
