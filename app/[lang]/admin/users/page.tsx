import { requirePermission } from "@/lib/rbac/require-permission"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { desc } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export default async function UsersManagementPage(props: { params: Promise<{ lang: string }> }) {
  const params = await props.params
  const { lang } = params
  await requirePermission("users:read")

  const usersData = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      points: users.points,
      level: users.level,
      created_at: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(100)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Users & Roles</h1>
          <p className="text-muted-foreground">Manage user accounts and permissions</p>
        </div>
        <Button asChild>
          <Link href={`/${lang}/admin/users/new`}>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search users..." className="pl-9" />
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
          <CardTitle>All Users ({usersData.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersData.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.id}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role}</Badge>
                  </TableCell>
                  <TableCell>{user.points}</TableCell>
                  <TableCell>{user.level}</TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/${lang}/admin/users/${user.id}`}>Edit</Link>
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
