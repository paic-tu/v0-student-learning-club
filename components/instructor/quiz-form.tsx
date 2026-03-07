"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Plus, Trash2, GripVertical } from "lucide-react"
import { createQuizAction, updateQuizAction } from "@/lib/actions/challenge"

const questionSchema = z.object({
  question: z.string().min(1, "Question text is required"),
  options: z.array(z.string().min(1, "Option text is required")).min(2, "At least 2 options are required"),
  answer: z.coerce.number().min(0, "Correct answer index is required"),
  points: z.coerce.number().min(1).default(1),
})

const getQuizSchema = (isAr: boolean) => z.object({
  titleEn: z.string().min(1, isAr ? "العنوان بالإنجليزية مطلوب" : "English title is required"),
  titleAr: z.string().min(1, isAr ? "العنوان بالعربية مطلوب" : "Arabic title is required"),
  descriptionEn: z.string().min(1, isAr ? "الوصف بالإنجليزية مطلوب" : "English description is required"),
  descriptionAr: z.string().min(1, isAr ? "الوصف بالعربية مطلوب" : "Arabic description is required"),
  courseId: z.string().uuid().optional().nullable(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  timeLimit: z.coerce.number().min(1).optional(),
  points: z.coerce.number().min(1).default(10),
  questions: z.array(questionSchema).min(1, isAr ? "سؤال واحد على الأقل مطلوب" : "At least one question is required"),
})

type QuizFormData = z.infer<ReturnType<typeof getQuizSchema>>

interface InstructorQuizFormProps {
  initialData?: any
  quizId?: string
  lang: string
  courses: { id: string; titleEn: string; titleAr: string }[]
}

export function InstructorQuizForm({ initialData, quizId, lang, courses }: InstructorQuizFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const isAr = lang === "ar"

  const form = useForm<QuizFormData>({
    resolver: zodResolver(getQuizSchema(isAr)),
    defaultValues: initialData || {
      titleEn: "",
      titleAr: "",
      descriptionEn: "",
      descriptionAr: "",
      courseId: null,
      difficulty: "beginner",
      timeLimit: 15,
      points: 10,
      questions: [
        {
          question: "",
          options: ["", "", "", ""],
          answer: 0,
          points: 1
        }
      ]
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "questions",
  })

  async function onSubmit(data: QuizFormData) {
    setIsLoading(true)
    try {
      if (quizId) {
        const result = await updateQuizAction(quizId, data)
        if (result.error) {
            toast({
                title: isAr ? "خطأ" : "Error",
                description: result.error,
                variant: "destructive",
            })
        } else {
            toast({
                title: isAr ? "تم بنجاح" : "Success",
                description: isAr ? "تم تحديث الكويز بنجاح" : "Quiz updated successfully",
            })
            router.push(`/${lang}/instructor/quizzes`)
            router.refresh()
        }
      } else {
        const result = await createQuizAction(data)
        if (result.error) {
            toast({
                title: isAr ? "خطأ" : "Error",
                description: result.error,
                variant: "destructive",
            })
        } else {
            toast({
                title: isAr ? "تم بنجاح" : "Success",
                description: isAr ? "تم إنشاء الكويز بنجاح" : "Quiz created successfully",
            })
            router.push(`/${lang}/instructor/quizzes`)
            router.refresh()
        }
      }
    } catch (error) {
      console.error(error)
      toast({
        title: isAr ? "خطأ" : "Error",
        description: isAr ? "حدث خطأ غير متوقع" : "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="titleEn"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{isAr ? "العنوان (نجليزي)" : "Title (English)"}</FormLabel>
                <FormControl>
                  <Input disabled={isLoading} placeholder="Quiz Title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="titleAr"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{isAr ? "العنوان (عربي)" : "Title (Arabic)"}</FormLabel>
                <FormControl>
                  <Input disabled={isLoading} placeholder="عنوان الكويز" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="descriptionEn"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{isAr ? "الوصف (نجليزي)" : "Description (English)"}</FormLabel>
                <FormControl>
                  <Textarea disabled={isLoading} placeholder="Quiz Description" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="descriptionAr"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{isAr ? "الوصف (عربي)" : "Description (Arabic)"}</FormLabel>
                <FormControl>
                  <Textarea disabled={isLoading} placeholder="وصف الكويز" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="courseId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{isAr ? "الدورة المرتبطة (اختياري)" : "Linked Course (Optional)"}</FormLabel>
                <Select
                  disabled={isLoading}
                  onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                  value={field.value || "none"}
                  defaultValue={field.value || "none"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={isAr ? "اختر دورة" : "Select a course"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">{isAr ? "بدون دورة" : "No Course"}</SelectItem>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {isAr ? course.titleAr : course.titleEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
             <FormField
                control={form.control}
                name="difficulty"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>{isAr ? "الصعوبة" : "Difficulty"}</FormLabel>
                    <Select
                    disabled={isLoading}
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                    >
                    <FormControl>
                        <SelectTrigger>
                        <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="beginner">{isAr ? "مبتدئ" : "Beginner"}</SelectItem>
                        <SelectItem value="intermediate">{isAr ? "متوسط" : "Intermediate"}</SelectItem>
                        <SelectItem value="advanced">{isAr ? "متقدم" : "Advanced"}</SelectItem>
                    </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="timeLimit"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>{isAr ? "الوقت (دقائق)" : "Time Limit (Minutes)"}</FormLabel>
                    <FormControl>
                    <Input type="number" disabled={isLoading} {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
          </div>
        </div>

        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">{isAr ? "الأسئلة" : "Questions"}</h3>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ question: "", options: ["", "", "", ""], answer: 0, points: 1 })}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    {isAr ? "إضافة سؤال" : "Add Question"}
                </Button>
            </div>
            
            {fields.map((field, index) => (
                <Card key={field.id}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {isAr ? `سؤال ${index + 1}` : `Question ${index + 1}`}
                        </CardTitle>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(index)}
                        >
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-2">
                        <FormField
                            control={form.control}
                            name={`questions.${index}.question`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{isAr ? "نص السؤال" : "Question Text"}</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder={isAr ? "أدخل السؤال هنا" : "Enter question here"} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        
                        <div className="grid gap-4 md:grid-cols-2">
                            {[0, 1, 2, 3].map((optionIndex) => (
                                <FormField
                                    key={optionIndex}
                                    control={form.control}
                                    name={`questions.${index}.options.${optionIndex}`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs cursor-pointer ${form.watch(`questions.${index}.answer`) === optionIndex ? "bg-primary text-primary-foreground border-primary" : "border-muted-foreground"}`}
                                                     onClick={() => form.setValue(`questions.${index}.answer`, optionIndex)}
                                                >
                                                    {String.fromCharCode(65 + optionIndex)}
                                                </div>
                                                <FormControl>
                                                    <Input {...field} placeholder={`${isAr ? "خيار" : "Option"} ${optionIndex + 1}`} />
                                                </FormControl>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            ))}
                        </div>
                        <FormDescription>
                            {isAr ? "انقر على الحرف لتحديد الإجابة الصحيحة" : "Click on the letter to mark as correct answer"}
                        </FormDescription>
                    </CardContent>
                </Card>
            ))}
        </div>

        <Button disabled={isLoading} type="submit" className="w-full">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isAr ? (quizId ? "تحديث الكويز" : "إنشاء الكويز") : (quizId ? "Update Quiz" : "Create Quiz")}
        </Button>
      </form>
    </Form>
  )
}
