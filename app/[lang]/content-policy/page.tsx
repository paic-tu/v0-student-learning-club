
import { NavBar } from "@/components/nav-bar"
import { SiteFooter } from "@/components/site-footer"

export default function ContentPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl" dir="rtl">
        <h1 className="text-3xl font-bold mb-6">سياسة حماية المحتوى والتعهد بعدم نشر الدورات</h1>
        
        <div className="prose dark:prose-invert max-w-none space-y-6">
          <p>
            تحرص منصة NEON على حماية المحتوى التعليمي الذي يتم إنتاجه من قبل المدربين والخبراء، ولذلك يلتزم المستخدم بالشروط التالية عند التسجيل في أي دورة.
          </p>

          <section>
            <h3 className="text-lg font-bold mb-2">1. ملكية المحتوى</h3>
            <p>
              جميع المواد التعليمية المقدمة في المنصة تعتبر ملكية فكرية لمنصة NEON أو لمدربيها، ويُمنع استخدامها خارج المنصة دون إذن رسمي.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold mb-2">2. منع إعادة النشر</h3>
            <p>يمنع منعًا باتًا:</p>
            <ul className="list-disc list-inside mr-4">
              <li>تسجيل مقاطع الفيديو الخاصة بالدورات</li>
              <li>تصوير المحتوى التعليمي</li>
              <li>مشاركة الدورات عبر الإنترنت</li>
              <li>رفع الدروس على منصات أخرى</li>
              <li>بيع المحتوى التعليمي بأي شكل من الأشكال</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-bold mb-2">3. التعهد</h3>
            <p>عند التسجيل في أي دورة، يقر المستخدم ويوافق على التعهد التالي:</p>
            <div className="bg-muted p-4 rounded-lg border my-4">
              <p className="font-medium text-center">
                &quot;أتعهد بعدم نسخ أو تصوير أو تسجيل أو إعادة نشر أو توزيع أي محتوى تعليمي من منصة NEON خارج المنصة، وأتحمل المسؤولية الكاملة في حال مخالفة ذلك.&quot;
              </p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-bold mb-2">4. الإجراءات في حال المخالفة</h3>
            <p>في حال ثبوت قيام المستخدم بنشر أو تسريب محتوى الدورات، يحق لمنصة NEON اتخاذ الإجراءات التالية:</p>
            <ul className="list-disc list-inside mr-4">
              <li>تعليق أو إلغاء حساب المستخدم</li>
              <li>إلغاء الوصول إلى الدورات</li>
              <li>اتخاذ الإجراءات القانونية اللازمة لحماية حقوق الملكية الفكرية.</li>
            </ul>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
