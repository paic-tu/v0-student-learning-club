import { Suspense } from "react"
import { CourseForm } from "@/components/admin/course-form"
import { getAllCategories } from "@/lib/db/queries"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function NewInstructorCoursePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const session = await auth()
  
  if (!session?.user?.id || (session.user.role !== "instructor" && session.user.role !== "admin")) {
    redirect(`/${lang}/auth/login`)
  }

  const categoriesData = await getAllCategories()
  const categories = categoriesData.map((c: any) => ({
    id: c.id,
    nameEn: c.name_en,
    nameAr: c.name_ar
  }))
  
  // Only pass the current user as the only available instructor
  const instructors = [{
    id: session.user.id,
    name: session.user.name || "Instructor",
    email: session.user.email || ""
  }]

  const isAr = lang === "ar"

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">{isAr ? "إنشاء دورة جديدة" : "Create New Course"}</h1>
        <p className="text-muted-foreground">
          {isAr ? "املأ التفاصيل لإنشاء دورتك الجديدة." : "Fill in the details to create your new course."}
        </p>
      </div>

      <div className="grid gap-8">
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">{isAr ? "جاري تحميل النموذج..." : "Loading form..."}</div>}>
          <CourseForm 
            categories={categories} 
            instructors={instructors} 
            redirectBase={`/${lang}/instructor/courses/:id/edit`}
            lang={lang}
          />
        </Suspense>
      </div>
    </div>
  )
}
