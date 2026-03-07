"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Trash2, Loader2 } from "lucide-react"
import { deleteQuizAction } from "@/lib/actions/challenge"
import { useToast } from "@/hooks/use-toast"

interface DeleteQuizButtonProps {
  quizId: string
  isAr: boolean
}

export function DeleteQuizButton({ quizId, isAr }: DeleteQuizButtonProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    setIsDeleting(true)
    try {
      const result = await deleteQuizAction(quizId)
      
      if (result.error) {
        toast({
          title: isAr ? "خطأ" : "Error",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: isAr ? "تم بنجاح" : "Success",
          description: isAr ? "تم حذف الكويز بنجاح" : "Quiz deleted successfully",
        })
        router.refresh()
      }
    } catch (error) {
      toast({
        title: isAr ? "خطأ" : "Error",
        description: isAr ? "حدث خطأ غير متوقع" : "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="icon">
          {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{isAr ? "هل أنت متأكد؟" : "Are you sure?"}</AlertDialogTitle>
          <AlertDialogDescription>
            {isAr 
              ? "لا يمكن التراجع عن هذا الإجراء. سيتم حذف الكويز وجميع نتائجه بشكل دائم." 
              : "This action cannot be undone. This will permanently delete the quiz and all associated results."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{isAr ? "إلغاء" : "Cancel"}</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {isAr ? "حذف" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
