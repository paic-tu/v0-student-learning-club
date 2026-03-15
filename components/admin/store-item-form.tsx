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

const storeItemSchema = z.object({
  nameEn: z.string().min(1, "English name is required"),
  nameAr: z.string().min(1, "Arabic name is required"),
  descriptionEn: z.string().min(10, "English description required"),
  descriptionAr: z.string().min(10, "Arabic description required"),
  price: z.number().min(0),
  pointsCost: z.number().int().min(0).optional().nullable(),
  stock: z.number().int().min(0),
  categoryId: z.string().min(1, "Category is required").uuid("Invalid category id"),
  streamProductId: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || z.string().uuid().safeParse(v).success, { message: "Invalid Stream product_id" }),
  imageUrl: z.string().optional().or(z.literal("")).nullable(),
  isActive: z.boolean().default(true),
})

type StoreItemFormData = z.infer<typeof storeItemSchema>

interface StoreItemFormProps {
  lang: string
  categories: Array<{ id: string; nameEn: string; nameAr: string }>
  product?: {
    id: string
    nameEn: string
    nameAr: string
    descriptionEn: string | null
    descriptionAr: string | null
    price: string
    pointsCost: number | null
    stockQuantity: number
    categoryId: string | null
    streamProductId: string | null
    imageUrl: string | null
    isActive: boolean
  }
}

export function StoreItemForm({ lang, categories, product }: StoreItemFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<StoreItemFormData>({
    resolver: zodResolver(storeItemSchema),
    defaultValues: {
      nameEn: product?.nameEn || "",
      nameAr: product?.nameAr || "",
      descriptionEn: product?.descriptionEn || "",
      descriptionAr: product?.descriptionAr || "",
      price: product?.price ? Number.parseFloat(product.price) : 0,
      pointsCost: product?.pointsCost ?? null,
      stock: product?.stockQuantity ?? 0,
      categoryId: product?.categoryId || categories[0]?.id || "",
      streamProductId: product?.streamProductId ?? null,
      imageUrl: product?.imageUrl || "",
      isActive: product?.isActive ?? true,
    },
  })

  async function onSubmit(data: StoreItemFormData) {
    setIsLoading(true)
    try {
      const response = await fetch(product ? `/api/admin/store/${product.id}` : "/api/admin/store", {
        method: product ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error(product ? "Failed to update store item" : "Failed to create store item")

      toast.success(product ? "Store item updated successfully" : "Store item created successfully")
      router.push(`/${lang}/admin/store`)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : product ? "Failed to update store item" : "Failed to create store item")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormLayout title="Basic Information" description="Enter store item details">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="nameEn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name (English)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Programming T-Shirt" />
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
                    <Input {...field} placeholder="تيشيرت البرمجة" dir="rtl" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (USD)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      onChange={(e) => field.onChange(Number.parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pointsCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Points Cost (Optional)</FormLabel>
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
              name="stock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" onChange={(e) => field.onChange(Number.parseInt(e.target.value))} />
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
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                  >
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

            <FormField
              control={form.control}
              name="streamProductId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stream product_id</FormLabel>
                  <FormControl>
                    <Input
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      dir="ltr"
                    />
                  </FormControl>
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

        <FormLayout title="Description" description="Add item description in both languages">
          <FormField
            control={form.control}
            name="descriptionEn"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (English)</FormLabel>
                <FormControl>
                  <Textarea {...field} rows={4} placeholder="Item description..." />
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
                  <Textarea {...field} rows={4} placeholder="وصف المنتج..." dir="rtl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormLayout>

        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Store Item
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}
