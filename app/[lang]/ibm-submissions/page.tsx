import { IBMSubmissionForm } from "@/components/ibm/ibm-submission-form"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "IBM Course Submission | نموذج المشاركة في كورسات IBM",
  description: "نموذج تعبئة بيانات المشاركين في كورسات IBM بالتعاون مع نيون",
}

export default async function IBMSubmissionsPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const isAr = lang === "ar"

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8" dir={isAr ? "rtl" : "ltr"}>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
            {isAr ? "برنامج نيون x IBM SkillsBuild" : "Neon x IBM SkillsBuild Program"}
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            {isAr 
              ? "سعداء بمشاركتكم في المعسكر التدريبي. يرجى تزويدنا بالمعلومات المطلوبة لتوثيق إنجازكم وتحديد الفرص المناسبة لكم." 
              : "We are happy with your participation in the training camp. Please provide us with the required information to document your achievement and identify suitable opportunities for you."}
          </p>
        </div>

        <IBMSubmissionForm lang={lang as "ar" | "en"} />
        
        <div className="text-center text-sm text-slate-500 mt-8">
          <p>
            {isAr 
              ? "© 2026 نيون. جميع الحقوق محفوظة." 
              : "© 2026 Neon. All rights reserved."}
          </p>
        </div>
      </div>
    </div>
  )
}
