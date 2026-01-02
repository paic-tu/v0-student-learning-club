"use client"

import { useEffect, useState } from "react"
import { NavBar } from "@/components/nav-bar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"
import { getCourseById, getCourseLessons } from "@/lib/db/queries"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { PlayCircle, CheckCircle, ChevronLeft, ChevronRight, Check } from "lucide-react"
import Link from "next/link"

export default function LessonPage({ params }: { params: { courseId: string; lessonId: string } }) {
  const { user } = useAuth()
  const { language } = useLanguage()
  const { toast } = useToast()
  const router = useRouter()
  const [course, setCourse] = useState<any>(null)
  const [lesson, setLesson] = useState<any>(null)
  const [lessons, setLessons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [completed, setCompleted] = useState(false)
  const [completedLessons, setCompletedLessons] = useState<number[]>([])
  const [progress, setProgress] = useState(0)
  const [toggling, setToggling] = useState(false)

  const isRTL = language === "ar"

  useEffect(() => {
    if (!user) {
      router.push("/auth/login")
      return
    }

    const loadData = async () => {
      try {
        const courseData = await getCourseById(Number.parseInt(params.courseId))
        if (!courseData) {
          toast({ title: "Error", description: "Course not found", variant: "destructive" })
          router.push("/courses")
          return
        }

        setCourse(courseData)

        const lessonsData = await getCourseLessons(Number.parseInt(params.courseId))
        setLessons(lessonsData)

        const currentLesson = lessonsData.find((l) => l.id === Number.parseInt(params.lessonId))
        setLesson(currentLesson)

        // Fetch enrollment data to get completed lessons and progress
        const enrollmentRes = await fetch(`/api/enrollments/${user.id}/${Number.parseInt(params.courseId)}`)
        if (enrollmentRes.ok) {
          const enrollmentData = await enrollmentRes.json()
          const completed = enrollmentData.completedLessons || []
          setCompletedLessons(completed)
          setProgress(enrollmentData.progress || 0)
          setCompleted(completed.includes(Number.parseInt(params.lessonId)))
        }

        setLoading(false)
      } catch (error) {
        console.error("[v0] Error loading lesson data:", error)
        setLoading(false)
      }
    }

    loadData()
  }, [params, user, router, toast])

  const handleToggleComplete = async () => {
    setToggling(true)
    try {
      const res = await fetch(`/api/lessons/${params.lessonId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: Number.parseInt(params.courseId),
          complete: !completed,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setCompleted(!completed)
        setProgress(data.progress)
        setCompletedLessons(data.completedLessons)

        const message = data.message
        toast({
          title: "Success",
          description: `${message} (${data.progress}% complete)`,
        })

        if (data.progress === 100) {
          toast({
            title: "Congratulations!",
            description: "You've completed this course! Certificate issued.",
          })
        }
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update lesson",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error toggling completion:", error)
      toast({
        title: "Error",
        description: "Failed to update lesson completion",
        variant: "destructive",
      })
    } finally {
      setToggling(false)
    }
  }

  const currentIndex = lessons.findIndex((l) => l.id === Number.parseInt(params.lessonId))
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null
  const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground">{isRTL ? "جاري التحميل..." : "Loading..."}</p>
        </div>
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-destructive">{isRTL ? "الدرس غير موجود" : "Lesson not found"}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <Link href={`/courses/${params.courseId}`} className="inline-flex items-center gap-2 text-primary mb-8">
          <ChevronLeft className="h-4 w-4" />
          {isRTL ? "العودة للدورة" : "Back to Course"}
        </Link>

        <div className="space-y-8">
          {/* Course Progress */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">{isRTL ? "تقدم الدورة" : "Course Progress"}</p>
                <span className="text-sm font-semibold">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {isRTL
                  ? `${completedLessons.length} من ${lessons.length} مكتملة`
                  : `${completedLessons.length} of ${lessons.length} completed`}
              </p>
            </CardContent>
          </Card>

          {/* Video Player */}
          <Card>
            <CardContent className="pt-6">
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-4">
                <PlayCircle className="h-16 w-16 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">{isRTL ? "مشغل الفيديو" : "Video Player"}</p>
            </CardContent>
          </Card>

          {/* Lesson Content */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h1 className="text-3xl font-bold">{isRTL ? lesson.title_ar : lesson.title_en}</h1>
              <div className="flex gap-2 flex-wrap">
                <Badge>{isRTL ? `${lesson.duration} دقيقة` : `${lesson.duration} min`}</Badge>
                {completed && <Badge className="bg-green-500">{isRTL ? "مكتمل" : "Complete"}</Badge>}
              </div>

              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p>{isRTL ? lesson.content_ar : lesson.content_en}</p>
              </div>

              <div className="flex gap-4 pt-4">
                <Button onClick={handleToggleComplete} disabled={toggling} variant={completed ? "outline" : "default"}>
                  {completed ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      {isRTL ? "مكتمل" : "Completed"}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {isRTL ? "وضع علامة مكتمل" : "Mark Complete"}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between gap-4">
            {prevLesson ? (
              <Link href={`/learn/${params.courseId}/${prevLesson.id}`} className="flex-1">
                <Button variant="outline" className="w-full bg-transparent">
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  {isRTL ? "الدرس السابق" : "Previous"}
                </Button>
              </Link>
            ) : (
              <div className="flex-1" />
            )}

            {nextLesson ? (
              <Link href={`/learn/${params.courseId}/${nextLesson.id}`} className="flex-1">
                <Button className="w-full">
                  {isRTL ? "الدرس التالي" : "Next"}
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            ) : (
              <div className="flex-1" />
            )}
          </div>

          {/* Lessons Sidebar */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">{isRTL ? "الدروس" : "Lessons"}</h3>
              <div className="space-y-2">
                {lessons.map((l) => (
                  <Link key={l.id} href={`/learn/${params.courseId}/${l.id}`}>
                    <div
                      className={`p-3 rounded border cursor-pointer transition ${
                        l.id === lesson.id ? "border-primary bg-primary/10" : "border-muted hover:border-primary/50"
                      }`}
                    >
                      <div className="flex gap-2 items-start">
                        {completedLessons.includes(l.id) ? (
                          <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <div className="h-5 w-5 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="font-sm">{isRTL ? l.title_ar : l.title_en}</p>
                          <p className="text-xs text-muted-foreground">{l.duration} min</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
