"use client"

import { NavBar } from "@/components/nav-bar"
import { useLanguage } from "@/lib/language-context"
import { ConsultationsCards } from "@/components/consultations/consultations-cards"

export default function ConsultationsPage() {
  const { language } = useLanguage()
  const isAr = language === "ar"

  return (
    <div className="relative z-10 min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-100" dir={isAr ? "rtl" : "ltr"}>
      <NavBar />
      <div className="border-b border-slate-200/80 bg-white/90 dark:border-slate-700 dark:bg-slate-900/90">
        <div className="container mx-auto px-4 py-10">
          <h1 className="text-4xl font-bold mb-2 text-slate-900 dark:text-slate-100">{isAr ? "الاستشارات" : "Consultations"}</h1>
          <p className="text-slate-700 text-lg dark:text-slate-300">
            {isAr ? "اختر المستشار وحدد الموعد المناسب لك" : "Choose an expert and book an available time slot"}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        <ConsultationsCards />
      </div>
    </div>
  )
}
