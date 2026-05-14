"use client"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Upload, CheckCircle2, FileText, AlertCircle, Sparkles, Rocket, Home, Award, User, Mail, Calendar, Phone, Briefcase, MessageSquare, X, ShieldCheck, ChevronLeft, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface IBMSubmissionFormProps {
  lang: "ar" | "en"
}

export function IBMSubmissionForm({ lang }: IBMSubmissionFormProps) {
  const isAr = lang === "ar"
  const { toast } = useToast()
  const router = useRouter()
  
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [submissionId, setSubmissionId] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(5)
  
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [completionDate, setCompletionDate] = useState("")
  const [employmentStatus, setEmploymentStatus] = useState("")
  const [notes, setNotes] = useState("")
  
  const [certificateUrl, setCertificateUrl] = useState("")
  const [certificateName, setCertificateName] = useState("")
  const [isUploadingCert, setIsUploadingCert] = useState(false)
  
  const [resumeUrl, setResumeUrl] = useState("")
  const [resumeName, setResumeName] = useState("")
  const [isUploadingResume, setIsUploadingResume] = useState(false)

  // Handle countdown and redirect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (success && countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1)
      }, 1000)
    } else if (success && countdown === 0) {
      router.push(`/${lang}`)
    }
    return () => clearInterval(interval)
  }, [success, countdown, lang, router])

  const canSubmit = useMemo(() => {
    // Date validation (9 April to 20 May 2026)
    const isValidDate = () => {
      if (!completionDate) return false
      const date = new Date(completionDate)
      const startDate = new Date("2026-04-09")
      const endDate = new Date("2026-05-20")
      return date >= startDate && date <= endDate
    }

    return (
      fullName.trim().length >= 2 &&
      email.trim().includes("@") &&
      phoneNumber.trim().length >= 8 &&
      isValidDate() &&
      certificateUrl !== "" &&
      !loading &&
      !isUploadingCert &&
      !isUploadingResume
    )
  }, [fullName, email, phoneNumber, completionDate, certificateUrl, loading, isUploadingCert, isUploadingResume])

  const handleFileUpload = async (file: File, type: "cert" | "resume") => {
    const setIsUploading = type === "cert" ? setIsUploadingCert : setIsUploadingResume
    const setUrl = type === "cert" ? setCertificateUrl : setResumeUrl
    const setName = type === "cert" ? setCertificateName : setResumeName

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Upload failed")

      setUrl(data.url)
      setName(file.name)
      
      toast({
        title: isAr ? "تم الرفع بنجاح" : "Uploaded successfully",
        description: file.name,
      })
    } catch (error: any) {
      toast({
        title: isAr ? "فشل الرفع" : "Upload failed",
        description: error.message || (isAr ? "حدث خطأ أثناء رفع الملف." : "An error occurred while uploading the file."),
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    setLoading(true)
    try {
      const res = await fetch("/api/ibm-submission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          phoneNumber,
          completionDate,
          certificateUrl,
          employmentStatus,
          resumeUrl,
          notes,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || "Submission failed")
      }

      setSubmissionId(result.data.id)
      setSuccess(true)
      toast({
        title: isAr ? "تم الإرسال بنجاح" : "Submitted successfully",
        description: isAr ? "شكراً لك! تم استلام طلبك." : "Thank you! Your submission has been received.",
      })
    } catch (error: any) {
      toast({
        title: isAr ? "خطأ في الإرسال" : "Submission error",
        description: error.message || (isAr ? "حدث خطأ أثناء إرسال النموذج." : "An error occurred while submitting the form."),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <Card className="max-w-2xl mx-auto border-none shadow-[0_20px_50px_rgba(0,0,0,0.1)] bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl overflow-hidden relative rounded-[2.5rem]">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
            <Award className="w-64 h-64 text-slate-900 dark:text-white" />
          </div>
          <CardContent className="pt-16 pb-16 text-center relative z-10 px-8">
            <div className="flex justify-center mb-8">
              <motion.div 
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
                className="p-6 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-[2rem] shadow-sm ring-1 ring-emerald-500/20"
              >
                <CheckCircle2 className="w-16 h-16 text-emerald-600 dark:text-emerald-400" />
              </motion.div>
            </div>
            <h2 className="text-4xl font-black mb-4 tracking-tight text-slate-900 dark:text-white">
              {isAr ? "تم الإرسال بنجاح!" : "Submission Successful!"}
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-md mx-auto leading-relaxed">
              {isAr 
                ? "شكراً لمشاركتك. تم استلام بياناتك بنجاح، يمكنك الآن تحميل شهادتك الخاصة بالمعسكر." 
                : "Thank you for participating. Your data has been received, you can now download your camp certificate."}
            </p>
            
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button 
                  size="lg"
                  className="w-full sm:w-auto h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-all rounded-2xl px-8 text-lg font-bold group"
                  onClick={() => window.open(`/api/ibm-submission/certificate/${submissionId}`, '_blank')}
                >
                  <Award className={cn("w-5 h-5", isAr ? "ml-2" : "mr-2")} />
                  {isAr ? "تحميل الشهادة" : "Download Certificate"}
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto h-14 border-slate-200 dark:border-slate-800 rounded-2xl px-8 text-lg font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group"
                  onClick={() => router.push(`/${lang}`)}
                >
                  <Rocket className={cn("w-5 h-5", isAr ? "ml-2" : "mr-2")} />
                  {isAr ? "الرئيسية" : "Home"}
                </Button>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <p className="text-sm font-medium text-slate-400 flex items-center justify-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-400"></span>
                  </span>
                  {isAr 
                    ? `سيتم توجيهك تلقائياً خلال ${countdown} ثوانٍ` 
                    : `Redirecting automatically in ${countdown} seconds`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <Card className="max-w-2xl mx-auto shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border-none bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl ring-1 ring-slate-200 dark:ring-slate-800 overflow-hidden rounded-[2.5rem]">
        <div className="relative w-full aspect-video md:aspect-[21/9] overflow-hidden group bg-slate-100 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-800">
          <Image 
            src="/imgeg.jpeg" 
            alt="IBM Banner" 
            fill 
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-40 md:opacity-60" />
        </div>

        <CardHeader className="space-y-2 pb-8 pt-8 px-8 text-center">
          <CardTitle className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            {isAr ? "نموذج المشاركة" : "Participation Form"}
          </CardTitle>
          <CardDescription className="text-lg font-medium text-slate-500 dark:text-slate-400">
            {isAr ? "سجل بياناتك للحصول على شهادة الحضور" : "Register your details for attendance certificate"}
          </CardDescription>
        </CardHeader>

        <CardContent className="px-8 pb-12">
          <form onSubmit={handleSubmit} className="space-y-12">
            {/* Section 1: Identity */}
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                  <User className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">{isAr ? "البيانات الأساسية" : "Identity Details"}</h3>
                <div className="h-px flex-1 bg-gradient-to-r from-slate-100 to-transparent dark:from-slate-800" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                {/* Full Name */}
                <div className="space-y-2.5">
                  <Label htmlFor="fullName" className="text-[15px] font-bold text-slate-700 dark:text-slate-300 px-1">
                    {isAr ? "الاسم الكامل" : "Full Name"}
                  </Label>
                  <div className="group relative">
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={isAr ? "اكتب اسمك الثنائي" : "Enter full name"}
                      className={cn(
                        "h-14 bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 rounded-2xl transition-all duration-300 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 text-base font-medium",
                        isAr ? "pr-12" : "pl-12"
                      )}
                      required
                    />
                    <User className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-blue-500", isAr ? "right-4" : "left-4")} />
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 px-1 italic">
                    {isAr ? "* سيظهر هذا الاسم في الشهادة النهائية" : "* This name will appear on the final certificate"}
                  </p>
                </div>

                {/* Email */}
                <div className="space-y-2.5">
                  <Label htmlFor="email" className="text-[15px] font-bold text-slate-700 dark:text-slate-300 px-1">
                    {isAr ? "البريد الإلكتروني" : "Email Address"}
                  </Label>
                  <div className="group relative">
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className={cn(
                        "h-14 bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 rounded-2xl transition-all duration-300 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 text-base font-medium",
                        isAr ? "pr-12" : "pl-12"
                      )}
                      required
                    />
                    <Mail className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-blue-500", isAr ? "right-4" : "left-4")} />
                  </div>
                </div>

                {/* Completion Date */}
                <div className="space-y-2.5">
                  <Label htmlFor="completionDate" className="text-[15px] font-bold text-slate-700 dark:text-slate-300 px-1">
                    {isAr ? "تاريخ الإتمام" : "Completion Date"}
                  </Label>
                  <div className="group relative">
                    <Input
                      id="completionDate"
                      type="date"
                      value={completionDate}
                      onChange={(e) => setCompletionDate(e.target.value)}
                      className={cn(
                        "h-14 bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 rounded-2xl transition-all duration-300 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 text-base font-medium",
                        isAr ? "pr-12" : "pl-12"
                      )}
                      required
                    />
                    <Calendar className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-blue-500", isAr ? "right-4" : "left-4")} />
                  </div>
                  {completionDate && (
                    (() => {
                      const date = new Date(completionDate);
                      const start = new Date("2026-04-09");
                      const end = new Date("2026-05-20");
                      const isValid = date >= start && date <= end;
                      if (!isValid) {
                        return (
                          <div className="flex items-center gap-2 px-1 text-red-600 dark:text-red-400 bg-red-500/5 py-1.5 px-3 rounded-xl border border-red-500/10">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-[12px] font-bold">
                              {isAr ? "عذراً، التاريخ خارج النطاق المسموح به" : "Sorry, date is out of range"}
                            </span>
                          </div>
                        );
                      }
                      return null;
                    })()
                  )}
                  <div className="flex items-center gap-2 px-1 text-blue-600 dark:text-blue-400 bg-blue-500/5 dark:bg-blue-500/10 py-1.5 px-3 rounded-xl border border-blue-500/10">
                    <ShieldCheck className="h-4 w-4" />
                    <span className="text-[12px] font-bold tracking-tight">
                      {isAr ? "متاح من 9 أبريل حتى 20 مايو 2026" : "Available from 9 April to 20 May 2026"}
                    </span>
                  </div>
                </div>

                {/* Phone Number */}
                <div className="space-y-2.5">
                  <Label htmlFor="phoneNumber" className="text-[15px] font-bold text-slate-700 dark:text-slate-300 px-1">
                    {isAr ? "رقم الهاتف" : "Phone Number"}
                  </Label>
                  <div className="group relative">
                    <Input
                      id="phoneNumber"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="05xxxxxxxx"
                      className={cn(
                        "h-14 bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 rounded-2xl transition-all duration-300 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 text-base font-medium",
                        isAr ? "pr-12" : "pl-12"
                      )}
                      required
                    />
                    <Phone className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-blue-500", isAr ? "right-4" : "left-4")} />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Verification */}
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                  <Award className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">{isAr ? "التوثيق والشهادة" : "Verification"}</h3>
                <div className="h-px flex-1 bg-gradient-to-r from-slate-100 to-transparent dark:from-slate-800" />
              </div>

              <div className="space-y-4">
                <div 
                  className={cn(
                    "relative overflow-hidden group transition-all duration-500",
                    certificateUrl 
                      ? "rounded-[2rem] border-2 border-emerald-500/20 bg-emerald-500/[0.02] dark:bg-emerald-500/[0.05]" 
                      : "rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-500/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/50"
                  )}
                >
                  <div className="p-10 text-center">
                    {isUploadingCert ? (
                      <div className="flex flex-col items-center gap-4">
                        <div className="relative h-16 w-16">
                          <Loader2 className="h-16 w-16 animate-spin text-blue-600" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Upload className="h-6 w-6 text-blue-600" />
                          </div>
                        </div>
                        <p className="text-lg font-black text-slate-900 dark:text-white animate-pulse">
                          {isAr ? "جاري الرفع..." : "Uploading..."}
                        </p>
                      </div>
                    ) : certificateUrl ? (
                      <div className="flex flex-col items-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-lg font-black text-emerald-700 dark:text-emerald-400">{isAr ? "تم رفع الشهادة" : "Certificate Uploaded"}</p>
                          <p className="text-sm text-slate-500 font-medium truncate max-w-xs">{certificateName}</p>
                        </div>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          className="mt-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl"
                          onClick={() => {setCertificateUrl(""); setCertificateName("");}}
                        >
                          <X className="h-4 w-4 mr-2 ml-2" />
                          {isAr ? "تغيير الملف" : "Change File"}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="flex justify-center">
                          <div className="h-20 w-20 rounded-[1.75rem] bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-500/10 transition-all duration-500">
                            <Upload className="h-10 w-10 text-slate-400 group-hover:text-blue-600 transition-colors" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="cert-upload" className="cursor-pointer block">
                            <span className="text-2xl font-black text-slate-900 dark:text-white block mb-1">
                              {isAr ? "ارفع شهادة IBM" : "Upload IBM Certificate"}
                            </span>
                            <span className="text-base text-slate-500 font-medium">
                              {isAr ? "اسحب الملف هنا أو اضغط للاختيار" : "Drag & drop or click to browse"}
                            </span>
                          </label>
                          <p className="text-xs text-slate-400 mt-4 uppercase tracking-widest font-bold">PDF, PNG, JPG • MAX 5MB</p>
                        </div>
                        <input 
                          id="cert-upload" 
                          type="file" 
                          className="hidden" 
                          accept=".pdf,image/*"
                          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "cert")}
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Progress bar decoration */}
                  {isUploadingCert && (
                    <div className="absolute bottom-0 left-0 h-1 bg-blue-600 animate-progress-indeterminate w-full" />
                  )}
                </div>

                <div className="bg-amber-500/[0.03] dark:bg-amber-500/[0.05] p-5 rounded-[1.5rem] border border-amber-500/10 flex gap-4">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                  </div>
                  <p className="text-[13px] text-amber-900/70 dark:text-amber-400/70 leading-relaxed font-medium">
                    {isAr 
                      ? "تأكد من أن الشهادة هي (IBM SkillsBuild) الأصلية وصادرة في الفترة المحددة. المرفقات غير الصحيحة قد تؤدي لرفض الطلب." 
                      : "Make sure to upload the original IBM SkillsBuild certificate issued within the specified period. Incorrect attachments may lead to rejection."}
                  </p>
                </div>
              </div>
            </div>

            {/* Section 3: Professional Info */}
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-500/10 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400">
                  <Briefcase className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">{isAr ? "المعلومات المهنية" : "Career Info"}</h3>
                <div className="h-px flex-1 bg-gradient-to-r from-slate-100 to-transparent dark:from-slate-800" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                {/* Employment Status */}
                <div className="space-y-2.5">
                  <Label htmlFor="employmentStatus" className="text-[15px] font-bold text-slate-700 dark:text-slate-300 px-1">
                    {isAr ? "هل أنت ؟" : "Current Status"}
                  </Label>
                  <Select onValueChange={setEmploymentStatus} value={employmentStatus}>
                    <SelectTrigger className="h-14 bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 text-base font-medium">
                      <SelectValue placeholder={isAr ? "اختر من القائمة..." : "Choose status..."} />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-200 dark:border-slate-800 p-2 shadow-2xl">
                      <SelectItem value="job_seeker" className="rounded-xl py-3 focus:bg-blue-50 dark:focus:bg-blue-900/20">{isAr ? "باحث عن عمل" : "Job Seeker"}</SelectItem>
                      <SelectItem value="student" className="rounded-xl py-3 focus:bg-blue-50 dark:focus:bg-blue-900/20">{isAr ? "طالب" : "Student"}</SelectItem>
                      <SelectItem value="employed" className="rounded-xl py-3 focus:bg-blue-50 dark:focus:bg-blue-900/20">{isAr ? "موظف" : "Employed"}</SelectItem>
                      <SelectItem value="other" className="rounded-xl py-3 focus:bg-blue-50 dark:focus:bg-blue-900/20">{isAr ? "أخرى" : "Other"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Resume Upload (Mini) */}
                <div className="space-y-2.5">
                  <Label className="text-[15px] font-bold text-slate-700 dark:text-slate-300 px-1 flex justify-between items-center">
                    <span>{isAr ? "السيرة الذاتية" : "Resume"}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{isAr ? "اختياري" : "Optional"}</span>
                  </Label>
                  <div 
                    className={cn(
                      "relative h-14 rounded-2xl border-2 border-dashed transition-all duration-300 flex items-center px-4",
                      resumeUrl 
                        ? "border-emerald-500/30 bg-emerald-500/[0.02]" 
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    )}
                  >
                    {isUploadingResume ? (
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                        <span className="text-sm font-bold text-blue-600">{isAr ? "جاري الرفع..." : "Uploading..."}</span>
                      </div>
                    ) : resumeUrl ? (
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileText className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 truncate">{resumeName}</span>
                        </div>
                        <button 
                          type="button"
                          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors group"
                          onClick={() => {setResumeUrl(""); setResumeName("");}}
                        >
                          <X className="h-3.5 w-3.5 text-slate-400 group-hover:text-red-500" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-full h-full">
                        <label htmlFor="resume-upload" className="cursor-pointer w-full h-full flex items-center gap-3 text-slate-500 hover:text-blue-600 transition-colors">
                          <Upload className="h-4 w-4" />
                          <span className="text-sm font-bold">{isAr ? "ارفع ملف الـ CV" : "Upload CV file"}</span>
                        </label>
                        <input 
                          id="resume-upload" 
                          type="file" 
                          className="hidden" 
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "resume")}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2.5">
                <Label htmlFor="notes" className="text-[15px] font-bold text-slate-700 dark:text-slate-300 px-1">
                  {isAr ? "هل لديك أي استفسار أو ملاحظة؟" : "Any notes or inquiries?"}
                </Label>
                <div className="relative group">
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={isAr ? "اكتب ملاحظاتك هنا (اختياري)..." : "Write your notes here (optional)..."}
                    className="bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 rounded-2xl min-h-[120px] p-4 text-base font-medium resize-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all"
                  />
                  <MessageSquare className={cn("absolute bottom-4 h-5 w-5 text-slate-300 group-focus-within:text-blue-500 transition-colors", isAr ? "left-4" : "right-4")} />
                </div>
              </div>
            </div>

            {/* Final CTA */}
            <div className="pt-4">
              <Button 
                type="submit" 
                disabled={!canSubmit || loading} 
                className={cn(
                  "w-full h-20 text-2xl font-black rounded-[1.75rem] transition-all duration-500 relative overflow-hidden group shadow-[0_20px_40px_-10px_rgba(37,99,235,0.3)]",
                  !canSubmit || loading 
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none" 
                    : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-[1.02] active:scale-95"
                )}
              >
                <div className="relative z-10 flex items-center justify-center gap-4">
                  {loading ? (
                    <>
                      <Loader2 className="h-7 w-7 animate-spin" />
                      <span className="tracking-tight">{isAr ? "جاري الإرسال..." : "Submitting..."}</span>
                    </>
                  ) : (
                    <>
                      <span className="tracking-tight">{isAr ? "إرسال البيانات" : "Submit Details"}</span>
                      {isAr ? <ChevronLeft className="h-7 w-7 group-hover:-translate-x-2 transition-transform" /> : <ChevronRight className="h-7 w-7 group-hover:translate-x-2 transition-transform" />}
                    </>
                  )}
                </div>
              </Button>
              
              {!canSubmit && !loading && (
                <p className="text-center mt-6 text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">
                  {isAr ? "يرجى إكمال جميع الحقول المطلوبة" : "Please complete all required fields"}
                </p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
