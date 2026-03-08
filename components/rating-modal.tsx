"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Star, Loader2 } from "lucide-react"
import { submitRating } from "@/lib/actions/rating"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/lib/language-context"
import { cn } from "@/lib/utils"

interface RatingModalProps {
  isOpen: boolean
  onClose: () => void
  courseId: string
  courseTitle: string
}

export function RatingModal({ isOpen, onClose, courseId, courseTitle }: RatingModalProps) {
  const { language } = useLanguage()
  const { toast } = useToast()
  const [courseRating, setCourseRating] = useState(0)
  const [instructorRating, setInstructorRating] = useState(0)
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isAr = language === "ar"

  const handleSubmit = async () => {
    if (courseRating === 0 || instructorRating === 0) {
      toast({
        variant: "destructive",
        title: isAr ? "تنبيه" : "Alert",
        description: isAr ? "يرجى وضع تقييم للدورة والمدرب" : "Please rate both the course and the instructor",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const result = await submitRating({
        courseId,
        rating: courseRating,
        instructorRating,
        comment,
      })

      if (result.error) {
        throw new Error(result.error)
      }

      toast({
        title: isAr ? "شكراً لك!" : "Thank you!",
        description: isAr ? "تم إرسال تقييمك بنجاح" : "Your rating has been submitted successfully",
      })
      onClose()
    } catch (error) {
      toast({
        variant: "destructive",
        title: isAr ? "خطأ" : "Error",
        description: isAr ? "فشل إرسال التقييم" : "Failed to submit rating",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const StarRating = ({ 
    rating, 
    setRating, 
    label 
  }: { 
    rating: number, 
    setRating: (r: number) => void, 
    label: string 
  }) => (
    <div className="space-y-2">
      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        {label}
      </label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={cn(
              "p-1 rounded-md transition-colors hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary",
              rating >= star ? "text-yellow-500" : "text-muted-foreground"
            )}
            onClick={() => setRating(star)}
          >
            <Star className={cn("w-8 h-8", rating >= star && "fill-current")} />
            <span className="sr-only">{star} stars</span>
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isAr ? "قيم تجربتك" : "Rate Your Experience"}</DialogTitle>
          <DialogDescription>
            {isAr 
              ? `كيف كانت تجربتك مع "${courseTitle}"؟`
              : `How was your experience with "${courseTitle}"?`}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <StarRating 
            rating={courseRating} 
            setRating={setCourseRating} 
            label={isAr ? "تقييم الدورة" : "Course Rating"} 
          />
          
          <StarRating 
            rating={instructorRating} 
            setRating={setInstructorRating} 
            label={isAr ? "تقييم المدرب" : "Instructor Rating"} 
          />
          
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">
              {isAr ? "ملاحظات إضافية (اختياري)" : "Additional Comments (Optional)"}
            </label>
            <Textarea 
              value={comment} 
              onChange={(e) => setComment(e.target.value)} 
              placeholder={isAr ? "اكتب تعليقك هنا..." : "Write your comment here..."}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isAr ? "إرسال التقييم" : "Submit Rating"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
