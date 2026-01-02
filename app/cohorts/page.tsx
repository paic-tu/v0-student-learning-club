"use client"

import { useState, useEffect } from "react"
import { useLanguage } from "@/lib/language-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Users, ArrowRight, Clock } from "lucide-react"
import Link from "next/link"

export default function CohortsPage() {
  const { language, t } = useLanguage()
  const [cohorts, setCohorts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    fetchCohorts()
  }, [filter])

  async function fetchCohorts() {
    try {
      setLoading(true)
      const query = filter !== "all" ? `?status=${filter}` : ""
      const res = await fetch(`/api/cohorts${query}`)
      const data = await res.json()
      setCohorts(data.cohorts || [])
    } catch (error) {
      console.error("[v0] Error fetching cohorts:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      draft: { variant: "secondary", label: language === "ar" ? "مسودة" : "Draft" },
      open: { variant: "default", label: language === "ar" ? "مفتوح" : "Open" },
      running: { variant: "default", label: language === "ar" ? "جارٍ" : "Running" },
      ended: { variant: "outline", label: language === "ar" ? "منتهي" : "Ended" },
    }
    const config = variants[status] || variants.draft
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-2">{language === "ar" ? "الدفعات التعليمية" : "Learning Cohorts"}</h1>
          <p className="text-muted-foreground text-lg">
            {language === "ar"
              ? "انضم إلى برامج تعليمية منظمة مع مجموعات من المتعلمين"
              : "Join structured learning programs with groups of learners"}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={filter} onValueChange={setFilter} className="mb-8">
          <TabsList>
            <TabsTrigger value="all">{language === "ar" ? "الكل" : "All"}</TabsTrigger>
            <TabsTrigger value="open">{language === "ar" ? "مفتوح" : "Open"}</TabsTrigger>
            <TabsTrigger value="running">{language === "ar" ? "جارٍ" : "Running"}</TabsTrigger>
            <TabsTrigger value="ended">{language === "ar" ? "منتهي" : "Ended"}</TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="h-4 bg-muted rounded mb-4"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </Card>
            ))}
          </div>
        ) : cohorts.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground text-lg">
              {language === "ar" ? "لا توجد دفعات متاحة حالياً" : "No cohorts available"}
            </p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cohorts.map((cohort: any) => (
              <Card key={cohort.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold line-clamp-2">
                    {language === "ar" ? cohort.title_ar : cohort.title_en}
                  </h3>
                  {getStatusBadge(cohort.status)}
                </div>

                <p className="text-muted-foreground mb-6 line-clamp-3">
                  {language === "ar" ? cohort.description_ar : cohort.description_en}
                </p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {new Date(cohort.starts_at).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                      {" - "}
                      {new Date(cohort.ends_at).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {cohort.active_members} / {cohort.capacity} {language === "ar" ? "طالب" : "students"}
                    </span>
                  </div>

                  {cohort.waitlist_members > 0 && (
                    <div className="flex items-center gap-2 text-sm text-orange-600">
                      <Clock className="h-4 w-4" />
                      <span>
                        {cohort.waitlist_members} {language === "ar" ? "في قائمة الانتظار" : "on waitlist"}
                      </span>
                    </div>
                  )}
                </div>

                <Link href={`/cohorts/${cohort.id}`}>
                  <Button className="w-full" variant="default">
                    {language === "ar" ? "عرض التفاصيل" : "View Details"}
                    <ArrowRight className="h-4 w-4 mr-2" />
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
