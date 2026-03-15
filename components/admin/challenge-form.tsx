"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Checkbox } from "@/components/ui/checkbox"
import { FormLayout } from "@/components/admin/form-layout"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

const challengeSchema = z.object({
  titleEn: z.string().min(1, "English title is required"),
  titleAr: z.string().min(1, "Arabic title is required"),
  descriptionEn: z.string().min(10, "English description required"),
  descriptionAr: z.string().min(10, "Arabic description required"),
  type: z.enum(["coding", "project", "quiz"]),
  codingFormat: z.enum(["standard", "find_bug_python"]).default("standard"),
  buggyCode: z.string().optional(),
  starterCode: z.string().optional(),
  solutionCode: z.string().optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  points: z.number().int().min(0),
  timeLimit: z.number().int().min(0).optional().nullable(),
  startAt: z.string().optional(),
  endAt: z.string().optional(),
  rulesAr: z.string().optional(),
  rulesEn: z.string().optional(),
  categoryId: z.string().min(1),
  isActive: z.boolean().default(true),
}).superRefine((val, ctx) => {
  if (val.type === "coding" && val.codingFormat === "find_bug_python") {
    if (!val.buggyCode?.trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Buggy code is required", path: ["buggyCode"] })
    if (!val.solutionCode?.trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Correct code is required", path: ["solutionCode"] })
    if (!val.startAt?.trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Start time is required", path: ["startAt"] })
    if (!val.endAt?.trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "End time is required", path: ["endAt"] })
    if (val.timeLimit == null || !Number.isFinite(val.timeLimit) || val.timeLimit <= 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Submission time limit is required", path: ["timeLimit"] })
    }
    if (val.startAt && val.endAt) {
      const s = new Date(val.startAt).getTime()
      const e = new Date(val.endAt).getTime()
      if (!Number.isFinite(s)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid start time", path: ["startAt"] })
      if (!Number.isFinite(e)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid end time", path: ["endAt"] })
      if (Number.isFinite(s) && Number.isFinite(e) && e <= s) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "End time must be after start time", path: ["endAt"] })
      }
    }
  }
})

type ChallengeFormData = z.infer<typeof challengeSchema>

interface ChallengeFormProps {
  categories: Array<{ id: string; nameEn: string; nameAr: string }>
  redirectTo?: string
  preset?: Partial<ChallengeFormData>
}

export function ChallengeForm({ categories, redirectTo, preset }: ChallengeFormProps) {
  const router = useRouter()
  const { language } = useLanguage()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<ChallengeFormData>({
    resolver: zodResolver(challengeSchema),
    defaultValues: {
      titleEn: "",
      titleAr: "",
      descriptionEn: "",
      descriptionAr: "",
      type: "coding",
      codingFormat: "standard",
      difficulty: "beginner",
      points: 100,
      isActive: true,
      ...(preset || {}),
    },
  })

  const type = form.watch("type")
  const codingFormat = form.watch("codingFormat")

  async function onSubmit(data: ChallengeFormData) {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const body = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error((body as any)?.error || "Failed to create challenge")
      }

      const createdId = (body as any)?.id as string | undefined
      toast.success(createdId ? `Challenge created: ${createdId}` : "Challenge created successfully")

      if (redirectTo) {
        router.push(createdId ? redirectTo.replace("{id}", createdId) : redirectTo)
      } else {
        router.push(`/${language}/admin/challenges`)
      }
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create challenge")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormLayout title="Challenge Information" description="Create a new coding challenge">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="titleEn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title (English)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="FizzBuzz Challenge" />
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
                  <FormLabel>Title (Arabic)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="تحدي FizzBuzz" dir="rtl" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="coding">Coding</SelectItem>
                      <SelectItem value="project">Project</SelectItem>
                      <SelectItem value="quiz">Quiz</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {type === "coding" && (
              <FormField
                control={form.control}
                name="codingFormat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Coding Mode</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="find_bug_python">Find the Bug (Python)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="difficulty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Difficulty</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="points"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Points</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" onChange={(e) => field.onChange(Number.parseInt(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="timeLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{type === "coding" && codingFormat === "find_bug_python" ? "Submission Time Limit (minutes)" : "Time Limit (minutes, optional)"}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value ? Number.parseInt(e.target.value) : null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.nameEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Active</FormLabel>
                </div>
              </FormItem>
            )}
          />
        </FormLayout>

        {type === "coding" && codingFormat === "find_bug_python" && (
          <FormLayout title="Find the Bug (Python)" description="Provide buggy code and correct solution">
            <div className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="startAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input {...field} type="datetime-local" value={field.value || ""} onChange={(e) => field.onChange(e.target.value)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <Input {...field} type="datetime-local" value={field.value || ""} onChange={(e) => field.onChange(e.target.value)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="buggyCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Buggy Code</FormLabel>
                    <FormControl>
                      <Textarea {...field} className="min-h-[180px] font-mono text-sm" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="starterCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Starter Code (optional)</FormLabel>
                    <FormControl>
                      <Textarea {...field} className="min-h-[160px] font-mono text-sm" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="solutionCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correct Code (used for evaluation)</FormLabel>
                    <FormControl>
                      <Textarea {...field} className="min-h-[200px] font-mono text-sm" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="rulesAr"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rules (Arabic)</FormLabel>
                      <FormControl>
                        <Textarea {...field} className="min-h-[140px]" dir="rtl" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rulesEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rules (English)</FormLabel>
                      <FormControl>
                        <Textarea {...field} className="min-h-[140px]" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </FormLayout>
        )}

        <FormLayout title="Description" description="Add challenge description in both languages">
          <FormField
            control={form.control}
            name="descriptionEn"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (English)</FormLabel>
                <FormControl>
                  <Textarea {...field} rows={4} placeholder="Challenge description..." />
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
                <FormLabel>Description (Arabic)</FormLabel>
                <FormControl>
                  <Textarea {...field} rows={4} placeholder="وصف التحدي..." dir="rtl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormLayout>

        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Challenge
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}
