"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { NavBar } from "@/components/nav-bar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { getChallengeById, submitChallenge } from "@/lib/db/queries"
import { Clock, Trophy, Code, CheckCircle2 } from "lucide-react"
import { RequireAuth } from "@/components/require-auth"
import { useToast } from "@/hooks/use-toast"

export default function ChallengePage() {
  const { language } = useLanguage()
  const { user } = useAuth()
  const { id } = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [challenge, setChallenge] = useState<any>(null)
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)

  useEffect(() => {
    loadChallenge()
  }, [id])

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev && prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  const loadChallenge = async () => {
    try {
      const data = await getChallengeById(Number(id))
      setChallenge(data)
      if (data?.time_limit) {
        setTimeLeft(data.time_limit * 60) // Convert minutes to seconds
      }
    } catch (error) {
      console.error("[v0] Error loading challenge:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!user || !challenge) return

    setSubmitting(true)
    try {
      // Simple validation: code must not be empty
      const isPassed = code.trim().length > 20 // Basic check
      const score = isPassed ? challenge.points : 0

      await submitChallenge(user.id, challenge.id, code, score, isPassed)

      toast({
        title: isPassed
          ? language === "ar"
            ? "نجحت!"
            : "Success!"
          : language === "ar"
            ? "حاول مرة أخرى"
            : "Try Again",
        description: isPassed
          ? language === "ar"
            ? `لقد ربحت ${challenge.points} نقطة!`
            : `You earned ${challenge.points} points!`
          : language === "ar"
            ? "الحل غير صحيح"
            : "Solution is incorrect",
        variant: isPassed ? "default" : "destructive",
      })

      if (isPassed) {
        setTimeout(() => {
          router.push("/challenges")
        }, 2000)
      }
    } catch (error) {
      toast({
        title: language === "ar" ? "خطأ" : "Error",
        description: language === "ar" ? "فشل إرسال الحل" : "Failed to submit solution",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (loading) {
    return (
      <RequireAuth>
        <div className="min-h-screen bg-background">
          <NavBar />
          <main className="container mx-auto px-4 py-8">
            <div className="text-center py-16">
              <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto" />
            </div>
          </main>
        </div>
      </RequireAuth>
    )
  }

  if (!challenge) {
    return (
      <RequireAuth>
        <div className="min-h-screen bg-background">
          <NavBar />
          <main className="container mx-auto px-4 py-8">
            <div className="text-center py-16">
              <h2 className="text-2xl font-bold mb-4">
                {language === "ar" ? "التحدي غير موجود" : "Challenge not found"}
              </h2>
              <Button onClick={() => router.push("/challenges")}>
                {language === "ar" ? "العودة للتحديات" : "Back to Challenges"}
              </Button>
            </div>
          </main>
        </div>
      </RequireAuth>
    )
  }

  return (
    <RequireAuth>
      <div className="min-h-screen bg-background">
        <NavBar />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="capitalize">
                        <Code className="h-3 w-3 mr-1" />
                        {challenge.type}
                      </Badge>
                      <Badge>{language === "ar" ? challenge.difficulty : challenge.difficulty}</Badge>
                    </div>
                    <CardTitle className="text-2xl">
                      {language === "ar" ? challenge.title_ar : challenge.title_en}
                    </CardTitle>
                  </div>
                  {timeLeft !== null && (
                    <div className="flex items-center gap-2 text-lg font-mono">
                      <Clock className="h-5 w-5" />
                      <span className={timeLeft < 60 ? "text-destructive" : ""}>{formatTime(timeLeft)}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Trophy className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-primary">
                      {challenge.points} {language === "ar" ? "نقطة" : "points"}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {language === "ar" ? challenge.description_ar : challenge.description_en}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{language === "ar" ? "حلك" : "Your Solution"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder={
                    challenge.type === "coding"
                      ? language === "ar"
                        ? "اكتب كودك هنا..."
                        : "Write your code here..."
                      : language === "ar"
                        ? "اكتب إجابتك هنا..."
                        : "Write your answer here..."
                  }
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  rows={15}
                  className="font-mono text-sm"
                  disabled={timeLeft === 0}
                />
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || !code.trim() || timeLeft === 0}
                  className="w-full"
                  size="lg"
                >
                  {submitting ? (
                    "..."
                  ) : timeLeft === 0 ? (
                    language === "ar" ? (
                      "انتهى الوقت"
                    ) : (
                      "Time's Up"
                    )
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-5 w-5" />
                      {language === "ar" ? "إرسال الحل" : "Submit Solution"}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </RequireAuth>
  )
}
