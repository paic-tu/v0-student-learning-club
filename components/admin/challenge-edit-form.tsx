"use client"

import { useMemo, useState } from "react"
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

const schema = z.object({
  titleEn: z.string().min(1),
  titleAr: z.string().min(1),
  descriptionEn: z.string().min(1),
  descriptionAr: z.string().min(1),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  points: z.number().int().min(0),
  timeLimit: z.number().int().min(0).nullable().optional(),
  categoryId: z.string().min(1),
  isActive: z.boolean().default(true),
  codingFormat: z.enum(["standard", "find_bug_python"]).default("standard"),
  startAt: z.string().optional(),
  endAt: z.string().optional(),
  buggyCode: z.string().optional(),
  starterCode: z.string().optional(),
  solutionCode: z.string().optional(),
  rulesAr: z.string().optional(),
  rulesEn: z.string().optional(),
}).superRefine((val, ctx) => {
  if (val.codingFormat === "find_bug_python") {
    if (!val.startAt?.trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Start time is required", path: ["startAt"] })
    if (!val.endAt?.trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "End time is required", path: ["endAt"] })
    if (!val.buggyCode?.trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Buggy code is required", path: ["buggyCode"] })
    if (!val.solutionCode?.trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Correct code is required", path: ["solutionCode"] })
    if (val.timeLimit == null || !Number.isFinite(val.timeLimit) || val.timeLimit <= 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Submission time limit is required", path: ["timeLimit"] })
    }
    if (val.startAt && val.endAt) {
      const s = new Date(val.startAt).getTime()
      const e = new Date(val.endAt).getTime()
      if (Number.isFinite(s) && Number.isFinite(e) && e <= s) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "End time must be after start time", path: ["endAt"] })
      }
    }
  }
})

type FormData = z.infer<typeof schema>

function toDatetimeLocal(value: any) {
  if (!value) return ""
  const d = new Date(value)
  if (!Number.isFinite(d.getTime())) return ""
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  const hh = String(d.getHours()).padStart(2, "0")
  const mi = String(d.getMinutes()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`
}

export function AdminChallengeEditForm({
  lang,
  categories,
  challenge,
}: {
  lang: string
  categories: Array<{ id: string; nameEn: string; nameAr: string }>
  challenge: any
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const testCases = useMemo(() => (challenge?.testCases || {}) as any, [challenge?.testCases])
  const codingFormat = useMemo(() => (testCases?.format === "find_bug_python" ? "find_bug_python" : "standard"), [testCases?.format])

  const defaults: FormData = useMemo(() => {
    return {
      titleEn: challenge.titleEn || "",
      titleAr: challenge.titleAr || "",
      descriptionEn: challenge.descriptionEn || "",
      descriptionAr: challenge.descriptionAr || "",
      difficulty: challenge.difficulty || "beginner",
      points: Number.isFinite(challenge.points) ? Number(challenge.points) : 100,
      timeLimit: challenge.timeLimit ?? null,
      categoryId: challenge.categoryId || "",
      isActive: Boolean(challenge.isActive),
      codingFormat,
      startAt: toDatetimeLocal(testCases?.startAt),
      endAt: toDatetimeLocal(testCases?.endAt),
      buggyCode: testCases?.buggyCode || "",
      starterCode: testCases?.starterCode || "",
      solutionCode: challenge.solution || "",
      rulesAr: testCases?.rules?.ar || "",
      rulesEn: testCases?.rules?.en || "",
    }
  }, [challenge, codingFormat, testCases])

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  })

  const activeCodingFormat = form.watch("codingFormat")

  async function onSubmit(data: FormData) {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/challenges/${challenge.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const body = await response.json().catch(() => null)
      if (!response.ok) throw new Error((body as any)?.error || "Failed to update challenge")

      toast.success("Challenge updated successfully")
      router.push(`/${lang}/admin/challenges`)
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update challenge")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormLayout title="Challenge Information" description="Edit challenge fields">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="titleEn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title (English)</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                    <Input {...field} dir="rtl" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                  <FormLabel>{activeCodingFormat === "find_bug_python" ? "Submission Time Limit (minutes)" : "Time Limit (minutes, optional)"}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      value={field.value ?? ""}
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
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {lang === "ar" ? c.nameAr : c.nameEn}
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

        {activeCodingFormat === "find_bug_python" && (
          <FormLayout title="Find the Bug (Python)" description="Edit buggy code and evaluation fields">
            <div className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="startAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input {...field} type="datetime-local" value={field.value || ""} />
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
                        <Input {...field} type="datetime-local" value={field.value || ""} />
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

        <FormLayout title="Description" description="Edit description in both languages">
          <FormField
            control={form.control}
            name="descriptionEn"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (English)</FormLabel>
                <FormControl>
                  <Textarea {...field} rows={4} />
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
                  <Textarea {...field} rows={4} dir="rtl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormLayout>

        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}
