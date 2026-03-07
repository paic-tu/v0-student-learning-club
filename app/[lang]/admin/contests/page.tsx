import { requirePermission } from "@/lib/rbac/require-permission"
import { db } from "@/lib/db"
import { contests } from "@/lib/db/schema"
import { desc } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export default async function ContestsManagementPage(props: { params: Promise<{ lang: string }> }) {
  const params = await props.params
  const { lang } = params
  await requirePermission("contests:read")

  const contestsData = await db.query.contests.findMany({
    orderBy: [desc(contests.startDate)]
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contests</h1>
          <p className="text-muted-foreground">Manage coding competitions</p>
        </div>
        <Button asChild>
          <Link href={`/${lang}/admin/contests/new`}>
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
          <CardTitle>All Contests ({contestsData.length})</CardTitle>
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
              {contestsData.map((contest) => (
                <TableRow key={contest.id}>
                  <TableCell className="font-medium">{contest.id}</TableCell>
                  <TableCell>{contest.titleEn}</TableCell>
                  <TableCell>{new Date(contest.startDate).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(contest.endDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {contest.participantCount} / {contest.maxParticipants || "∞"}
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
                      <Link href={`/${lang}/admin/contests/${contest.id}`}>Edit</Link>
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
