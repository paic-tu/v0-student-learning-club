
import { NavBar } from "@/components/nav-bar"
import { SiteFooter } from "@/components/site-footer"

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl" dir="rtl">
        <h1 className="text-3xl font-bold mb-6">سياسة الخصوصية</h1>
        <h2 className="text-xl font-semibold mb-4">منصة NEON للتعلم التقني</h2>
        
        <div className="prose dark:prose-invert max-w-none space-y-6">
          <p>
            تلتزم منصة NEON بحماية خصوصية المستخدمين والحفاظ على سرية المعلومات الشخصية التي يتم جمعها أثناء استخدام المنصة. تهدف هذه السياسة إلى توضيح كيفية جمع البيانات واستخدامها وحمايتها.
          </p>

          <section>
            <h3 className="text-lg font-bold mb-2">1. المعلومات التي نقوم بجمعها</h3>
            <p>قد تقوم منصة NEON بجمع بعض المعلومات الشخصية عند قيام المستخدم بالتسجيل أو استخدام خدمات المنصة، وتشمل على سبيل المثال لا الحصر:</p>
            <ul className="list-disc list-inside mr-4">
              <li>الاسم الكامل</li>
              <li>البريد الإلكتروني</li>
              <li>رقم الجوال</li>
              <li>بيانات الحساب وتسجيل الدخول</li>
              <li>بيانات الاشتراك في الدورات</li>
              <li>معلومات الاستخدام داخل المنصة مثل تقدم المستخدم في الدورات</li>
            </ul>
            <p className="mt-2">قد يتم أيضًا جمع بعض البيانات التقنية مثل:</p>
            <ul className="list-disc list-inside mr-4">
              <li>عنوان بروتوكول الإنترنت (IP Address)</li>
              <li>نوع الجهاز والمتصفح</li>
              <li>بيانات التصفح داخل المنصة</li>
            </ul>
            <p className="mt-2">وذلك بهدف تحسين تجربة المستخدم وتطوير الخدمات.</p>
          </section>

          <section>
            <h3 className="text-lg font-bold mb-2">2. كيفية استخدام المعلومات</h3>
            <p>تستخدم منصة NEON المعلومات التي يتم جمعها للأغراض التالية:</p>
            <ul className="list-disc list-inside mr-4">
              <li>إنشاء وإدارة حساب المستخدم</li>
              <li>تمكين المستخدم من الوصول إلى الدورات التعليمية</li>
              <li>التواصل مع المستخدم بخصوص التحديثات أو الدورات الجديدة</li>
              <li>تحسين جودة الخدمات التعليمية</li>
              <li>تحليل استخدام المنصة لتطوير تجربة التعلم</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-bold mb-2">3. حماية المعلومات</h3>
            <p>
              تلتزم منصة NEON باتخاذ التدابير التقنية والتنظيمية المناسبة لحماية المعلومات الشخصية من الوصول غير المصرح به أو الاستخدام غير المشروع أو التعديل أو الإفصاح.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold mb-2">4. مشاركة المعلومات</h3>
            <p>لا تقوم منصة NEON ببيع أو مشاركة المعلومات الشخصية للمستخدمين مع أي طرف ثالث لأغراض تجارية.</p>
            <p>قد يتم مشاركة بعض البيانات فقط في الحالات التالية:</p>
            <ul className="list-disc list-inside mr-4">
              <li>الامتثال للأنظمة والقوانين المعمول بها</li>
              <li>حماية حقوق المنصة أو المستخدمين</li>
              <li>تحسين الخدمات التقنية للمنصة من خلال مزودي خدمات معتمدين</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-bold mb-2">5. ملفات تعريف الارتباط (Cookies)</h3>
            <p>
              قد تستخدم منصة NEON ملفات تعريف الارتباط لتحسين تجربة المستخدم، مثل حفظ إعدادات المستخدم أو تحليل سلوك التصفح داخل المنصة.
            </p>
            <p>
              يمكن للمستخدم تعطيل ملفات تعريف الارتباط من خلال إعدادات المتصفح، إلا أن ذلك قد يؤثر على بعض وظائف المنصة.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold mb-2">6. موافقة المستخدم</h3>
            <p>
              باستخدام منصة NEON والتسجيل فيها، يوافق المستخدم على جمع واستخدام المعلومات وفقًا لما هو موضح في سياسة الخصوصية هذه.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
