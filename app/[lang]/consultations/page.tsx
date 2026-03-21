"use client"

import { NavBar } from "@/components/nav-bar"
import { useLanguage } from "@/lib/language-context"
import { ConsultationsCards } from "@/components/consultations/consultations-cards"

export default function ConsultationsPage() {
  const { language } = useLanguage()
  const isAr = language === "ar"

  return (
    <div className="min-h-screen bg-background" dir={isAr ? "rtl" : "ltr"}>
      <NavBar />
      <div className="border-b">
        <div className="container mx-auto px-4 py-10">
          <h1 className="text-4xl font-bold mb-2">{isAr ? "الاستشارات" : "Consultations"}</h1>
          <p className="text-muted-foreground text-lg">
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
