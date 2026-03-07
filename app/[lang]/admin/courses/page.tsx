import { requirePermission } from "@/lib/rbac/require-permission"
import { db } from "@/lib/db"
import { courses, users, categories, lessons, enrollments } from "@/lib/db/schema"
import { eq, desc, sql } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export default async function CoursesManagementPage(props: { params: Promise<{ lang: string }> }) {
  const params = await props.params
  const { lang } = params
  await requirePermission("courses:read")

  const coursesData = await db
    .select({
      id: courses.id,
      title_en: courses.titleEn,
      thumbnail_url: courses.thumbnailUrl,
      instructor_name: users.name,
      category_name: categories.nameEn,
      is_published: courses.isPublished,
      created_at: courses.createdAt,
      lesson_count: sql<number>`(SELECT COUNT(*) FROM ${lessons} WHERE ${lessons.courseId} = ${courses.id})`,
      enrollment_count: sql<number>`(SELECT COUNT(*) FROM ${enrollments} WHERE ${enrollments.courseId} = ${courses.id})`,
    })
    .from(courses)
    .innerJoin(users, eq(courses.instructorId, users.id))
    .leftJoin(categories, eq(courses.categoryId, categories.id))
    .orderBy(desc(courses.createdAt))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Courses</h1>
          <p className="text-muted-foreground">Manage courses and curriculum</p>
        </div>
        <Button asChild>
          <Link href={`/${lang}/admin/courses/new`}>
            <Plus className="mr-2 h-4 w-4" />
            Create Course
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search courses..." className="pl-9" />
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Courses ({coursesData.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Title (EN)</TableHead>
                <TableHead>Instructor</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Lessons</TableHead>
                <TableHead>Enrollments</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coursesData.map((course) => (
                <TableRow key={course.id}>
                  <TableCell>
                    <div className="relative h-10 w-16 overflow-hidden rounded bg-muted">
                      {course.thumbnail_url ? (
                        <img
                          src={course.thumbnail_url}
                          alt={course.title_en || "Course"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-secondary text-[10px] text-muted-foreground">
                          No Img
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{course.id}</TableCell>
                  <TableCell>{course.title_en}</TableCell>
                  <TableCell>{course.instructor_name}</TableCell>
                  <TableCell>{course.category_name || "None"}</TableCell>
                  <TableCell>{Number(course.lesson_count)}</TableCell>
                  <TableCell>{Number(course.enrollment_count)}</TableCell>
                  <TableCell>
                    <Badge variant={course.is_published ? "default" : "secondary"}>
                      {course.is_published ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/${lang}/admin/courses/${course.id}`}>Edit</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
