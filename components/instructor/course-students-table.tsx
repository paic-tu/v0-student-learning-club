"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search } from "lucide-react"

interface CourseStudentsTableProps {
  lang: string
  enrollments: any[]
}

export function CourseStudentsTable({ lang, enrollments }: CourseStudentsTableProps) {
  const isAr = lang === "ar"
  const [searchTerm, setSearchTerm] = useState("")

  const filteredEnrollments = enrollments.filter(
    (enrollment) =>
      enrollment.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enrollment.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(enrollment.user.phoneNumber || enrollment.user.phone || "").toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isAr ? "الطلاب المسجلين" : "Enrolled Students"}</CardTitle>
        <CardDescription>
          {isAr ? `${enrollments.length} طالب مسجّل بهذه الدورة` : `${enrollments.length} students enrolled in this course`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center mb-4">
          <Search className="w-4 h-4 mr-2 text-muted-foreground" />
          <Input
            placeholder={isAr ? "بحث عن طالب..." : "Search students..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">{isAr ? "الصورة" : "Avatar"}</TableHead>
                <TableHead>{isAr ? "الاسم" : "Name"}</TableHead>
                <TableHead>{isAr ? "البريد الإلكتروني" : "Email"}</TableHead>
                <TableHead>{isAr ? "رقم الجوال" : "Phone"}</TableHead>
                <TableHead>{isAr ? "تاريخ التسجيل" : "Joined Date"}</TableHead>
                <TableHead>{isAr ? "التقدم" : "Progress"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEnrollments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {isAr ? "لا يوجد طلاب" : "No students found"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredEnrollments.map((enrollment) => (
                  <TableRow key={enrollment.id}>
                    <TableCell>
                      <Avatar>
                        <AvatarImage src={enrollment.user.avatarUrl} />
                        <AvatarFallback>{enrollment.user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">{enrollment.user.name}</TableCell>
                    <TableCell>{enrollment.user.email}</TableCell>
                    <TableCell>{enrollment.user.phoneNumber || enrollment.user.phone || "-"}</TableCell>
                    <TableCell>{new Date(enrollment.createdAt).toLocaleDateString(isAr ? "ar-EG" : "en-US")}</TableCell>
                    <TableCell>
                      <Badge variant={enrollment.progress === 100 ? "default" : "secondary"}>{enrollment.progress}%</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
