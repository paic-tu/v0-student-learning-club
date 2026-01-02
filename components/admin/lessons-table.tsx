"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/admin/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Pencil, Copy, Trash2 } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

type Lesson = {
  id: number
  titleEn: string
  titleAr: string | null
  slug: string
  courseId: number
  courseTitleEn: string | null
  status: string
  contentType: string
  orderIndex: number
  duration: number | null
  freePreview: boolean
  updatedAt: Date
}

const columns: ColumnDef<Lesson>[] = [
  {
    accessorKey: "titleEn",
    header: "Title",
    cell: ({ row }) => (
      <div className="max-w-[300px]">
        <div className="font-medium">{row.original.titleEn}</div>
        <div className="text-sm text-muted-foreground">{row.original.slug}</div>
      </div>
    ),
  },
  {
    accessorKey: "courseTitleEn",
    header: "Course",
    cell: ({ row }) => <div className="max-w-[200px] truncate">{row.original.courseTitleEn || "N/A"}</div>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status
      return (
        <Badge variant={status === "published" ? "default" : "secondary"}>
          {status === "published" ? "Published" : "Draft"}
        </Badge>
      )
    },
  },
  {
    accessorKey: "contentType",
    header: "Type",
    cell: ({ row }) => {
      const type = row.original.contentType
      return <Badge variant="outline">{type.charAt(0).toUpperCase() + type.slice(1)}</Badge>
    },
  },
  {
    accessorKey: "orderIndex",
    header: "Order",
    cell: ({ row }) => <div className="text-center">{row.original.orderIndex}</div>,
  },
  {
    accessorKey: "duration",
    header: "Duration",
    cell: ({ row }) => <div>{row.original.duration ? `${row.original.duration} min` : "N/A"}</div>,
  },
  {
    accessorKey: "updatedAt",
    header: "Updated",
    cell: ({ row }) => format(row.original.updatedAt, "MMM d, yyyy"),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const lesson = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={`/admin/lessons/${lesson.id}`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

export function LessonsTable({ data }: { data: Lesson[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="titleEn"
      searchPlaceholder="Search lessons..."
      filters={[
        {
          column: "status",
          title: "Status",
          options: [
            { label: "Published", value: "published" },
            { label: "Draft", value: "draft" },
          ],
        },
        {
          column: "contentType",
          title: "Type",
          options: [
            { label: "Video", value: "video" },
            { label: "Article", value: "article" },
            { label: "Quiz", value: "quiz" },
            { label: "Assignment", value: "assignment" },
          ],
        },
      ]}
    />
  )
}
