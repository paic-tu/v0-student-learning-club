import { requirePermission } from "@/lib/rbac/require-permission"
import { db } from "@/lib/db"
import { consultationBookings, consultationExperts, consultationSlots } from "@/lib/db/schema"
import { desc, eq } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default async function AdminConsultationBookingsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const isAr = lang === "ar"
  await requirePermission("consultations:read")

  const bookings = await db
    .select({
      id: consultationBookings.id,
      status: consultationBookings.status,
      requesterName: consultationBookings.requesterName,
      requesterEmail: consultationBookings.requesterEmail,
      requesterPhone: consultationBookings.requesterPhone,
      notes: consultationBookings.notes,
      createdAt: consultationBookings.createdAt,
      expertNameEn: consultationExperts.nameEn,
      expertNameAr: consultationExperts.nameAr,
      slotStartAt: consultationSlots.startAt,
      slotEndAt: consultationSlots.endAt,
      expertUserId: consultationExperts.userId,
    })
    .from(consultationBookings)
    .innerJoin(consultationSlots, eq(consultationBookings.slotId, consultationSlots.id))
    .innerJoin(consultationExperts, eq(consultationBookings.expertId, consultationExperts.id))
    .orderBy(desc(consultationBookings.createdAt))
    .limit(500)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{isAr ? "حجوزات الاستشارات" : "Consultation Bookings"}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isAr ? "المستشار" : "Expert"}</TableHead>
                <TableHead>{isAr ? "اسم العميل" : "Requester"}</TableHead>
                <TableHead>{isAr ? "التاريخ/الوقت" : "Date/Time"}</TableHead>
                <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{isAr ? b.expertNameAr : b.expertNameEn}</TableCell>
                  <TableCell>
                    <div className="font-medium">{b.requesterName}</div>
                    <div className="text-xs text-muted-foreground">{b.requesterEmail}</div>
                  </TableCell>
                  <TableCell dir="ltr" className="tabular-nums">
                    {new Date(b.slotStartAt).toLocaleString(isAr ? "ar-SA" : "en-US")}
                  </TableCell>
                  <TableCell>{b.status}</TableCell>
                </TableRow>
              ))}
              {bookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    {isAr ? "لا توجد حجوزات" : "No bookings"}
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

