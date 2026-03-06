
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createCategory, updateCategory, deleteCategory } from "@/lib/db/queries"

const categorySchema = z.object({
  nameEn: z.string().min(1, "Name (EN) is required"),
  nameAr: z.string().min(1, "Name (AR) is required"),
  slug: z.string().min(1, "Slug is required"),
  descriptionEn: z.string().optional(),
  descriptionAr: z.string().optional(),
  iconUrl: z.string().optional(),
})

type CategoryFormValues = z.infer<typeof categorySchema>

interface CategoryFormProps {
  initialData?: any
  lang: string
}

export function CategoryForm({ initialData, lang }: CategoryFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: initialData
      ? {
          nameEn: initialData.name_en,
          nameAr: initialData.name_ar,
          slug: initialData.slug,
          descriptionEn: initialData.description_en || "",
          descriptionAr: initialData.description_ar || "",
          iconUrl: initialData.icon_url || "",
        }
      : {
          nameEn: "",
          nameAr: "",
          slug: "",
          descriptionEn: "",
          descriptionAr: "",
          iconUrl: "",
        },
  })

  const onSubmit = async (data: CategoryFormValues) => {
    try {
      setLoading(true)
      
      if (initialData) {
        const res = await updateCategory(initialData.id, data)
        if (!res) throw new Error("Failed to update category")
        toast.success("Category updated")
      } else {
        const res = await createCategory(data)
        if (!res) throw new Error("Failed to create category")
        toast.success("Category created")
      }
      
      router.refresh()
      router.push(`/${lang}/admin/categories`)
    } catch (error) {
      toast.error("Something went wrong")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const onDelete = async () => {
    try {
      setLoading(true)
      const success = await deleteCategory(initialData.id)
      if (!success) throw new Error("Failed to delete category")
      
      toast.success("Category deleted")
      router.refresh()
      router.push(`/${lang}/admin/categories`)
    } catch (error) {
      toast.error("Something went wrong")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <FormField
            control={form.control}
            name="nameEn"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name (English)</FormLabel>
                <FormControl>
                  <Input placeholder="Category name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="nameAr"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name (Arabic)</FormLabel>
                <FormControl>
                  <Input placeholder="اسم الفئة" {...field} className="text-right" dir="rtl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Slug</FormLabel>
                <FormControl>
                  <Input placeholder="category-slug" {...field} />
                </FormControl>
                <FormDescription>
                  URL-friendly identifier for the category.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="iconUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Icon URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://..." {...field} />
                </FormControl>
                <FormDescription>
                  URL to the category icon image.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="descriptionEn"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (English)</FormLabel>
                <FormControl>
                  <Textarea placeholder="Category description" {...field} />
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
                  <Textarea placeholder="وصف الفئة" {...field} className="text-right" dir="rtl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex items-center gap-4">
          <Button disabled={loading} type="submit">
            {initialData ? "Save changes" : "Create category"}
          </Button>
          {initialData && (
            <Button
              disabled={loading}
              variant="destructive"
              type="button"
              onClick={() => {
                if (confirm("Are you sure you want to delete this category?")) {
                  onDelete()
                }
              }}
            >
              Delete category
            </Button>
          )}
        </div>
      </form>
    </Form>
  )
}
