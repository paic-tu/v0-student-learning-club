"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/lib/language-context"
import { submitQuizAction } from "@/lib/actions"
import { completeLessonAction } from "@/lib/actions/course"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle2, XCircle } from "lucide-react"
import Link from "next/link"

interface Question {
  id: number
  question: string
  options: string[]
  answer: string
}

interface QuizClientProps {
  challenge: any
  previousSubmission: any
  nextUrl?: string
  courseId?: string
  lessonId?: string
}

export function QuizClient({ challenge, previousSubmission, nextUrl, courseId, lessonId }: QuizClientProps) {
  const { language } = useLanguage()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  
  const questions = challenge.testCases as Question[]
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [result, setResult] = useState<any>(previousSubmission ? {
      score: previousSubmission.score,
      isPassed: previousSubmission.isPassed,
      result: previousSubmission.result
  } : null)

  const handleSelect = (value: string) => {
    if (result) return // Disable if already submitted
    setAnswers(prev => ({ ...prev, [currentQuestionIndex]: value }))
  }

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const handleSubmit = () => {
    startTransition(async () => {
      const res = await submitQuizAction(challenge.id, answers)
      if (res.success) {
        
        // If passed and part of a lesson, mark as complete
        if (res.isPassed && courseId && lessonId) {
            await completeLessonAction(courseId, lessonId)
        }

        setResult(res)

        toast({
          title: language === "ar" ? "تم الإرسال" : "Submitted",
          description: `${language === "ar" ? "النتيجة" : "Score"}: ${res.score}%`,
        })
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: res.error || "Failed to submit",
        })
      }
    })
  }

  const currentQuestion = questions[currentQuestionIndex]

  if (result) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-2xl">
              {language === "ar" ? "نتيجة الاختبار" : "Quiz Result"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="flex justify-center">
              {result.isPassed ? (
                <CheckCircle2 className="h-24 w-24 text-green-500" />
              ) : (
                <XCircle className="h-24 w-24 text-red-500" />
              )}
            </div>
            <div>
              <h2 className="text-4xl font-bold mb-2">{result.score}%</h2>
              <p className="text-muted-foreground">
                {result.isPassed 
                  ? (language === "ar" ? "مبروك! لقد اجتزت الاختبار." : "Congratulations! You passed.") 
                  : (language === "ar" ? "للأسف، لم تجتز الاختبار." : "Sorry, you did not pass.")}
              </p>
            </div>
            
            <div className="text-left bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-4">{language === "ar" ? "مراجعة الإجابات" : "Review Answers"}</h3>
                <div className="space-y-4">
                    {questions.map((q, idx) => {
                        const resItem = result.result?.find((r: any) => r.questionIndex === idx)
                        const isCorrect = resItem?.isCorrect
                        return (
                            <div key={idx} className={`p-3 rounded border ${isCorrect ? 'border-green-500/50 bg-green-500/10' : 'border-red-500/50 bg-red-500/10'}`}>
                                <p className="font-medium mb-2">{idx + 1}. {q.question}</p>
                                <p className="text-sm">
                                    {language === "ar" ? "إجابتك:" : "Your Answer:"} <span className="font-semibold">{resItem?.userAnswer || "-"}</span>
                                </p>
                                {!isCorrect && (
                                    <p className="text-sm text-green-600 mt-1">
                                        {language === "ar" ? "الإجابة الصحيحة:" : "Correct Answer:"} <span className="font-semibold">{resItem?.correctAnswer || q.answer}</span>
                                    </p>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

          </CardContent>
          <CardFooter className="flex justify-center gap-4">
            <Button asChild>
              <Link href={nextUrl || `/${language}/challenges`}>
                {language === "ar" ? "التالي" : "Next"}
              </Link>
            </Button>
            {!result.isPassed && (
                <Button onClick={() => {
                    setResult(null)
                    setAnswers({})
                    setCurrentQuestionIndex(0)
                }}>
                    {language === "ar" ? "إعادة المحاولة" : "Retry"}
                </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">{language === "ar" ? challenge.titleAr : challenge.titleEn}</h1>
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{language === "ar" ? "السؤال" : "Question"} {currentQuestionIndex + 1} / {questions.length}</span>
          <span>{challenge.points} {language === "ar" ? "نقاط" : "Points"}</span>
        </div>
        {/* Progress Bar */}
        <div className="h-2 w-full bg-secondary mt-2 rounded-full overflow-hidden">
            <div 
                className="h-full bg-primary transition-all duration-300" 
                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium leading-relaxed">
            {currentQuestion.question}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={answers[currentQuestionIndex] || ""} 
            onValueChange={handleSelect}
            className="space-y-3"
          >
            {currentQuestion.options.map((option, idx) => (
              <div key={idx} className="flex items-center space-x-2 space-x-reverse border rounded-lg p-4 hover:bg-accent cursor-pointer" onClick={() => handleSelect(option)}>
                <RadioGroupItem value={option} id={`option-${idx}`} />
                <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer font-normal text-base">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handlePrev} 
            disabled={currentQuestionIndex === 0}
          >
            {language === "ar" ? "السابق" : "Previous"}
          </Button>
          
          {currentQuestionIndex === questions.length - 1 ? (
            <Button onClick={handleSubmit} disabled={isPending || Object.keys(answers).length !== questions.length}>
              {isPending 
                ? (language === "ar" ? "جاري الإرسال..." : "Submitting...") 
                : (language === "ar" ? "إرسال الإجابات" : "Submit Answers")
              }
            </Button>
          ) : (
            <Button onClick={handleNext} disabled={!answers[currentQuestionIndex]}>
              {language === "ar" ? "التالي" : "Next"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}