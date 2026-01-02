import { requirePermission } from "@/lib/rbac/require-permission"
import { neon } from "@neondatabase/serverless"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import Link from "next/link"

const sql = neon(process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL!)

export default async function ContestsManagementPage() {
  await requirePermission("contests:read")

  const contests = await sql`
    SELECT * FROM contests
    ORDER BY start_date DESC
  `

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contests</h1>
          <p className="text-muted-foreground">Manage coding competitions</p>
        </div>
        <Button asChild>
          <Link href="/admin/contests/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Contest
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search contests..." className="pl-9" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Contests ({contests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Title (EN)</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Participants</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contests.map((contest: any) => (
                <TableRow key={contest.id}>
                  <TableCell className="font-medium">{contest.id}</TableCell>
                  <TableCell>{contest.title_en}</TableCell>
                  <TableCell>{new Date(contest.start_date).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(contest.end_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {contest.participant_count} / {contest.max_participants || "∞"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        contest.status === "active"
                          ? "default"
                          : contest.status === "completed"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {contest.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/contests/${contest.id}`}>Edit</Link>
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
