export type Language = "ar" | "en"

export const translations = {
  // Navigation
  courses: { ar: "الدورات", en: "Courses" },
  store: { ar: "المتجر", en: "Store" },
  myLibrary: { ar: "مكتبتي", en: "My Library" },
  verify: { ar: "تحقق", en: "Verify" },
  challenges: { ar: "التحديات", en: "Challenges" },
  community: { ar: "المجتمع", en: "Community" },
  cart: { ar: "السلة", en: "Cart" },
  checkout: { ar: "إتمام الدفع", en: "Checkout" },
  orders: { ar: "طلباتي", en: "Orders" },
  profile: { ar: "الملف الشخصي", en: "Profile" },
  certificates: { ar: "الشهادات", en: "Certificates" },
  verifyCertificate: { ar: "تحقق من الشهادة", en: "Verify Certificate" },
  adminPanel: { ar: "لوحة التحكم", en: "Admin Panel" },
  dashboard: { ar: "لوحة التحكم", en: "Dashboard" },
  students: { ar: "الأعضاء المسجلين", en: "Registered Members" },
  enrollments: { ar: "التسجيلات", en: "Enrollments" },
  contests: { ar: "المسابقات", en: "Contests" },
  browse: { ar: "تصفح الدورات", en: "Browse Courses" },
  myCourses: { ar: "دوراتي", en: "My Courses" },
  bookmarks: { ar: "المحفوظات", en: "Bookmarks" },
  notes: { ar: "ملاحظاتي", en: "My Notes" },
  settings: { ar: "الإعدادات", en: "Settings" },

  // Auth
  login: { ar: "تسجيل الدخول", en: "Login" },
  register: { ar: "إنشاء حساب", en: "Register" },
  logout: { ar: "تسجيل الخروج", en: "Logout" },
  email: { ar: "البريد الإلكتروني", en: "Email" },
  phone: { ar: "رقم الجوال", en: "Phone" },
  password: { ar: "كلمة المرور", en: "Password" },
  name: { ar: "الاسم", en: "Name" },
  signInRequired: { ar: "يجب تسجيل الدخول", en: "Sign in required" },

  // Actions
  startLearning: { ar: "ابدأ التعلم", en: "Start Learning" },
  enroll: { ar: "سجّل", en: "Enroll" },
  buyAccess: { ar: "اشترِ الوصول", en: "Buy Access" },
  continue: { ar: "أكمل", en: "Continue" },
  addToCart: { ar: "أضف للسلة", en: "Add to Cart" },
  proceedToCheckout: { ar: "إتمام الدفع", en: "Proceed to Checkout" },
  placeOrder: { ar: "تأكيد الطلب", en: "Place Order" },
  download: { ar: "تحميل", en: "Download" },
  previous: { ar: "السابق", en: "Previous" },
  next: { ar: "التالي", en: "Next" },
  markComplete: { ar: "اكتمل", en: "Mark Complete" },
  submit: { ar: "إرسال", en: "Submit" },

  // Course
  overview: { ar: "نظرة عامة", en: "Overview" },
  curriculum: { ar: "المنهج", en: "Curriculum" },
  requirements: { ar: "المتطلبات", en: "Requirements" },
  reviews: { ar: "التقييمات", en: "Reviews" },
  whatYouLearn: { ar: "ما ستتعلمه", en: "What you'll learn" },
  instructor: { ar: "المدرب", en: "Instructor" },
  duration: { ar: "المدة", en: "Duration" },
  level: { ar: "المستوى", en: "Level" },
  category: { ar: "الفئة", en: "Category" },

  // Levels
  beginner: { ar: "مبتدئ", en: "Beginner" },
  intermediate: { ar: "متوسط", en: "Intermediate" },
  advanced: { ar: "متقدم", en: "Advanced" },

  // Store & Cart
  price: { ar: "السعر", en: "Price" },
  includes: { ar: "يتضمن", en: "Includes" },
  subtotal: { ar: "المجموع الفرعي", en: "Subtotal" },
  total: { ar: "الإجمالي", en: "Total" },
  emptyCart: { ar: "السلة فارغة", en: "Cart is empty" },
  couponCode: { ar: "كود الخصم", en: "Coupon Code" },
  apply: { ar: "تطبيق", en: "Apply" },

  // Payment
  paymentMethod: { ar: "طريقة الدفع", en: "Payment Method" },
  card: { ar: "بطاقة", en: "Card" },
  applePay: { ar: "Apple Pay", en: "Apple Pay" },
  bankTransfer: { ar: "تحويل بنكي", en: "Bank Transfer" },

  // Status
  paid: { ar: "مدفوع", en: "Paid" },
  pending: { ar: "قيد الانتظار", en: "Pending" },
  failed: { ar: "فشل", en: "Failed" },

  // Empty states
  noCourses: { ar: "لا توجد دورات", en: "No courses found" },
  noOrders: { ar: "لا توجد طلبات", en: "No orders yet" },
  notEnrolled: { ar: "لم تسجل في هذه الدورة بعد", en: "Not enrolled yet" },
  noCertificates: { ar: "لا توجد شهادات", en: "No certificates yet" },

  // Coming soon
  comingSoon: { ar: "قريبًا", en: "Coming Soon" },

  // Other
  search: { ar: "بحث", en: "Search" },
  filter: { ar: "تصفية", en: "Filter" },
  free: { ar: "مجاني", en: "Free" },
  hours: { ar: "ساعات", en: "hours" },
  minutes: { ar: "دقائق", en: "minutes" },
  progress: { ar: "التقدم", en: "Progress" },
  completionDate: { ar: "تاريخ الإنجاز", en: "Completion Date" },
  certificateId: { ar: "رقم الشهادة", en: "Certificate ID" },
  locked: { ar: "مقفل", en: "Locked" },
  lessonDetails: { ar: "تفاصيل الدرس", en: "Lesson Details" },

  points: { ar: "نقطة", en: "Points" },
  enrollFree: { ar: "سجّل مجاناً", en: "Enroll for Free" },
  courseDetails: { ar: "تفاصيل الدورة", en: "Course Details" },
  description: { ar: "الوصف", en: "Description" },
  loading: { ar: "جاري التحميل", en: "Loading" },
  difficulty: { ar: "الصعوبة", en: "Difficulty" },
  // Enhanced course details page
  share: { ar: "مشاركة", en: "Share" },
  enrollNow: { ar: "سجّل الآن", en: "Enroll Now" },
  lessons: { ar: "دروس", en: "lessons" },
  aboutCourse: { ar: "عن الدورة", en: "About Course" },
  author: { ar: "المدرب", en: "Author" },
  faq: { ar: "الأسئلة الشائعة", en: "FAQ" },
  announcements: { ar: "الإعلانات", en: "Announcements" },
  courseContent: { ar: "محتوى الدورة", en: "Course content" },
  preview: { ar: "معاينة", en: "Preview" },
  copiedToClipboard: { ar: "تم النسخ إلى الحافظة", en: "Copied to clipboard" },
  enrolled: { ar: "تم التسجيل", en: "Enrolled" },
  followInstructor: { ar: "متابعة المدرب", en: "Follow" },
  viewProfile: { ar: "عرض الملف", en: "View profile" },
  rating: { ar: "التقييم", en: "Rating" },
  totalReviews: { ar: "إجمالي التقييمات", en: "Total reviews" },
  viewAllReviews: { ar: "عرض جميع التقييمات", en: "View all reviews" },
}

export function t(key: keyof typeof translations, lang: Language = "ar"): string {
  return translations[key]?.[lang] || key
}
