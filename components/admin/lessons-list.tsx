"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, ArrowUp, ArrowDown } from "lucide-react"
import Link from "next/link"
import { ConfirmDialog } from "@/components/admin/confirm-dialog"
import { useToast } from "@/hooks/use-toast"

export function LessonsList({ lessons, courseId }: { lessons: any[]; courseId: string }) {
  const router = useRouter()
  const { toast } = useToast()
  
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [reordering, setReordering] = useState(false)

  if (lessons.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">No lessons yet. Create your first lesson to get started.</p>
    )
  }

  function openDelete(id: string) {
    setDeleteId(id)
    setDeleteOpen(true)
  }

  async function handleDelete() {
    if (!deleteId) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/lessons/${deleteId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete lesson")
      
      setDeleteOpen(false)
      setDeleteId(null)
      toast({ title: "Lesson deleted" })
      router.refresh()
    } catch (e) {
      toast({ title: "Error", description: "Failed to delete lesson", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  async function handleReorder(index: number, direction: "up" | "down") {
    if (reordering) return
    if (direction === "up" && index === 0) return
    if (direction === "down" && index === lessons.length - 1) return

    setReordering(true)
    const newLessons = [...lessons]
    const targetIndex = direction === "up" ? index - 1 : index + 1
    
    // Swap order indices
    const currentLesson = newLessons[index]
    const targetLesson = newLessons[targetIndex]

    const currentOrder = currentLesson.order_index ?? currentLesson.orderIndex ?? 0
    const targetOrder = targetLesson.order_index ?? targetLesson.orderIndex ?? 0

    const updates = [
      { id: currentLesson.id, orderIndex: targetOrder },
      { id: targetLesson.id, orderIndex: currentOrder },
    ]

    try {
      const res = await fetch("/api/admin/lessons/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: updates }),
      })

      if (!res.ok) throw new Error("Failed to reorder")
      
      router.refresh()
      toast({ title: "Order updated" })
    } catch (e) {
      toast({ title: "Error", description: "Failed to reorder lessons", variant: "destructive" })
    } finally {
      setReordering(false)
    }
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10"></TableHead>
            <TableHead>Order</TableHead>
            <TableHead>Title (EN)</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Preview</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lessons.map((lesson: any, index: number) => (
            <TableRow key={lesson.id}>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6" 
                    disabled={index === 0 || reordering}
                    onClick={() => handleReorder(index, "up")}
                  >
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    disabled={index === lessons.length - 1 || reordering}
                    onClick={() => handleReorder(index, "down")}
                  >
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                </div>
              </TableCell>
              <TableCell className="font-medium">{lesson.order_index}</TableCell>
              <TableCell>{lesson.title_en}</TableCell>
              <TableCell>{lesson.duration_minutes ?? lesson.duration ?? 0} min</TableCell>
              <TableCell>{(lesson.free_preview || lesson.is_preview) && <Badge variant="secondary">Preview</Badge>}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/admin/courses/${courseId}/lessons/${lesson.id}`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openDelete(lesson.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        title="Delete lesson?"
        description="This cannot be undone."
        confirmText="Delete"
        variant="destructive"
      />
    </>
  )
}
