import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { desc, eq } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trophy } from "lucide-react"

export async function SiteLeaderboard({ lang, limit = 10 }: { lang: string; limit?: number }) {
  const isAr = lang === "ar"

  const topUsers = await db.query.users.findMany({
    where: eq(users.role, "student"),
    columns: {
      id: true,
      name: true,
      points: true,
    },
    orderBy: [desc(users.points)],
    limit,
  })

  return (
    <div className="container mx-auto px-4 max-w-6xl" dir={isAr ? "rtl" : "ltr"}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            <span>{isAr ? "لوحة الصدارة" : "Leaderboard"}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isAr ? "الترتيب" : "Rank"}</TableHead>
                <TableHead>{isAr ? "الطالب" : "Student"}</TableHead>
                <TableHead className={isAr ? "text-left" : "text-right"}>{isAr ? "النقاط" : "Points"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topUsers.map((u, idx) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{idx + 1}</TableCell>
                  <TableCell>{u.name}</TableCell>
                  <TableCell className={isAr ? "text-left" : "text-right"}>{u.points}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
