import { requirePermission } from "@/lib/rbac/require-permission"
import { db } from "@/lib/db"
import { challenges, contests } from "@/lib/db/schema"
import { desc, eq } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Bug, Plus, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export default async function ContestsManagementPage(props: { params: Promise<{ lang: string }> }) {
  const params = await props.params
  const { lang } = params
  const isAr = lang === "ar"
  await requirePermission("contests:read")

  const contestsData = await db.query.contests.findMany({
    orderBy: [desc(contests.startDate)]
  })

  const codingChallenges = await db.query.challenges.findMany({
    where: eq(challenges.type, "coding"),
    orderBy: [desc(challenges.createdAt)],
    limit: 100,
  })

  const findBugChallenges = codingChallenges.filter((c: any) => {
    const tc = c.testCases as any
    return tc && typeof tc === "object" && tc.format === "find_bug_python"
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{isAr ? "المسابقات" : "Contests"}</h1>
          <p className="text-muted-foreground">{isAr ? "إدارة مسابقات البرمجة" : "Manage coding competitions"}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" asChild>
            <Link href={`/${lang}/admin/contests/new?mode=find-bug`}>
              <Bug className="mr-2 h-4 w-4" />
              {isAr ? "إنشاء تحدي اكتشف الخطأ" : "Create Find the Bug"}
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/${lang}/admin/contests/new`}>
              <Plus className="mr-2 h-4 w-4" />
              {isAr ? "إنشاء مسابقة" : "Create Contest"}
            </Link>
          </Button>
        </div>
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

      <Card>
        <CardHeader>
          <CardTitle>{isAr ? `تحديات اكتشف الخطأ (${findBugChallenges.length})` : `Find the Bug Challenges (${findBugChallenges.length})`}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>{isAr ? "العنوان" : "Title"}</TableHead>
                <TableHead>{isAr ? "البدء" : "Start"}</TableHead>
                <TableHead>{isAr ? "الانتهاء" : "End"}</TableHead>
                <TableHead>{isAr ? "وقت التسليم" : "Time Limit"}</TableHead>
                <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                <TableHead>{isAr ? "روابط" : "Links"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {findBugChallenges.map((challenge: any) => {
                const tc = (challenge.testCases || {}) as any
                const start = tc?.startAt ? new Date(tc.startAt).toLocaleString() : "-"
                const end = tc?.endAt ? new Date(tc.endAt).toLocaleString() : "-"
                const timeLimit = typeof challenge.timeLimit === "number" ? `${challenge.timeLimit} min` : "-"
                return (
                  <TableRow key={challenge.id}>
                    <TableCell className="font-medium">{challenge.id}</TableCell>
                    <TableCell>{isAr ? challenge.titleAr : challenge.titleEn}</TableCell>
                    <TableCell>{start}</TableCell>
                    <TableCell>{end}</TableCell>
                    <TableCell>{timeLimit}</TableCell>
                    <TableCell>
                      <Badge variant={challenge.isActive ? "default" : "secondary"}>{challenge.isActive ? (isAr ? "مفعل" : "Active") : (isAr ? "غير مفعل" : "Inactive")}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/${lang}/challenges/${challenge.id}`} target="_blank">
                            {isAr ? "عرض" : "View"}
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/${lang}/admin/challenges/${challenge.id}`}>
                            {isAr ? "تعديل" : "Edit"}
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
