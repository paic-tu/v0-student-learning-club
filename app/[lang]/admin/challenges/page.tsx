import { requirePermission } from "@/lib/rbac/require-permission"
import { db } from "@/lib/db"
import { challenges, categories, challengeSubmissions } from "@/lib/db/schema"
import { desc, sql, eq } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export default async function ChallengesManagementPage(props: { params: Promise<{ lang: string }> }) {
  const params = await props.params
  const { lang } = params
  await requirePermission("challenges:read")

  const challengesData = await db.query.challenges.findMany({
    with: {
      category: true
    },
    orderBy: [desc(challenges.createdAt)]
  })

  const submissionCounts = await db.select({
    challengeId: challengeSubmissions.challengeId,
    count: sql<number>`count(*)`
  })
  .from(challengeSubmissions)
  .groupBy(challengeSubmissions.challengeId)

  const countsMap = new Map(submissionCounts.map(c => [c.challengeId, c.count]))

  const challengesWithCounts = challengesData.map(c => ({
    ...c,
    submissionCount: Number(countsMap.get(c.id) || 0)
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Challenges</h1>
          <p className="text-muted-foreground">Manage coding challenges and problems</p>
        </div>
        <Button asChild>
          <Link href={`/${lang}/admin/challenges/new`}>
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
          <CardTitle>All Challenges ({challengesWithCounts.length})</CardTitle>
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
              {challengesWithCounts.map((challenge) => (
                <TableRow key={challenge.id}>
                  <TableCell className="font-medium">{challenge.id}</TableCell>
                  <TableCell>{challenge.titleEn}</TableCell>
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
                  <TableCell>{challenge.submissionCount}</TableCell>
                  <TableCell>
                    <Badge variant={challenge.isActive ? "default" : "secondary"}>
                      {challenge.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/${lang}/admin/challenges/${challenge.id}`}>Edit</Link>
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
