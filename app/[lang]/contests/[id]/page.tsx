"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { NavBar } from "@/components/nav-bar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { getContestById, joinContest } from "@/lib/db/queries"
import { getContestParticipants } from "@/lib/actions"
import { Calendar, Users, Trophy, Award, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

export default function ContestPage() {
  const { language } = useLanguage()
  const { user } = useAuth()
  const { id } = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [contest, setContest] = useState<any>(null)
  const [participants, setParticipants] = useState<any[]>([])
  const [isParticipating, setIsParticipating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)

  const loadContest = useCallback(async () => {
    try {
      const data = await getContestById(String(id))
      setContest(data)

      // Load participants
      const parts = await getContestParticipants(Number(id))
      setParticipants(parts)

      // Check if current user is participating
      if (user) {
        const userParticipation = parts.find((p: any) => p.user_id === user.id)
        setIsParticipating(!!userParticipation)
      }
    } catch (error) {
      console.error("[v0] Error loading contest:", error)
    } finally {
      setLoading(false)
    }
  }, [id, user])

  useEffect(() => {
    loadContest()
  }, [loadContest])

  const handleJoin = async () => {
    if (!user || !contest) return

    setJoining(true)
    try {
      const result = await joinContest(user.id, contest.id)

      if (result) {
        toast({
          title: language === "ar" ? "تم التسجيل" : "Registered",
          description: language === "ar" ? "تم تسجيلك في المسابقة بنجاح" : "You have been registered successfully",
        })
        setIsParticipating(true)
        loadContest() // Reload to update participant count
      } else {
        toast({
          title: language === "ar" ? "أنت مسجل بالفعل" : "Already registered",
          description: language === "ar" ? "أنت مسجل في المسابقة" : "You are already registered",
        })
      }
    } catch (error) {
      toast({
        title: language === "ar" ? "خطأ" : "Error",
        description: language === "ar" ? "فشل التسجيل" : "Failed to register",
        variant: "destructive",
      })
    } finally {
      setJoining(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusText = (status: string) => {
    const texts: Record<string, { ar: string; en: string }> = {
      upcoming: { ar: "قريباً", en: "Upcoming" },
      active: { ar: "نشط", en: "Active" },
      completed: { ar: "منتهي", en: "Completed" },
    }
    return language === "ar" ? texts[status]?.ar || status : texts[status]?.en || status
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

  if (!contest) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold mb-4">
              {language === "ar" ? "المسابقة غير موجودة" : "Contest not found"}
            </h2>
            <Button onClick={() => router.push("/contests")}>
              {language === "ar" ? "العودة للمسابقات" : "Back to Contests"}
            </Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <Card className="mb-6">
            <CardHeader>
              <div className="relative h-64 w-full bg-muted rounded-lg overflow-hidden mb-6">
                <Image
                  src={contest.image_url || "/placeholder.svg?height=256&width=800&query=contest"}
                  alt={language === "ar" ? contest.title_ar : contest.title_en}
                  fill
                  className="object-cover"
                />
                <Badge className="absolute top-4 right-4 text-lg px-4 py-2">{getStatusText(contest.status)}</Badge>
              </div>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-3xl mb-4">
                    {language === "ar" ? contest.title_ar : contest.title_en}
                  </CardTitle>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3">
                      <Trophy className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">{language === "ar" ? "الجوائز" : "Prize Pool"}</p>
                        <p className="font-semibold">{contest.prize_pool}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {language === "ar" ? "المشاركون" : "Participants"}
                        </p>
                        <p className="font-semibold">
                          {contest.participant_count} / {contest.max_participants || "∞"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">{language === "ar" ? "الفترة" : "Duration"}</p>
                        <p className="font-semibold text-sm">{formatDate(contest.start_date)}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(contest.end_date)}</p>
                      </div>
                    </div>
                  </div>
                </div>
                {user && contest.status !== "completed" && (
                  <Button
                    size="lg"
                    onClick={handleJoin}
                    disabled={
                      joining ||
                      isParticipating ||
                      contest.status === "completed" ||
                      (contest.max_participants && contest.participant_count >= contest.max_participants)
                    }
                    className="ml-4"
                  >
                    {isParticipating ? (
                      <>
                        <CheckCircle2 className="mr-2 h-5 w-5" />
                        {language === "ar" ? "مسجل" : "Registered"}
                      </>
                    ) : joining ? (
                      "..."
                    ) : language === "ar" ? (
                      "سجل الآن"
                    ) : (
                      "Register Now"
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose dark:prose-invert max-w-none">
                <h3 className="text-xl font-semibold mb-2">{language === "ar" ? "عن المسابقة" : "About"}</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {language === "ar" ? contest.description_ar : contest.description_en}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                {language === "ar" ? "المشاركون والترتيب" : "Participants & Rankings"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {participants.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {language === "ar" ? "لا يوجد مشاركون بعد" : "No participants yet"}
                </div>
              ) : (
                <div className="space-y-2">
                  {participants.map((participant, index) => (
                    <div
                      key={participant.id}
                      className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="w-8 text-center font-bold">#{index + 1}</div>
                      <Avatar>
                        <AvatarFallback>{participant.name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold">{participant.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {language === "ar" ? "انضم في" : "Joined"}{" "}
                          {new Date(participant.joined_at).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US")}
                        </p>
                      </div>
                      {contest.status === "completed" && (
                        <Badge variant="secondary" className="px-3 py-1">
                          {participant.score} {language === "ar" ? "نقطة" : "pts"}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
