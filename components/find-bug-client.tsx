"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/lib/language-context"
import { submitFindBugAction } from "@/lib/actions"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle2, XCircle, Clock } from "lucide-react"
import Link from "next/link"

function formatElapsed(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, "0")}`
}

export function FindBugClient({ challenge, previousSubmission }: { challenge: any; previousSubmission: any }) {
  const { language } = useLanguage()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  const testCases = (challenge?.testCases || {}) as any
  const buggyCode = String(testCases?.buggyCode || "")
  const starterCode = String(testCases?.starterCode || testCases?.buggyCode || "")
  const startAtMs = testCases?.startAt ? new Date(testCases.startAt).getTime() : null
  const endAtMs = testCases?.endAt ? new Date(testCases.endAt).getTime() : null
  const timeLimitMinutes = Number.isFinite(challenge?.timeLimit) ? Number(challenge.timeLimit) : null

  const [code, setCode] = useState(starterCode)
  const [openedAt] = useState(() => Date.now())
  const [now, setNow] = useState(() => Date.now())

  const effectiveStartAt = useMemo(() => {
    if (typeof startAtMs === "number" && Number.isFinite(startAtMs) && startAtMs > openedAt) return startAtMs
    return openedAt
  }, [openedAt, startAtMs])

  const elapsedMs = now - effectiveStartAt
  const elapsedClampedMs = Math.max(0, elapsedMs)
  const isNotStarted = typeof startAtMs === "number" && Number.isFinite(startAtMs) && now < startAtMs
  const isEnded = typeof endAtMs === "number" && Number.isFinite(endAtMs) && now > endAtMs
  const timeLimitMs = typeof timeLimitMinutes === "number" && Number.isFinite(timeLimitMinutes) && timeLimitMinutes > 0 ? timeLimitMinutes * 60000 : null
  const isTimeLimitExceeded =
    typeof timeLimitMs === "number" && Number.isFinite(timeLimitMs) && timeLimitMs > 0 ? elapsedClampedMs > timeLimitMs : false

  const submitDisabledReason = useMemo(() => {
    if (isNotStarted) return language === "ar" ? "التحدي لم يبدأ بعد" : "Challenge not started"
    if (isEnded) return language === "ar" ? "انتهى التحدي" : "Challenge ended"
    if (isTimeLimitExceeded) return language === "ar" ? "انتهى وقت التسليم" : "Submission time exceeded"
    if (!code.trim()) return language === "ar" ? "اكتب الحل أولاً" : "Write your solution first"
    return null
  }, [code, isEnded, isNotStarted, isTimeLimitExceeded, language])

  const [result, setResult] = useState<any>(() => {
    if (!previousSubmission) return null
    return {
      isPassed: Boolean(previousSubmission.isPassed),
      awardedPoints: Number(previousSubmission.score || 0),
      meta: previousSubmission.result || null,
    }
  })

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const basePoints = Number.isFinite(challenge?.points) ? Number(challenge.points) : 100
  const bonusInfo = useMemo(() => {
    return language === "ar"
      ? "البونص: يبدأ 50، ينقص 5 لكل دقيقة و10 لكل محاولة إضافية"
      : "Bonus: starts at 50, -5 per minute and -10 per extra attempt"
  }, [language])

  const handleSubmit = () => {
    startTransition(async () => {
      const res = await submitFindBugAction(challenge.id, code, { timeMs: elapsedClampedMs })
      if (res?.success) {
        const passed = Boolean(res.isPassed)
        setResult({
          isPassed: passed,
          awardedPoints: Number(res.awardedPoints || 0),
          meta: { attempts: res.attempts, timeMs: res.timeMs, bonus: res.bonus, timeLimitExceeded: res.timeLimitExceeded },
        })
        toast({
          title: language === "ar" ? "تم الإرسال" : "Submitted",
          description: passed
            ? `${language === "ar" ? "إجابة صحيحة" : "Correct"} • +${res.awardedPoints} ${language === "ar" ? "نقطة" : "pts"}`
            : res.timeLimitExceeded
              ? language === "ar"
                ? "انتهى وقت التسليم"
                : "Submission time exceeded"
              : language === "ar"
                  ? "الإجابة غير صحيحة، حاول مرة أخرى"
                  : "Incorrect answer, try again",
        })
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: res?.error || "Failed to submit",
        })
      }
    })
  }

  if (result?.isPassed) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-2xl">{language === "ar" ? "نتيجة التحدي" : "Challenge Result"}</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="flex justify-center">
              <CheckCircle2 className="h-24 w-24 text-green-500" />
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold">+{result.awardedPoints} {language === "ar" ? "نقطة" : "pts"}</div>
              <div className="text-muted-foreground">
                {language === "ar" ? "مبروك! تم حل التحدي بنجاح." : "Congrats! You solved the challenge."}
              </div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                <Clock className="h-4 w-4" />
                <span>
                  {language === "ar" ? "الوقت" : "Time"}: {formatElapsed(Number(result.meta?.timeMs || 0))} •{" "}
                  {language === "ar" ? "المحاولات" : "Attempts"}: {Number(result.meta?.attempts || 1)}
                </span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button asChild>
              <Link href={`/${language}/challenges`}>{language === "ar" ? "العودة للتحديات" : "Back to Challenges"}</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8 space-y-3" dir={language === "ar" ? "rtl" : "ltr"}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">{language === "ar" ? challenge.titleAr : challenge.titleEn}</h1>
            <div className="text-sm text-muted-foreground">
              {basePoints} {language === "ar" ? "نقطة" : "Points"} • {bonusInfo}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isNotStarted && <Badge variant="secondary">{language === "ar" ? "قريباً" : "Upcoming"}</Badge>}
            {isEnded && <Badge variant="secondary">{language === "ar" ? "منتهي" : "Ended"}</Badge>}
            {!isNotStarted && !isEnded && <Badge variant="secondary">{language === "ar" ? "مفتوح" : "Open"}</Badge>}
            {isTimeLimitExceeded && <Badge variant="secondary">{language === "ar" ? "انتهى وقت التسليم" : "Time Over"}</Badge>}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {language === "ar" ? "الوقت" : "Time"}: {formatElapsed(elapsedClampedMs)}
            {typeof timeLimitMs === "number" && timeLimitMs > 0 && !isNotStarted && (
              <span>
                {" "}
                • {language === "ar" ? "المتبقي" : "Remaining"}: {formatElapsed(Math.max(0, timeLimitMs - elapsedClampedMs))}
              </span>
            )}
          </span>
          <span className="flex flex-wrap gap-x-4 gap-y-1">
            {typeof startAtMs === "number" && Number.isFinite(startAtMs) && (
              <span>{language === "ar" ? "يبدأ" : "Starts"}: {new Date(startAtMs).toLocaleString(language === "ar" ? "ar" : "en")}</span>
            )}
            {typeof endAtMs === "number" && Number.isFinite(endAtMs) && (
              <span>{language === "ar" ? "ينتهي" : "Ends"}: {new Date(endAtMs).toLocaleString(language === "ar" ? "ar" : "en")}</span>
            )}
          </span>
        </div>
        {(startAtMs || endAtMs || timeLimitMinutes) && (
          <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
            {typeof timeLimitMinutes === "number" && Number.isFinite(timeLimitMinutes) && timeLimitMinutes > 0 && (
              <span>{language === "ar" ? "وقت التسليم" : "Submission time"}: {timeLimitMinutes} {language === "ar" ? "دقيقة" : "min"}</span>
            )}
          </div>
        )}
        {submitDisabledReason && (
          <div className="text-sm text-muted-foreground">{submitDisabledReason}</div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{language === "ar" ? "القوانين" : "Rules"}</CardTitle>
            </CardHeader>
            <CardContent>
              {Array.isArray(testCases?.rules) ? (
                <ul className="list-disc ps-5 space-y-2 text-sm text-muted-foreground" dir={language === "ar" ? "rtl" : "ltr"}>
                  {testCases.rules.map((r: any, idx: number) => (
                    <li key={idx}>{String(r)}</li>
                  ))}
                </ul>
              ) : testCases?.rules && typeof testCases.rules === "object" && (testCases.rules.ar || testCases.rules.en) ? (
                <ul className="list-disc ps-5 space-y-2 text-sm text-muted-foreground" dir={language === "ar" ? "rtl" : "ltr"}>
                  {String(language === "ar" ? testCases.rules.ar : testCases.rules.en)
                    .split("\n")
                    .map((line: string) => line.trim())
                    .filter(Boolean)
                    .map((line: string, idx: number) => (
                      <li key={idx}>{line}</li>
                    ))}
                </ul>
              ) : (
                <ul className="list-disc ps-5 space-y-2 text-sm text-muted-foreground" dir={language === "ar" ? "rtl" : "ltr"}>
                  <li>{language === "ar" ? "اقرأ الكود وحدد الخطأ ثم اكتب النسخة الصحيحة." : "Read the code, identify the bug, then submit the corrected version."}</li>
                  <li>{language === "ar" ? "يجب أن يكون الحل كود بايثون صالح." : "Your submission must be valid Python code."}</li>
                  <li>{language === "ar" ? "مسموح بعدة محاولات، لكن البونص يقل مع كل محاولة إضافية." : "Multiple attempts are allowed, but the bonus decreases with extra attempts."}</li>
                  <li>{language === "ar" ? "يتم احتساب النقاط حسب الوقت وعدد المحاولات." : "Scoring depends on time and attempts."}</li>
                  <li>{language === "ar" ? "لا يمكن التسليم خارج وقت البدء/الانتهاء أو بعد انتهاء وقت التسليم." : "Submissions are blocked outside the start/end window or after the submission time limit."}</li>
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{language === "ar" ? "الكود فيه خطأ" : "Buggy Code"}</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre overflow-auto rounded-lg border bg-muted/30 p-4 text-sm font-mono">
                {buggyCode || (language === "ar" ? "لا يوجد كود" : "No code")}
              </pre>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{language === "ar" ? "اكتب الحل" : "Submit Fix"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                rows={18}
                className="font-mono text-sm"
                spellCheck={false}
              />
              {result && !result.isPassed && (
                <div className="flex items-center gap-2 text-sm text-red-600" dir={language === "ar" ? "rtl" : "ltr"}>
                  <XCircle className="h-4 w-4" />
                  <span>
                    {result.meta?.timeLimitExceeded
                      ? language === "ar"
                        ? "انتهى وقت التسليم"
                        : "Submission time exceeded"
                      : language === "ar"
                        ? "الإجابة غير صحيحة، حاول مرة أخرى"
                        : "Incorrect answer, try again"}
                  </span>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Button onClick={handleSubmit} disabled={isPending || Boolean(submitDisabledReason)}>
                  {isPending ? (language === "ar" ? "جاري الإرسال..." : "Submitting...") : (language === "ar" ? "إرسال الكود" : "Submit Code")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCode(starterCode)
                  }}
                >
                  {language === "ar" ? "إعادة ضبط" : "Reset"}
                </Button>
              </div>
              {submitDisabledReason && (
                <div className="text-xs text-muted-foreground" dir={language === "ar" ? "rtl" : "ltr"}>
                  {submitDisabledReason}
                </div>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
