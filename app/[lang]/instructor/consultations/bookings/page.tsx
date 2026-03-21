import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { db } from "@/lib/db"
import { consultationBookings, consultationExperts, consultationSlots } from "@/lib/db/schema"
import { and, desc, eq, isNull, or } from "drizzle-orm"

export default async function InstructorConsultationBookingsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const isAr = lang === "ar"
  const user = await getCurrentUser()
  if (!user) redirect(`/${lang}/auth/login`)

  if (user.role === "admin") redirect(`/${lang}/admin/consultations`)
  if (user.role !== "instructor") redirect(`/${lang}/access-denied`)

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
    })
    .from(consultationBookings)
    .innerJoin(consultationSlots, eq(consultationBookings.slotId, consultationSlots.id))
    .innerJoin(consultationExperts, eq(consultationBookings.expertId, consultationExperts.id))
    .where(or(eq(consultationBookings.assignedUserId, user.id), and(isNull(consultationBookings.assignedUserId), eq(consultationExperts.userId, user.id))))
    .orderBy(desc(consultationBookings.createdAt))
    .limit(300)

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
                <TableHead>{isAr ? "الاسم" : "Name"}</TableHead>
                <TableHead>{isAr ? "التاريخ/الوقت" : "Date/Time"}</TableHead>
                <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.requesterName}</TableCell>
                  <TableCell dir="ltr" className="tabular-nums">
                    {new Date(b.slotStartAt).toLocaleString(isAr ? "ar-SA" : "en-US")}
                  </TableCell>
                  <TableCell>{b.status}</TableCell>
                </TableRow>
              ))}
              {bookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
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
