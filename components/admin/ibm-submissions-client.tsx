"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { 
  FileText, 
  Mail, 
  Calendar, 
  CheckCircle2, 
  Award, 
  Plus, 
  Loader2,
  ExternalLink,
  Download
} from "lucide-react"
import { format } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface IBMSubmission {
  id: string
  fullName: string
  email: string
  phoneNumber: string | null
  completionDate: Date
  certificateUrl: string
  employmentStatus: string | null
  resumeUrl: string | null
  notes: string | null
  issuedCertificateUrl: string | null
  createdAt: Date
}

interface IBMSubmissionsClientProps {
  initialSubmissions: IBMSubmission[]
  lang: string
}

export function IBMSubmissionsClient({ initialSubmissions, lang }: IBMSubmissionsClientProps) {
  const isAr = lang === "ar"
  const locale = isAr ? ar : enUS
  const { toast } = useToast()
  
  const [submissions, setSubmissions] = useState(initialSubmissions)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<IBMSubmission | null>(null)
  const [newCertUrl, setNewCertUrl] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)

  const handleOpenDialog = (sub: IBMSubmission) => {
    setSelectedSubmission(sub)
    setNewCertUrl(sub.issuedCertificateUrl || "")
    setIsDialogOpen(true)
  }

  const handleUpdateCert = async () => {
    if (!selectedSubmission) return
    
    setIsUpdating(true)
    try {
      const res = await fetch(`/api/admin/ibm-submissions/${selectedSubmission.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issuedCertificateUrl: newCertUrl }),
      })

      if (!res.ok) throw new Error("Update failed")

      const result = await res.json()
      
      setSubmissions(prev => 
        prev.map(s => s.id === selectedSubmission.id ? { ...s, issuedCertificateUrl: newCertUrl } : s)
      )
      
      toast({
        title: isAr ? "تم التحديث" : "Updated",
        description: isAr ? "تم تحديث رابط الشهادة بنجاح." : "Certificate URL updated successfully.",
      })
      setIsDialogOpen(false)
    } catch (error) {
      toast({
        title: isAr ? "خطأ" : "Error",
        description: isAr ? "فشل تحديث الرابط." : "Failed to update URL.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="border rounded-lg bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{isAr ? "المشارك" : "Participant"}</TableHead>
            <TableHead>{isAr ? "رقم التواصل" : "Phone"}</TableHead>
            <TableHead>{isAr ? "تاريخ الإتمام" : "Completion Date"}</TableHead>
            <TableHead>{isAr ? "الحالة الوظيفية" : "Job Status"}</TableHead>
            <TableHead>{isAr ? "المستندات" : "Documents"}</TableHead>
            <TableHead>{isAr ? "الشهادة الصادرة" : "Issued Certificate"}</TableHead>
            <TableHead>{isAr ? "تاريخ التقديم" : "Submission Date"}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                {isAr ? "لا توجد طلبات حتى الآن" : "No submissions yet"}
              </TableCell>
            </TableRow>
          ) : (
            submissions.map((sub) => (
              <TableRow key={sub.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{sub.fullName}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {sub.email}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm tabular-nums">{sub.phoneNumber || (isAr ? "غير متوفر" : "N/A")}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar className="w-3 h-3 text-muted-foreground" />
                    {format(new Date(sub.completionDate), "PPP", { locale })}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">
                    {sub.employmentStatus === "job_seeker" ? (isAr ? "باحث عن عمل" : "Job Seeker") :
                     sub.employmentStatus === "student" ? (isAr ? "طالب" : "Student") :
                     sub.employmentStatus === "employed" ? (isAr ? "موظف" : "Employed") :
                     sub.employmentStatus || (isAr ? "غير محدد" : "Not specified")}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild title={isAr ? "عرض الشهادة" : "View Certificate"}>
                      <Link href={sub.certificateUrl} target="_blank">
                        <Award className="w-3 h-3 mr-1" />
                        {isAr ? "الشهادة" : "Cert"}
                      </Link>
                    </Button>
                    {sub.resumeUrl && (
                      <Button variant="outline" size="sm" asChild title={isAr ? "عرض السيرة الذاتية" : "View Resume"}>
                        <Link href={sub.resumeUrl} target="_blank">
                          <FileText className="w-3 h-3 mr-1" />
                          {isAr ? "السيرة" : "CV"}
                        </Link>
                      </Button>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {sub.issuedCertificateUrl ? (
                      <Button variant="ghost" size="sm" asChild className="text-green-600 h-8 px-2">
                        <Link href={sub.issuedCertificateUrl} target="_blank">
                          <CheckCircle2 className="w-4 h-4 mr-1 ml-1" />
                          {isAr ? "عرض" : "View"}
                        </Link>
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground italic px-2">
                        {isAr ? "قيد الانتظار" : "Pending"}
                      </span>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0" 
                      onClick={() => handleOpenDialog(sub)}
                      title={isAr ? "إضافة رابط يدوي" : "Add manual link"}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-blue-600"
                      asChild
                      title={isAr ? "تحميل الشهادة المولدة" : "Download generated certificate"}
                    >
                      <Link href={`/api/ibm-submission/certificate/${sub.id}`} target="_blank">
                        <Download className="w-4 h-4" />
                      </Link>
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(sub.createdAt), "yyyy-MM-dd HH:mm")}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isAr ? "إصدار شهادة" : "Issue Certificate"}</DialogTitle>
            <DialogDescription>
              {isAr ? `إضافة أو تعديل رابط الشهادة لـ ${selectedSubmission?.fullName}` : `Add or edit certificate URL for ${selectedSubmission?.fullName}`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="certUrl">{isAr ? "رابط الشهادة" : "Certificate URL"}</Label>
              <Input
                id="certUrl"
                placeholder="https://..."
                value={newCertUrl}
                onChange={(e) => setNewCertUrl(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={handleUpdateCert} disabled={isUpdating}>
              {isUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isAr ? "حفظ" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
