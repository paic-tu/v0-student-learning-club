"use client"

import { useState } from "react"
import { Bookmark } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toggleCourseBookmark } from "@/app/actions/bookmark"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/lib/language-context"

interface BookmarkButtonProps {
  courseId: string
  initialBookmarked: boolean
  className?: string
  variant?: "default" | "outline" | "ghost" | "secondary"
  size?: "default" | "sm" | "lg" | "icon"
  showLabel?: boolean
}

export function BookmarkButton({
  courseId,
  initialBookmarked,
  className,
  variant = "outline",
  size = "icon",
  showLabel = false
}: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked)
  const [isLoading, setIsLoading] = useState(false)
  const { language } = useLanguage()
  const { toast } = useToast()
  const isAr = language === "ar"

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (isLoading) return

    setIsLoading(true)
    
    // Optimistic update
    const previousState = isBookmarked
    setIsBookmarked(!previousState)

    try {
      const result = await toggleCourseBookmark(courseId)
      
      if (result.error) {
        setIsBookmarked(previousState) // Revert on error
        toast({
          variant: "destructive",
          title: isAr ? "خطأ" : "Error",
          description: isAr ? "حدث خطأ أثناء تحديث المفضلة" : "Error updating bookmark"
        })
      } else {
        setIsBookmarked(result.bookmarked!)
        toast({
          title: isAr ? "تمت العملية" : "Success",
          description: result.bookmarked 
            ? (isAr ? "تمت الإضافة للمفضلة" : "Added to bookmarks")
            : (isAr ? "تم الحذف من المفضلة" : "Removed from bookmarks")
        })
      }
    } catch (error) {
      setIsBookmarked(previousState)
      toast({
        variant: "destructive",
        title: isAr ? "خطأ" : "Error",
        description: isAr ? "حدث خطأ غير متوقع" : "Unexpected error occurred"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button 
      variant={variant} 
      size={size} 
      className={className}
      onClick={handleToggle}
      disabled={isLoading}
    >
      <Bookmark 
        className={`h-4 w-4 ${showLabel ? (isAr ? "ml-2" : "mr-2") : ""} ${isBookmarked ? "fill-current" : ""}`} 
      />
      {showLabel && (
        <span>
          {isBookmarked 
            ? (isAr ? "تم الحفظ" : "Saved") 
            : (isAr ? "حفظ" : "Save")}
        </span>
      )}
    </Button>
  )
}
