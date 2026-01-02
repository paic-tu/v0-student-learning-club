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
import { FormLayout } from "@/components/admin/form-layout"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

const contestSchema = z.object({
  titleEn: z.string().min(1, "English title is required"),
  titleAr: z.string().min(1, "Arabic title is required"),
  descriptionEn: z.string().min(10, "English description required"),
  descriptionAr: z.string().min(10, "Arabic description required"),
  status: z.enum(["upcoming", "active", "completed"]),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  prizePool: z.string().optional(),
  maxParticipants: z.number().int().min(0).optional(),
})

type ContestFormData = z.infer<typeof contestSchema>

export function ContestForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<ContestFormData>({
    resolver: zodResolver(contestSchema),
    defaultValues: {
      titleEn: "",
      titleAr: "",
      descriptionEn: "",
      descriptionAr: "",
      status: "upcoming",
      prizePool: "",
      maxParticipants: 500,
    },
  })

  async function onSubmit(data: ContestFormData) {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/contests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error("Failed to create contest")

      toast.success("Contest created successfully")
      router.push("/admin/contests")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create contest")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormLayout title="Contest Information" description="Create a new contest">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="titleEn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title (English)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Code Championship 2025" />
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
                    <Input {...field} placeholder="بطولة البرمجة 2025" dir="rtl" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maxParticipants"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Participants</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value ? Number.parseInt(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="prizePool"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Prize Pool</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., $5,000 in prizes" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </FormLayout>

        <FormLayout title="Description" description="Add contest description in both languages">
          <FormField
            control={form.control}
            name="descriptionEn"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (English)</FormLabel>
                <FormControl>
                  <Textarea {...field} rows={4} placeholder="Contest description..." />
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
                  <Textarea {...field} rows={4} placeholder="وصف المسابقة..." dir="rtl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormLayout>

        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Contest
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}
