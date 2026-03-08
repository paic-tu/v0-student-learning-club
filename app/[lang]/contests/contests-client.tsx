"use client"

import { useState } from "react"
import Link from "next/link"
import { NavBar } from "@/components/nav-bar"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/language-context"
import { Calendar, Users, Trophy, Clock } from "lucide-react"
import Image from "next/image"

interface Contest {
  id: string
  titleEn: string
  titleAr: string
  descriptionEn: string
  descriptionAr: string
  imageUrl?: string | null
  status: string
  prizePool?: string | null
  startDate?: Date | null
  endDate?: Date | null
  participantCount?: number
  maxParticipants?: number | null
}

interface ContestsClientProps {
  contests: Contest[]
}

export function ContestsClient({ contests }: ContestsClientProps) {
  const { language } = useLanguage()

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      upcoming: "outline",
      active: "default",
      completed: "secondary",
    }
    return variants[status] || "outline"
  }

  const getStatusText = (status: string) => {
    const texts: Record<string, { ar: string; en: string }> = {
      upcoming: { ar: "قريباً", en: "Upcoming" },
      active: { ar: "نشط", en: "Active" },
      completed: { ar: "منتهي", en: "Completed" },
    }
    return language === "ar" ? texts[status]?.ar || status : texts[status]?.en || status
  }

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return ""
    return new Date(date).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const activeContests = contests.filter((c) => c.status === "active")
  const upcomingContests = contests.filter((c) => c.status === "upcoming")
  const completedContests = contests.filter((c) => c.status === "completed")

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{language === "ar" ? "المسابقات" : "Contests"}</h1>
          <p className="text-muted-foreground">
            {language === "ar"
              ? "شارك في المسابقات واربح جوائز قيمة"
              : "Participate in contests and win valuable prizes"}
          </p>
        </div>

        {activeContests.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Clock className="h-6 w-6 text-primary" />
              {language === "ar" ? "المسابقات النشطة" : "Active Contests"}
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {activeContests.map((contest) => (
                <Card
                  key={contest.id}
                  className="flex flex-col hover:shadow-lg transition-shadow border-primary/50 bg-gradient-to-br from-primary/5 to-primary/10"
                >
                  <CardHeader>
                    <div className="relative h-48 w-full bg-muted rounded-lg overflow-hidden mb-4">
                      <Image
                        src={contest.imageUrl || "/placeholder.svg?height=200&width=400&query=contest"}
                        alt={language === "ar" ? contest.titleAr : contest.titleEn}
                        fill
                        className="object-cover"
                      />
                      <Badge className="absolute top-4 right-4 bg-green-500">{getStatusText(contest.status)}</Badge>
                    </div>
                    <CardTitle className="text-xl">{language === "ar" ? contest.titleAr : contest.titleEn}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-sm text-muted-foreground mb-4">
                      {language === "ar" ? contest.descriptionAr : contest.descriptionEn}
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-primary">{contest.prizePool}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>
                          {contest.participantCount || 0} / {contest.maxParticipants || "∞"}{" "}
                          {language === "ar" ? "مشارك" : "participants"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {language === "ar" ? "ينتهي:" : "Ends:"} {formatDate(contest.endDate)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Link href={`/contests/${contest.id}`} className="w-full">
                      <Button className="w-full">{language === "ar" ? "عرض التفاصيل" : "View Details"}</Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        )}

        {upcomingContests.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">{language === "ar" ? "المسابقات القادمة" : "Upcoming Contests"}</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingContests.map((contest) => (
                <Card key={contest.id} className="flex flex-col hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="relative h-40 w-full bg-muted rounded-lg overflow-hidden mb-4">
                      <Image
                        src={contest.imageUrl || "/placeholder.svg?height=160&width=300&query=contest"}
                        alt={language === "ar" ? contest.titleAr : contest.titleEn}
                        fill
                        className="object-cover"
                      />
                      <Badge className="absolute top-4 right-4" variant={getStatusBadge(contest.status)}>
                        {getStatusText(contest.status)}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{language === "ar" ? contest.titleAr : contest.titleEn}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-primary" />
                        <span className="font-semibold">{contest.prizePool}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {language === "ar" ? "يبدأ:" : "Starts:"} {formatDate(contest.startDate)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Link href={`/contests/${contest.id}`} className="w-full">
                      <Button variant="outline" className="w-full bg-transparent">
                        {language === "ar" ? "عرض التفاصيل" : "View Details"}
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        )}

        {completedContests.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">
              {language === "ar" ? "المسابقات المنتهية" : "Completed Contests"}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedContests.map((contest) => (
                <Card key={contest.id} className="flex flex-col hover:shadow-lg transition-shadow opacity-80 hover:opacity-100">
                  <CardHeader>
                    <div className="relative h-40 w-full bg-muted rounded-lg overflow-hidden mb-4 grayscale">
                      <Image
                        src={contest.imageUrl || "/placeholder.svg?height=160&width=300&query=contest"}
                        alt={language === "ar" ? contest.titleAr : contest.titleEn}
                        fill
                        className="object-cover"
                      />
                      <Badge className="absolute top-4 right-4" variant={getStatusBadge(contest.status)}>
                        {getStatusText(contest.status)}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{language === "ar" ? contest.titleAr : contest.titleEn}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-primary" />
                        <span className="font-semibold">{contest.prizePool}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {language === "ar" ? "انتهى:" : "Ended:"} {formatDate(contest.endDate)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Link href={`/contests/${contest.id}`} className="w-full">
                      <Button variant="outline" className="w-full bg-transparent">
                        {language === "ar" ? "عرض النتائج" : "View Results"}
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
