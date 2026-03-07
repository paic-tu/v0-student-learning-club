
import { NavBar } from "@/components/nav-bar"
import { SiteFooter } from "@/components/site-footer"

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl" dir="rtl">
        <h1 className="text-3xl font-bold mb-6">شروط الاستخدام</h1>
        <h2 className="text-xl font-semibold mb-4 text-muted-foreground">Terms of Use</h2>
        
        <div className="prose dark:prose-invert max-w-none space-y-6">
          <p>
            باستخدام منصة NEON أو التسجيل في أي من خدماتها، يوافق المستخدم على الالتزام بالشروط والأحكام التالية.
          </p>

          <section>
            <h3 className="text-lg font-bold mb-2">1. استخدام المنصة</h3>
            <p>توفر منصة NEON محتوى تعليمي في مجالات التقنية بهدف تمكين المستخدمين من تطوير مهاراتهم التقنية.</p>
            <p>يحق للمستخدم استخدام المنصة للأغراض التعليمية الشخصية فقط.</p>
          </section>

          <section>
            <h3 className="text-lg font-bold mb-2">2. إنشاء الحساب</h3>
            <p>
              يلتزم المستخدم بتقديم معلومات صحيحة ودقيقة عند إنشاء الحساب، كما يتحمل المستخدم المسؤولية الكاملة عن الحفاظ على سرية بيانات تسجيل الدخول الخاصة به.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold mb-2">3. حقوق الملكية الفكرية</h3>
            <p>جميع المحتويات التعليمية المقدمة في منصة NEON، بما في ذلك:</p>
            <ul className="list-disc list-inside mr-4">
              <li>مقاطع الفيديو</li>
              <li>المواد التعليمية</li>
              <li>النصوص</li>
              <li>التمارين</li>
              <li>التصميمات</li>
            </ul>
            <p className="mt-2">
              هي ملكية فكرية خاصة بمنصة NEON أو بمدربيها، وهي محمية بموجب أنظمة حقوق الملكية الفكرية.
            </p>
            <p>لا يجوز استخدام هذه المحتويات خارج المنصة دون إذن رسمي.</p>
          </section>

          <section>
            <h3 className="text-lg font-bold mb-2">4. الاستخدام المسموح</h3>
            <p>يُسمح للمستخدم بالاستفادة من المحتوى التعليمي داخل المنصة فقط لأغراض التعلم الشخصي.</p>
          </section>

          <section>
            <h3 className="text-lg font-bold mb-2">5. الاستخدام غير المسموح</h3>
            <p>يمنع منعًا باتًا القيام بأي من الأفعال التالية:</p>
            <ul className="list-disc list-inside mr-4">
              <li>إعادة نشر محتوى الدورات</li>
              <li>تصوير أو تسجيل الدروس</li>
              <li>مشاركة الحساب مع أشخاص آخرين</li>
              <li>تحميل أو نسخ المحتوى التعليمي</li>
              <li>إعادة بيع أو توزيع محتوى الدورات</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-bold mb-2">6. إنهاء الحساب</h3>
            <p>
              يحق لمنصة NEON تعليق أو إيقاف حساب المستخدم في حال مخالفة شروط الاستخدام أو إساءة استخدام المنصة.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
