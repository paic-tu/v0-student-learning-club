"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { NavBar } from "@/components/nav-bar"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLanguage } from "@/lib/language-context"
import { t } from "@/lib/i18n"
import { getAllChallenges } from "@/lib/db/queries"
import { Code, Trophy, Clock, Target } from "lucide-react"

export default function ChallengesPage() {
  const { language } = useLanguage()
  const [challenges, setChallenges] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")

  useEffect(() => {
    loadChallenges()
  }, [])

  const loadChallenges = async () => {
    try {
      const data = await getAllChallenges()
      setChallenges(data)
    } catch (error) {
      console.error("[v0] Error loading challenges:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredChallenges = challenges.filter((challenge) => {
    if (filter === "all") return true
    return challenge.type === filter
  })

  const getTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      coding: Code,
      quiz: Target,
      project: Trophy,
    }
    const Icon = icons[type] || Code
    return <Icon className="h-5 w-5" />
  }

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      beginner: "bg-green-500/10 text-green-500 border-green-500/20",
      intermediate: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      advanced: "bg-red-500/10 text-red-500 border-red-500/20",
    }
    return colors[difficulty] || "bg-muted"
  }

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
          <h1 className="text-3xl font-bold mb-2">{language === "ar" ? "التحديات" : "Challenges"}</h1>
          <p className="text-muted-foreground">
            {language === "ar" ? "اختبر مهاراتك واكسب نقاط" : "Test your skills and earn points"}
          </p>
        </div>

        <Tabs value={filter} onValueChange={setFilter} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">{language === "ar" ? "الكل" : "All"}</TabsTrigger>
            <TabsTrigger value="coding">{language === "ar" ? "برمجة" : "Coding"}</TabsTrigger>
            <TabsTrigger value="quiz">{language === "ar" ? "اختبارات" : "Quiz"}</TabsTrigger>
            <TabsTrigger value="project">{language === "ar" ? "مشاريع" : "Projects"}</TabsTrigger>
          </TabsList>
        </Tabs>

        {filteredChallenges.length === 0 ? (
          <div className="text-center py-16">
            <Trophy className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">{language === "ar" ? "لا توجد تحديات" : "No challenges"}</h3>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChallenges.map((challenge) => (
              <Card key={challenge.id} className="flex flex-col hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(challenge.type)}
                      <Badge variant="outline" className="capitalize">
                        {challenge.type}
                      </Badge>
                    </div>
                    <Badge className={getDifficultyColor(challenge.difficulty)}>
                      {t(challenge.difficulty, language)}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl">
                    {language === "ar" ? challenge.title_ar : challenge.title_en}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground mb-4">
                    {language === "ar" ? challenge.description_ar : challenge.description_en}
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-primary font-semibold">
                      <Trophy className="h-4 w-4" />
                      <span>
                        {challenge.points} {language === "ar" ? "نقطة" : "pts"}
                      </span>
                    </div>
                    {challenge.time_limit && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                          {challenge.time_limit} {language === "ar" ? "د" : "min"}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Link href={`/challenges/${challenge.id}`} className="w-full">
                    <Button className="w-full">{language === "ar" ? "ابدأ التحدي" : "Start Challenge"}</Button>
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
