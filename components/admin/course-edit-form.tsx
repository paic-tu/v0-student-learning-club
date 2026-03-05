"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Plus, X } from "lucide-react"
import { StringListInput } from "@/components/ui/string-list-input"

export function CourseEditForm({
  course,
  categories,
  instructors,
}: { course: any; categories: any[]; instructors: any[] }) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  
  // JSON array fields
  const [requirements, setRequirements] = useState<string[]>(Array.isArray(course.requirements) ? course.requirements : [])
  const [learningOutcomes, setLearningOutcomes] = useState<string[]>(Array.isArray(course.learning_outcomes) ? course.learning_outcomes : [])
  const [tags, setTags] = useState<string[]>(Array.isArray(course.tags) ? course.tags : [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      const durationStr = (formData.get("duration") as string) || ""
      const priceStr = (formData.get("price") as string) || ""
      const duration =
        durationStr.trim() === "" ? undefined : Number.parseInt(durationStr, 10)
      const price =
        priceStr.trim() === "" ? undefined : Number.parseFloat(priceStr)

      const data = {
        title_en: formData.get("title_en"),
        title_ar: formData.get("title_ar"),
        subtitle_en: formData.get("subtitle_en"),
        subtitle_ar: formData.get("subtitle_ar"),
        description_en: formData.get("description_en"),
        description_ar: formData.get("description_ar"),
        language: formData.get("language"),
        requirements: requirements,
        learning_outcomes: learningOutcomes,
        tags: tags,
        instructor_id: formData.get("instructor_id") as string,
        category_id: formData.get("category_id") as string || null,
        difficulty: formData.get("difficulty"),
        duration,
        price,
        is_free: formData.get("is_free") === "on",
        is_published: formData.get("is_published") === "on",
        thumbnail_url: formData.get("thumbnail_url") || null,
        video_url: formData.get("video_url") || null,
      }

      const response = await fetch(`/api/admin/courses/${course.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error("Failed to update course")

      toast({
        title: "Success",
        description: "Course updated successfully",
      })

      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update course",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title_en">Title (English)</Label>
          <Input id="title_en" name="title_en" defaultValue={course.title_en} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="title_ar">Title (Arabic)</Label>
          <Input id="title_ar" name="title_ar" defaultValue={course.title_ar} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="subtitle_en">Subtitle (English)</Label>
          <Input id="subtitle_en" name="subtitle_en" defaultValue={course.subtitle_en || ""} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="subtitle_ar">Subtitle (Arabic)</Label>
          <Input id="subtitle_ar" name="subtitle_ar" defaultValue={course.subtitle_ar || ""} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="instructor_id">Instructor</Label>
          <Select name="instructor_id" defaultValue={course.instructor_id.toString()}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {instructors.map((instructor: any) => (
                <SelectItem key={instructor.id} value={instructor.id.toString()}>
                  {instructor.name} ({instructor.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category_id">Category</Label>
          <Select name="category_id" defaultValue={course.category_id?.toString() || ""}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category: any) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name_en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="difficulty">Difficulty</Label>
          <Select name="difficulty" defaultValue={course.difficulty}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="language">Language</Label>
          <Select name="language" defaultValue={course.language || "ar"}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ar">Arabic</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration">Duration (minutes)</Label>
          <Input id="duration" name="duration" type="number" defaultValue={course.duration} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Price ($)</Label>
          <Input id="price" name="price" type="number" step="0.01" defaultValue={course.price} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description_en">Description (English)</Label>
        <Textarea id="description_en" name="description_en" defaultValue={course.description_en} rows={4} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description_ar">Description (Arabic)</Label>
        <Textarea id="description_ar" name="description_ar" defaultValue={course.description_ar} rows={4} required />
      </div>

      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-lg font-semibold">Course Details</h3>
        <div className="grid gap-6">
          <div className="space-y-2">
            <Label>Requirements</Label>
            <StringListInput 
              value={requirements} 
              onChange={setRequirements} 
              placeholder="Add requirement..."
            />
          </div>

          <div className="space-y-2">
            <Label>Learning Outcomes</Label>
            <StringListInput 
              value={learningOutcomes} 
              onChange={setLearningOutcomes} 
              placeholder="Add learning outcome..."
            />
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <StringListInput 
              value={tags} 
              onChange={setTags} 
              placeholder="Add tag..."
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-lg font-semibold">Media</h3>
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="thumbnail_url">Thumbnail URL</Label>
            <Input
              id="thumbnail_url"
              name="thumbnail_url"
              type="url"
              placeholder="https://example.com/thumbnail.jpg"
              defaultValue={course.thumbnail_url || ""}
            />
            <p className="text-xs text-muted-foreground">Course thumbnail image URL</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="video_url">Video URL</Label>
            <Input
              id="video_url"
              name="video_url"
              type="url"
              placeholder="https://youtube.com/watch?v=..."
              defaultValue={course.video_url || ""}
            />
            <p className="text-xs text-muted-foreground">Course introduction or trailer video URL</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
          <Switch id="is_free" name="is_free" defaultChecked={course.is_free} />
          <Label htmlFor="is_free">Free Course</Label>
        </div>

        <div className="flex items-center gap-2">
          <Switch id="is_published" name="is_published" defaultChecked={course.is_published} />
          <Label htmlFor="is_published">Published</Label>
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
