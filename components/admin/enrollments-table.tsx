"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Search, MoreHorizontal, Eye, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { toast } from "sonner"

interface Enrollment {
  id: number
  user_id: number
  course_id: number
  user_name: string
  user_email: string
  course_title_en: string
  course_title_ar: string
  status: string
  progress: number
  created_at: string
}

interface EnrollmentsTableProps {
  enrollments: any[]
}

export function EnrollmentsTable({ enrollments: initialEnrollments }: EnrollmentsTableProps) {
  const router = useRouter()
  const [enrollments, setEnrollments] = useState<Enrollment[]>(initialEnrollments)
  const [search, setSearch] = useState("")

  const filteredEnrollments = enrollments.filter(
    (enrollment) =>
      enrollment.user_name.toLowerCase().includes(search.toLowerCase()) ||
      enrollment.user_email.toLowerCase().includes(search.toLowerCase()) ||
      enrollment.course_title_en.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this enrollment?")) return

    try {
      const res = await fetch(`/api/admin/enrollments/${id}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("Failed to delete enrollment")

      setEnrollments(enrollments.filter((e) => e.id !== id))
      toast.success("Enrollment deleted successfully")
    } catch (error) {
      toast.error("Failed to delete enrollment")
    }
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users or courses..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Enrolled At</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEnrollments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No enrollments found.
                </TableCell>
              </TableRow>
            ) : (
              filteredEnrollments.map((enrollment) => (
                <TableRow key={enrollment.id}>
                  <TableCell>
                    <div className="font-medium">{enrollment.user_name}</div>
                    <div className="text-xs text-muted-foreground">{enrollment.user_email}</div>
                  </TableCell>
                  <TableCell>{enrollment.course_title_en}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        enrollment.status === "completed"
                          ? "default"
                          : enrollment.status === "dropped"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {enrollment.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={enrollment.progress} className="w-[60px]" />
                      <span className="text-xs text-muted-foreground">{enrollment.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(enrollment.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
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
                            <Link href={`/admin/users/${enrollment.user_id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View User
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDelete(enrollment.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
