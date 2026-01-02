"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, GripVertical } from "lucide-react"
import Link from "next/link"

export function LessonsList({ lessons, courseId }: { lessons: any[]; courseId: number }) {
  if (lessons.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">No lessons yet. Create your first lesson to get started.</p>
    )
  }

  return (
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
        {lessons.map((lesson: any) => (
          <TableRow key={lesson.id}>
            <TableCell>
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
            </TableCell>
            <TableCell className="font-medium">{lesson.order_index}</TableCell>
            <TableCell>{lesson.title_en}</TableCell>
            <TableCell>{lesson.duration} min</TableCell>
            <TableCell>{lesson.is_preview && <Badge variant="secondary">Preview</Badge>}</TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/admin/courses/${courseId}/lessons/${lesson.id}`}>
                    <Edit className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="ghost" size="sm">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
