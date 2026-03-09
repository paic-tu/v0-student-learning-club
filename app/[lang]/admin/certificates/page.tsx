import { requirePermission } from "@/lib/rbac/require-permission"
import { db } from "@/lib/db"
import { certificates, users, courses } from "@/lib/db/schema"
import { eq, desc, count } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Award, Clock } from "lucide-react"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { approveCertificateAction } from "@/lib/actions/certificate"
import { format } from "date-fns"
import { arSA, enUS } from "date-fns/locale"

export default async function CertificatesManagementPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
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
          titleEn: true,
          titleAr: true
        }
      }
    },
    orderBy: [desc(certificates.issuedAt)],
    limit: 100
  })

  const [issuedStats, revokedStats, pendingStats] = await Promise.all([
    db.select({ count: count() }).from(certificates).where(eq(certificates.status, 'issued')),
    db.select({ count: count() }).from(certificates).where(eq(certificates.status, 'revoked')),
    db.select({ count: count() }).from(certificates).where(eq(certificates.status, 'pending'))
  ])

  // Flatten for display
  const certificatesList = certificatesData.map(cert => ({
    ...cert,
    user_name: cert.user?.name,
    user_email: cert.user?.email,
    course_title: lang === 'ar' ? (cert.course?.titleAr || cert.course?.titleEn) : cert.course?.titleEn
  }))

  const isAr = lang === "ar"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{isAr ? "الشهادات" : "Certificates"}</h1>
        <p className="text-muted-foreground">{isAr ? "إدارة واعتماد الشهادات" : "Manage and verify certificates"}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{isAr ? "الشهادات المعتمدة" : "Issued Certificates"}</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{issuedStats[0]?.count || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{isAr ? "طلبات معلقة" : "Pending Requests"}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingStats[0]?.count || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{isAr ? "الشهادات الملغاة" : "Revoked Certificates"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{revokedStats[0]?.count || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground ${isAr ? 'right-3' : 'left-3'}`} />
            <Input 
              placeholder={isAr ? "البحث برقم الشهادة أو المستخدم..." : "Search by certificate number or user..."} 
              className={isAr ? "pr-9" : "pl-9"} 
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{isAr ? `جميع الشهادات (${certificatesList.length})` : `All Certificates (${certificatesList.length})`}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isAr ? "رقم الشهادة" : "Certificate #"}</TableHead>
                <TableHead>{isAr ? "المستخدم" : "User"}</TableHead>
                <TableHead>{isAr ? "الدورة" : "Course"}</TableHead>
                <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                <TableHead>{isAr ? "تاريخ الإصدار" : "Issued Date"}</TableHead>
                <TableHead>{isAr ? "إجراءات" : "Actions"}</TableHead>
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
                  <TableCell>{cert.course_title}</TableCell>
                  <TableCell>
                    <Badge variant={cert.status === "issued" ? "default" : cert.status === "pending" ? "secondary" : "destructive"}>
                      {cert.status === "issued" ? (isAr ? "معتمدة" : "Issued") : cert.status === "pending" ? (isAr ? "قيد الانتظار" : "Pending") : (isAr ? "ملغاة" : "Revoked")}
                    </Badge>
                  </TableCell>
                  <TableCell dir="ltr" className={isAr ? "text-right" : ""}>
                    {cert.issued_at ? format(new Date(cert.issued_at), "dd/MM/yyyy", { locale: isAr ? arSA : enUS }) : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/${lang}/verify?cert=${cert.certificate_number}`} target="_blank">
                          {isAr ? "عرض" : "View"}
                        </Link>
                      </Button>
                      {cert.status === 'pending' && (
                        <form action={async () => {
                          "use server"
                          await approveCertificateAction(cert.id)
                        }}>
                          <Button size="sm" variant="default">{isAr ? "اعتماد" : "Approve"}</Button>
                        </form>
                      )}
                    </div>
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
