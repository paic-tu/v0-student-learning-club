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

export default async function ChallengesManagementPage() {
  await requirePermission("challenges:read")

  const challenges = await sql`
    SELECT 
      ch.*,
      cat.name_en as category_name,
      (SELECT COUNT(*) FROM challenge_submissions WHERE challenge_id = ch.id) as submission_count
    FROM challenges ch
    LEFT JOIN categories cat ON ch.category_id = cat.id
    ORDER BY ch.created_at DESC
  `

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Challenges</h1>
          <p className="text-muted-foreground">Manage coding challenges and problems</p>
        </div>
        <Button asChild>
          <Link href="/admin/challenges/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Challenge
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search challenges..." className="pl-9" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Challenges ({challenges.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Title (EN)</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Submissions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {challenges.map((challenge: any) => (
                <TableRow key={challenge.id}>
                  <TableCell className="font-medium">{challenge.id}</TableCell>
                  <TableCell>{challenge.title_en}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{challenge.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        challenge.difficulty === "beginner"
                          ? "secondary"
                          : challenge.difficulty === "advanced"
                            ? "destructive"
                            : "default"
                      }
                    >
                      {challenge.difficulty}
                    </Badge>
                  </TableCell>
                  <TableCell>{challenge.points}</TableCell>
                  <TableCell>{challenge.submission_count}</TableCell>
                  <TableCell>
                    <Badge variant={challenge.is_active ? "default" : "secondary"}>
                      {challenge.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/challenges/${challenge.id}`}>Edit</Link>
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
