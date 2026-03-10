export type FaqItem = {
  q: string
  a: string
}

export function getFaqItems(lang: "ar" | "en"): FaqItem[] {
  if (lang === "ar") {
    return [
      {
        q: "ما هي منصة NEON؟",
        a: "NEON منصة تعليمية تقنية تجمع بين التعلم العملي وبناء مجتمع تفاعلي يساعدك على تطوير مهاراتك ومشاركة المعرفة.",
      },
      {
        q: "كيف أسجّل في المنصة؟",
        a: "من صفحة التسجيل يمكنك إنشاء حساب باستخدام بريدك الإلكتروني، وبعدها يمكنك تسجيل الدخول والوصول للوحة التحكم.",
      },
      {
        q: "كيف ألتحق بدورة؟",
        a: "ادخل صفحة الدورات واختر الدورة المناسبة ثم أكمل خطوات التسجيل/الشراء إن لزم، وستظهر الدورة في لوحة الطالب.",
      },
      {
        q: "هل توجد شهادات عند إكمال الدورات؟",
        a: "نعم، عند إكمال الدورة تظهر شهادتك في صفحة الشهادات ويمكنك تحميلها ومشاركتها.",
      },
      {
        q: "هل يمكنني تعلم المحتوى عملياً؟",
        a: "المحتوى مصمم للتطبيق: دروس + أنشطة + اختبارات/تحديات، مع متابعة للتقدم داخل كل دورة.",
      },
      {
        q: "هل يوجد دعم مباشر أو استشارات؟",
        a: "نعم، تتوفر غرف استشارات تقنية مباشرة لطرح الأسئلة والتفاعل مع المدربين.",
      },
      {
        q: "نسيت كلمة المرور، ماذا أفعل؟",
        a: "استخدم صفحة (نسيت كلمة المرور) لإرسال رابط إعادة تعيين إلى بريدك الإلكتروني.",
      },
      {
        q: "كيف أتواصل مع الدعم؟",
        a: "يمكنك التواصل عبر صفحة (تواصل معنا) أو متابعة صفحة الأسئلة الشائعة وسياسة الخصوصية وشروط الاستخدام لمزيد من التفاصيل.",
      },
    ]
  }

  return [
    {
      q: "What is NEON?",
      a: "NEON is a technology learning platform that combines practical learning with community building to help you grow your skills and share knowledge.",
    },
    {
      q: "How do I sign up?",
      a: "Use the registration page to create an account with your email, then sign in to access your dashboard.",
    },
    {
      q: "How do I enroll in a course?",
      a: "Browse courses, pick the one you want, complete enrollment/purchase if needed, and it will appear in your student dashboard.",
    },
    {
      q: "Do I get a certificate after completion?",
      a: "Yes. Once you complete a course, your certificate appears in the Certificates page where you can download and share it.",
    },
    {
      q: "Is the learning practical?",
      a: "Yes. Lessons are designed for hands-on practice with activities and quizzes/challenges, plus progress tracking per course.",
    },
    {
      q: "Do you offer live support or consultations?",
      a: "Yes. We provide live tech consultation rooms where you can ask questions and interact with instructors.",
    },
    {
      q: "I forgot my password. What should I do?",
      a: "Use the Forgot Password page to receive a reset link via email.",
    },
    {
      q: "How can I contact support?",
      a: "You can reach out through the Contact page, and also check Privacy Policy and Terms for additional details.",
    },
  ]
}

