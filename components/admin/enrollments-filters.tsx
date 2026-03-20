"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function EnrollmentsFilters({
  lang,
  courses,
  selectedCourseId,
}: {
  lang: string
  courses: Array<{ id: string; titleEn: string; titleAr: string }>
  selectedCourseId: string | null
}) {
  const router = useRouter()
  const isAr = lang === "ar"

  const value = selectedCourseId || "all"

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={value}
        onValueChange={(v) => {
          if (v === "all") router.push(`/${lang}/admin/enrollments`)
          else router.push(`/${lang}/admin/enrollments?courseId=${encodeURIComponent(v)}`)
        }}
      >
        <SelectTrigger className="min-w-[280px]">
          <SelectValue placeholder={isAr ? "اختر دورة" : "Select a course"} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{isAr ? "كل الدورات" : "All courses"}</SelectItem>
          {courses.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {isAr ? c.titleAr : c.titleEn}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedCourseId ? (
        <Button variant="outline" onClick={() => router.push(`/${lang}/admin/enrollments`)}>
          {isAr ? "مسح الفلتر" : "Clear"}
        </Button>
      ) : null}
    </div>
  )
}

