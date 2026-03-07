
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { ImageUpload } from "@/components/image-upload"
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
import { useToast } from "@/hooks/use-toast"
import { updateUserProfile } from "@/lib/db/queries"

const profileFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email(),
  role: z.string(),
  userId: z.string(),
  avatarUrl: z.string().optional().or(z.literal("")),
  coverUrl: z.string().optional().or(z.literal("")),
  bio: z.string().max(500).optional(),
  headline: z.string().optional().or(z.literal("")),
  phoneLocal: z.string().optional().or(z.literal("")),
  websiteUrl: z.string().optional().or(z.literal("")),
  twitterUrl: z.string().optional().or(z.literal("")),
  linkedinUrl: z.string().optional().or(z.literal("")),
}).superRefine((values, ctx) => {
  const digits = (values.phoneLocal || "").replace(/\D/g, "")
  if (digits.length === 0) return

  if (!/^5\d{8}$/.test(digits)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["phoneLocal"],
      message: "رقم غير صحيح / Invalid phone number.",
    })
  }
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

interface SettingsFormProps {
  user: any
  lang: string
}

export function SettingsForm({ user, lang }: SettingsFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const isAr = lang === "ar"

  const phoneLocalDefault = (() => {
    const raw = String(user?.phoneNumber || "")
    const digits = raw.replace(/\D/g, "")
    if (!digits) return ""
    if (digits.startsWith("966")) return digits.slice(3)
    if (digits.startsWith("0")) return digits.slice(1)
    return digits
  })()

  const defaultValues: Partial<ProfileFormValues> = {
    name: user?.name || "",
    email: user?.email || "",
    role: user?.role || "",
    userId: user?.id || "",
    avatarUrl: user?.avatarUrl || "",
    coverUrl: user?.coverUrl || "",
    bio: user?.bio || "",
    headline: user?.headline || "",
    phoneLocal: phoneLocalDefault,
    websiteUrl: user?.websiteUrl || "",
    twitterUrl: user?.twitterUrl || "",
    linkedinUrl: user?.linkedinUrl || "",
  }

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
  })

  async function onSubmit(data: ProfileFormValues) {
    setIsLoading(true)

    try {
      const phoneDigits = (data.phoneLocal || "").replace(/\D/g, "")
      const phoneNumber = phoneDigits ? `+966${phoneDigits}` : null

      const result = await updateUserProfile(user.id, {
        name: data.name,
        avatarUrl: data.avatarUrl || undefined,
        coverUrl: data.coverUrl || undefined,
        bio: data.bio,
        headline: data.headline || undefined,
        phoneNumber,
        websiteUrl: data.websiteUrl || undefined,
        twitterUrl: data.twitterUrl || undefined,
        linkedinUrl: data.linkedinUrl || undefined,
      })

      if (result) {
        toast({
          title: isAr ? "تم تحديث الملف الشخصي" : "Profile updated",
          description: isAr ? "تم حفظ التغييرات بنجاح." : "Your changes have been saved successfully.",
        })
        router.refresh()
      } else {
        throw new Error("Failed to update")
      }
    } catch (error) {
      toast({
        title: isAr ? "حدث خطأ" : "Error",
        description: isAr ? "فشل تحديث الملف الشخصي. يرجى المحاولة مرة أخرى." : "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">{isAr ? "بيانات الحساب" : "Account"}</h3>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{isAr ? "البريد الإلكتروني" : "Email"}</FormLabel>
                <FormControl>
                  <Input {...field} disabled />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isAr ? "الدور" : "Role"}</FormLabel>
                  <FormControl>
                    <Input {...field} disabled />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isAr ? "معرّف الحساب" : "Account ID"}</FormLabel>
                  <FormControl>
                    <Input {...field} disabled />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <FormItem>
              <FormLabel>{isAr ? "النقاط" : "Points"}</FormLabel>
              <FormControl>
                <Input value={String(user?.points ?? 0)} readOnly disabled />
              </FormControl>
            </FormItem>
            <FormItem>
              <FormLabel>{isAr ? "المستوى" : "Level"}</FormLabel>
              <FormControl>
                <Input value={String(user?.level ?? 1)} readOnly disabled />
              </FormControl>
            </FormItem>
            <FormItem>
              <FormLabel>{isAr ? "الحالة" : "Status"}</FormLabel>
              <FormControl>
                <Input value={(user?.isActive ?? true) ? (isAr ? "نشط" : "Active") : (isAr ? "غير نشط" : "Inactive")} readOnly disabled />
              </FormControl>
            </FormItem>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">{isAr ? "الملف الشخصي" : "Profile"}</h3>
          
          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="avatarUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isAr ? "الصورة الشخصية" : "Profile Picture"}</FormLabel>
                  <FormControl>
                    <ImageUpload 
                      value={field.value || ""} 
                      onChange={field.onChange}
                      shape="round"
                      aspect={1}
                      label={isAr ? "تحميل صورة" : "Upload Image"}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="coverUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isAr ? "صورة الغلاف" : "Cover Image"}</FormLabel>
                  <FormControl>
                    <ImageUpload 
                      value={field.value || ""} 
                      onChange={field.onChange}
                      shape="rect"
                      aspect={16/9}
                      label={isAr ? "تحميل غلاف" : "Upload Cover"}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{isAr ? "الاسم" : "Name"}</FormLabel>
              <FormControl>
                <Input placeholder={isAr ? "اسمك" : "Your name"} {...field} />
              </FormControl>
              <FormDescription>
                {isAr ? "هذا هو الاسم الذي سيظهر للآخرين." : "This is your public display name."}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Removed old avatarUrl field */}
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{isAr ? "نبذة تعريفية" : "Bio"}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={isAr ? "اكتب قليلاً عن نفسك" : "Tell us a little bit about yourself"}
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                {isAr ? "يمكنك كتابة نبذة مختصرة عن خبراتك واهتماماتك." : "You can write a short bio about your experience and interests."}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="headline"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{isAr ? "المسمى" : "Headline"}</FormLabel>
              <FormControl>
                <Input placeholder={isAr ? "مثال: طالب مهتم بتعلم البرمجة" : "e.g. Software learner"} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">{isAr ? "رقم الجوال" : "Phone"}</h3>
          <FormField
            control={form.control}
            name="phoneLocal"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{isAr ? "الجوال (السعودية)" : "Phone (Saudi Arabia)"}</FormLabel>
                <FormControl>
                  <div className="flex">
                    <div className="flex items-center gap-2 rounded-l-md border border-r-0 bg-muted px-3 text-sm">
                      <span aria-hidden>🇸🇦</span>
                      <span dir="ltr">+966</span>
                    </div>
                    <Input
                      {...field}
                      dir="ltr"
                      className="rounded-l-none"
                      placeholder={isAr ? "5XXXXXXXX" : "5XXXXXXXX"}
                    />
                  </div>
                </FormControl>
                <FormDescription>
                  {isAr ? "اكتب الرقم بدون 0 وبدون رمز الدولة (مثال: 5XXXXXXXX)." : "Enter the number without 0 and without the country code (e.g. 5XXXXXXXX)."}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
            <h3 className="text-lg font-medium">{isAr ? "روابط التواصل الاجتماعي" : "Social Links"}</h3>
            <FormField
            control={form.control}
            name="websiteUrl"
            render={({ field }) => (
                <FormItem>
                <FormLabel>{isAr ? "الموقع الإلكتروني" : "Website"}</FormLabel>
                <FormControl>
                    <Input placeholder="https://example.com" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="twitterUrl"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Twitter / X</FormLabel>
                <FormControl>
                    <Input placeholder="https://twitter.com/username" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="linkedinUrl"
            render={({ field }) => (
                <FormItem>
                <FormLabel>LinkedIn</FormLabel>
                <FormControl>
                    <Input placeholder="https://linkedin.com/in/username" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (isAr ? "جاري الحفظ..." : "Saving...") : (isAr ? "حفظ التغييرات" : "Save Changes")}
        </Button>
      </form>
    </Form>
  )
}
