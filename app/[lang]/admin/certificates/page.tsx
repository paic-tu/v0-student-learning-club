import { requirePermission } from "@/lib/rbac/require-permission"
import { db } from "@/lib/db"
import { certificates, users, courses } from "@/lib/db/schema"
import { eq, desc, count } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Award } from "lucide-react"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export default async function CertificatesManagementPage() {
  await requirePermission("certificates:read")

  const certificatesData = await db.query.certificates.findMany({
    with: {
      user: {
        columns: {
          name: true,
          email: true
        }
      },
      course: {
        columns: {
          titleEn: true
        }
      }
    },
    orderBy: [desc(certificates.issuedAt)],
    limit: 100
  })

  const [issuedStats, revokedStats] = await Promise.all([
    db.select({ count: count() }).from(certificates).where(eq(certificates.status, 'issued')),
    db.select({ count: count() }).from(certificates).where(eq(certificates.status, 'revoked'))
  ])

  // Flatten for display
  const certificatesList = certificatesData.map(cert => ({
    ...cert,
    user_name: cert.user?.name,
    user_email: cert.user?.email,
    course_title: cert.course?.titleEn
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Certificates</h1>
        <p className="text-muted-foreground">Manage and verify certificates</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Issued Certificates</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{issuedStats[0]?.count || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Revoked Certificates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{revokedStats[0]?.count || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by certificate number or user..." className="pl-9" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Certificates ({certificatesList.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Certificate #</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>For</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {certificatesList.map((cert: any) => (
                <TableRow key={cert.id}>
                  <TableCell className="font-mono text-sm">{cert.certificate_number}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{cert.user_name}</p>
                      <p className="text-sm text-muted-foreground">{cert.user_email}</p>
                    </div>
                  </TableCell>
                  <TableCell>{cert.title_en}</TableCell>
                  <TableCell>{cert.course_title}</TableCell>
                  <TableCell>
                    <Badge variant={cert.status === "issued" ? "default" : "destructive"}>{cert.status}</Badge>
                  </TableCell>
                  <TableCell>{new Date(cert.issued_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/verify?cert=${cert.certificate_number}`} target="_blank">
                        View
                      </Link>
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
