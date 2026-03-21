import { requirePermission } from "@/lib/rbac/require-permission"
import { db } from "@/lib/db"
import { consultationBookings, consultationExperts, consultationSlots } from "@/lib/db/schema"
import { asc, desc, eq, sql } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/admin/page-header"
import { ConsultationsScheduleManager } from "@/components/admin/consultations-schedule-manager"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function AdminConsultationsSchedulePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const isAr = lang === "ar"
  await requirePermission("consultations:write")

  let experts: unknown[] = []
  let slots: unknown[] = []
  let recentBookings: Array<{
    id: string
    requesterName: string
    requesterEmail: string
    status: string
    startAt: Date
    expertNameAr: string
    expertNameEn: string
  }> = []
  try {
    ;[experts, slots, recentBookings] = await Promise.all([
      db
        .select()
        .from(consultationExperts)
        .orderBy(asc(consultationExperts.sortOrder), desc(consultationExperts.createdAt))
        .limit(200),
      db
        .select()
        .from(consultationSlots)
        .orderBy(desc(consultationSlots.startAt))
        .limit(500),
      db
        .select({
          id: consultationBookings.id,
          requesterName: consultationBookings.requesterName,
          requesterEmail: consultationBookings.requesterEmail,
          status: consultationBookings.status,
          startAt: consultationSlots.startAt,
          expertNameAr: consultationExperts.nameAr,
          expertNameEn: consultationExperts.nameEn,
        })
        .from(consultationBookings)
        .innerJoin(consultationSlots, eq(consultationBookings.slotId, consultationSlots.id))
        .innerJoin(consultationExperts, eq(consultationBookings.expertId, consultationExperts.id))
        .orderBy(desc(consultationBookings.createdAt))
        .limit(20),
    ])
  } catch (e) {
    await db.execute(
      sql`ALTER TABLE "consultation_experts" ADD COLUMN IF NOT EXISTS "user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL`,
    )
    ;[experts, slots, recentBookings] = await Promise.all([
      db
        .select()
        .from(consultationExperts)
        .orderBy(asc(consultationExperts.sortOrder), desc(consultationExperts.createdAt))
        .limit(200),
      db
        .select()
        .from(consultationSlots)
        .orderBy(desc(consultationSlots.startAt))
        .limit(500),
      db
        .select({
          id: consultationBookings.id,
          requesterName: consultationBookings.requesterName,
          requesterEmail: consultationBookings.requesterEmail,
          status: consultationBookings.status,
          startAt: consultationSlots.startAt,
          expertNameAr: consultationExperts.nameAr,
          expertNameEn: consultationExperts.nameEn,
        })
        .from(consultationBookings)
        .innerJoin(consultationSlots, eq(consultationBookings.slotId, consultationSlots.id))
        .innerJoin(consultationExperts, eq(consultationBookings.expertId, consultationExperts.id))
        .orderBy(desc(consultationBookings.createdAt))
        .limit(20),
    ])
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isAr ? "إدارة الاستشارات" : "Consultations"}
        description={isAr ? "تحكم ببطاقات المستشارين والمواعيد" : "Manage expert cards and schedules"}
        breadcrumbs={[{ label: "Admin", href: `/${lang}/admin` }, { label: isAr ? "الاستشارات" : "Consultations" }]}
      />

      <Card>
        <CardContent className="p-4">
          <ConsultationsScheduleManager lang={lang} initialExperts={experts as any} initialSlots={slots as any} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>{isAr ? "الحجوزات (آخر 20)" : "Bookings (latest 20)"}</CardTitle>
          </div>
          <Button asChild variant="outline" className="bg-transparent">
            <Link href={`/${lang}/admin/consultations/bookings`}>{isAr ? "عرض الكل" : "View all"}</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isAr ? "المستشار" : "Expert"}</TableHead>
                <TableHead>{isAr ? "الاسم" : "Name"}</TableHead>
                <TableHead>{isAr ? "التاريخ" : "Date"}</TableHead>
                <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentBookings.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{isAr ? b.expertNameAr : b.expertNameEn}</TableCell>
                  <TableCell>
                    <div className="font-medium">{b.requesterName}</div>
                    <div className="text-xs text-muted-foreground">{b.requesterEmail}</div>
                  </TableCell>
                  <TableCell dir="ltr" className="tabular-nums">
                    {new Date(b.startAt).toLocaleString(isAr ? "ar-SA" : "en-US")}
                  </TableCell>
                  <TableCell>{b.status}</TableCell>
                </TableRow>
              ))}
              {recentBookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    {isAr ? "لا توجد حجوزات حتى الآن" : "No bookings yet"}
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
