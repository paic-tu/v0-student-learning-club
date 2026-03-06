import { requirePermission } from "@/lib/rbac/require-permission"
import { neon } from "@neondatabase/serverless"
import { notFound, redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { UserEditForm } from "@/components/admin/user-edit-form"

const sql = neon(process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL!)

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  if (id === "new") {
    redirect("/admin/users/new")
  }

  await requirePermission("users:read")

  let userId: string = id
  
  // Basic UUID validation could be added here if needed
  if (!userId || userId.length < 10) { 
    notFound()
  }

  const users = await sql`
    SELECT * FROM users WHERE id = ${userId} LIMIT 1
  `

  if (users.length === 0) {
    notFound()
  }

  const user = users[0]

  // Get user stats
  const stats = await sql`
    SELECT 
      (SELECT COUNT(*) FROM enrollments WHERE user_id = ${userId}) as enrollment_count,
      (SELECT COUNT(*) FROM orders WHERE user_id = ${userId}) as order_count,
      (SELECT COUNT(*) FROM certificates WHERE user_id = ${userId} AND status = 'issued') as certificate_count,
      (SELECT COUNT(*) FROM challenge_submissions WHERE user_id = ${userId} AND is_passed = true) as challenge_count
  `

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/users">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{user.name}</h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
        <Badge variant={user.role === "admin" ? "default" : "secondary"} className="ml-auto">
          {user.role}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Enrollments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats[0]?.enrollment_count || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats[0]?.order_count || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Certificates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats[0]?.certificate_count || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Challenges Solved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats[0]?.challenge_count || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
        </CardHeader>
        <CardContent>
          <UserEditForm user={user} />
        </CardContent>
      </Card>
    </div>
  )
}
