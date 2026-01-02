import type { User, Course, Enrollment, Product, CartItem, Order, Certificate } from "./types"
import { safeGetFromStorage, safeSaveToStorage } from "./safe-storage"

// Helper to get from localStorage
function getFromStorage<T>(key: string, defaultValue: T): T {
  return safeGetFromStorage(key, defaultValue)
}

// Helper to save to localStorage
function saveToStorage<T>(key: string, value: T): void {
  safeSaveToStorage(key, value)
}

// Seed data
const seedUsers: User[] = [
  {
    id: "user1",
    name: "أحمد محمد",
    email: "ahmed@example.com",
    phone: "+966501234567",
    role: "student",
    createdAt: new Date().toISOString(),
  },
  {
    id: "admin1",
    name: "Admin User",
    email: "admin@neon.com",
    role: "admin",
    createdAt: new Date().toISOString(),
  },
]

const seedCourses: Course[] = [
  {
    id: "course1",
    titleAr: "أساسيات البرمجة بلغة بايثون",
    titleEn: "Python Programming Fundamentals",
    category: "برمجة",
    level: "beginner",
    durationHours: 12,
    price: null,
    thumbnailUrl: "/python-programming-concept.png",
    instructorName: "د. محمد العلي",
    descriptionAr: "تعلم أساسيات البرمجة باستخدام لغة بايثون من الصفر",
    descriptionEn: "Learn programming fundamentals using Python from scratch",
    requirementsAr: ["لا توجد متطلبات مسبقة", "حاسوب متصل بالإنترنت"],
    requirementsEn: ["No prerequisites", "Computer with internet connection"],
    outcomesAr: [
      "فهم أساسيات البرمجة",
      "كتابة برامج بايثون بسيطة",
      "العمل مع البيانات والمتغيرات",
      "استخدام الحلقات والشروط",
    ],
    outcomesEn: [
      "Understand programming fundamentals",
      "Write simple Python programs",
      "Work with data and variables",
      "Use loops and conditionals",
    ],
    modules: [
      {
        id: "mod1",
        titleAr: "المقدمة",
        titleEn: "Introduction",
        order: 1,
        lessons: [
          {
            id: "lesson1",
            titleAr: "مرحباً بك في الدورة",
            titleEn: "Welcome to the Course",
            type: "video",
            order: 1,
            durationMin: 10,
            isLocked: false,
            videoUrl: "https://example.com/video1.mp4",
            contentAr: "مرحباً بك في دورة أساسيات البرمجة",
            contentEn: "Welcome to Programming Fundamentals",
          },
          {
            id: "lesson2",
            titleAr: "تثبيت بايثون",
            titleEn: "Installing Python",
            type: "video",
            order: 2,
            durationMin: 15,
            isLocked: false,
            videoUrl: "https://example.com/video2.mp4",
          },
        ],
      },
      {
        id: "mod2",
        titleAr: "الأساسيات",
        titleEn: "Basics",
        order: 2,
        lessons: [
          {
            id: "lesson3",
            titleAr: "المتغيرات وأنواع البيانات",
            titleEn: "Variables and Data Types",
            type: "video",
            order: 1,
            durationMin: 20,
            isLocked: false,
          },
          {
            id: "lesson4",
            titleAr: "اختبار الوحدة",
            titleEn: "Unit Quiz",
            type: "quiz",
            order: 2,
            durationMin: 10,
            isLocked: false,
            quiz: [
              {
                questionAr: "ما هو نوع بيانات الرقم 42؟",
                questionEn: "What is the data type of 42?",
                optionsAr: ["نص", "رقم صحيح", "رقم عشري", "منطقي"],
                optionsEn: ["String", "Integer", "Float", "Boolean"],
                correctIndex: 1,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "course2",
    titleAr: "تطوير تطبيقات الويب",
    titleEn: "Web Development",
    category: "تطوير ويب",
    level: "intermediate",
    durationHours: 24,
    price: 299,
    thumbnailUrl: "/web-development-concept.png",
    instructorName: "سارة أحمد",
    descriptionAr: "تعلم تطوير تطبيقات الويب الحديثة باستخدام React و Next.js",
    descriptionEn: "Learn modern web development with React and Next.js",
    requirementsAr: ["معرفة أساسية بـ HTML و CSS", "معرفة بجافاسكربت"],
    requirementsEn: ["Basic HTML & CSS knowledge", "JavaScript knowledge"],
    outcomesAr: ["بناء تطبيقات React", "استخدام Next.js", "التعامل مع APIs", "نشر التطبيقات"],
    outcomesEn: ["Build React applications", "Use Next.js", "Work with APIs", "Deploy applications"],
    modules: [
      {
        id: "mod3",
        titleAr: "React الأساسيات",
        titleEn: "React Basics",
        order: 1,
        lessons: [
          {
            id: "lesson5",
            titleAr: "مقدمة في React",
            titleEn: "Introduction to React",
            type: "video",
            order: 1,
            durationMin: 25,
            isLocked: false,
          },
          {
            id: "lesson6",
            titleAr: "المكونات والخصائص",
            titleEn: "Components and Props",
            type: "video",
            order: 2,
            durationMin: 30,
            isLocked: true,
          },
        ],
      },
    ],
  },
  {
    id: "course3",
    titleAr: "تحليل البيانات",
    titleEn: "Data Analysis",
    category: "علوم البيانات",
    level: "intermediate",
    durationHours: 18,
    price: 399,
    thumbnailUrl: "/data-analysis-visual.png",
    instructorName: "د. عمر الحسن",
    descriptionAr: "تعلم تحليل البيانات باستخدام Python و Pandas",
    descriptionEn: "Learn data analysis with Python and Pandas",
    requirementsAr: ["معرفة أساسية ببايثون"],
    requirementsEn: ["Basic Python knowledge"],
    outcomesAr: ["تحليل البيانات", "استخدام Pandas", "إنشاء تصورات بيانية"],
    outcomesEn: ["Analyze data", "Use Pandas", "Create visualizations"],
    modules: [],
  },
  {
    id: "course4",
    titleAr: "التسويق الرقمي",
    titleEn: "Digital Marketing",
    category: "تسويق",
    level: "beginner",
    durationHours: 15,
    price: null,
    thumbnailUrl: "/digital-marketing-strategy.png",
    instructorName: "لينا خالد",
    descriptionAr: "أساسيات التسويق الرقمي ووسائل التواصل الاجتماعي",
    descriptionEn: "Digital marketing and social media fundamentals",
    requirementsAr: ["لا توجد متطلبات"],
    requirementsEn: ["No prerequisites"],
    outcomesAr: ["فهم التسويق الرقمي", "إدارة حسابات التواصل"],
    outcomesEn: ["Understand digital marketing", "Manage social accounts"],
    modules: [],
  },
]

const seedProducts: Product[] = [
  {
    id: "prod1",
    type: "course_access",
    titleAr: "الوصول لدورة تطوير الويب",
    titleEn: "Web Development Course Access",
    price: 299,
    includesAr: ["وصول كامل للدورة", "شهادة إنجاز", "دعم فني"],
    includesEn: ["Full course access", "Certificate", "Technical support"],
    courseIds: ["course2"],
  },
  {
    id: "prod2",
    type: "course_access",
    titleAr: "الوصول لدورة تحليل البيانات",
    titleEn: "Data Analysis Course Access",
    price: 399,
    includesAr: ["وصول كامل للدورة", "شهادة إنجاز", "مشاريع عملية"],
    includesEn: ["Full course access", "Certificate", "Practical projects"],
    courseIds: ["course3"],
  },
  {
    id: "prod3",
    type: "bundle",
    titleAr: "حزمة المطور الكامل",
    titleEn: "Full Stack Developer Bundle",
    price: 599,
    includesAr: ["دورتان كاملتان", "شهادتان", "خصم 30%"],
    includesEn: ["Two complete courses", "Two certificates", "30% discount"],
    courseIds: ["course2", "course3"],
  },
]

// Initialize storage
export function initDb() {
  if (!getFromStorage("users", null)) {
    saveToStorage("users", seedUsers)
  }
  if (!getFromStorage("courses", null)) {
    saveToStorage("courses", seedCourses)
  }
  if (!getFromStorage("products", null)) {
    saveToStorage("products", seedProducts)
  }
  if (!getFromStorage("enrollments", null)) {
    saveToStorage("enrollments", [])
  }
  if (!getFromStorage("cart", null)) {
    saveToStorage("cart", [])
  }
  if (!getFromStorage("orders", null)) {
    saveToStorage("orders", [])
  }
  if (!getFromStorage("certificates", null)) {
    saveToStorage("certificates", [])
  }
}

// Users
export function getUser(id: string): User | null {
  const users = getFromStorage<User[]>("users", [])
  return users.find((u) => u.id === id) || null
}

export function getAllUsers(): User[] {
  return getFromStorage<User[]>("users", [])
}

export function updateUser(user: User) {
  const users = getFromStorage<User[]>("users", [])
  const index = users.findIndex((u) => u.id === user.id)
  if (index !== -1) {
    users[index] = user
    saveToStorage("users", users)
  }
}

// Courses
export function getAllCourses(): Course[] {
  return getFromStorage<Course[]>("courses", [])
}

export function getCourse(id: string): Course | null {
  const courses = getAllCourses()
  return courses.find((c) => c.id === id) || null
}

export function updateCourse(course: Course) {
  const courses = getAllCourses()
  const index = courses.findIndex((c) => c.id === course.id)
  if (index !== -1) {
    courses[index] = course
    saveToStorage("courses", courses)
  } else {
    courses.push(course)
    saveToStorage("courses", courses)
  }
}

// Enrollments
export function getEnrollments(userId: string): Enrollment[] {
  const enrollments = getFromStorage<Enrollment[]>("enrollments", [])
  return enrollments.filter((e) => e.userId === userId)
}

export function getEnrollment(userId: string, courseId: string): Enrollment | null {
  const enrollments = getFromStorage<Enrollment[]>("enrollments", [])
  return enrollments.find((e) => e.userId === userId && e.courseId === courseId) || null
}

export function createEnrollment(enrollment: Enrollment) {
  const enrollments = getFromStorage<Enrollment[]>("enrollments", [])
  enrollments.push(enrollment)
  saveToStorage("enrollments", enrollments)
}

export function updateEnrollment(enrollment: Enrollment) {
  const enrollments = getFromStorage<Enrollment[]>("enrollments", [])
  const index = enrollments.findIndex((e) => e.userId === enrollment.userId && e.courseId === enrollment.courseId)
  if (index !== -1) {
    enrollments[index] = enrollment
    saveToStorage("enrollments", enrollments)
  }
}

// Products
export function getAllProducts(): Product[] {
  return getFromStorage<Product[]>("products", [])
}

export function getProduct(id: string): Product | null {
  const products = getAllProducts()
  return products.find((p) => p.id === id) || null
}

// Cart
export function getCart(userId: string): CartItem[] {
  const cart = getFromStorage<CartItem[]>("cart", [])
  return cart.filter((item) => item.userId === userId)
}

export function addToCart(item: CartItem) {
  const cart = getFromStorage<CartItem[]>("cart", [])
  const existing = cart.find((i) => i.userId === item.userId && i.productId === item.productId)
  if (existing) {
    existing.qty += item.qty
  } else {
    cart.push(item)
  }
  saveToStorage("cart", cart)
}

export function removeFromCart(userId: string, productId: string) {
  const cart = getFromStorage<CartItem[]>("cart", [])
  const filtered = cart.filter((item) => !(item.userId === userId && item.productId === productId))
  saveToStorage("cart", filtered)
}

export function clearCart(userId: string) {
  const cart = getFromStorage<CartItem[]>("cart", [])
  const filtered = cart.filter((item) => item.userId !== userId)
  saveToStorage("cart", filtered)
}

// Orders
export function getAllOrders(): Order[] {
  return getFromStorage<Order[]>("orders", [])
}

export function getUserOrders(userId: string): Order[] {
  const orders = getAllOrders()
  return orders.filter((o) => o.userId === userId)
}

export function getOrder(id: string): Order | null {
  const orders = getAllOrders()
  return orders.find((o) => o.id === id) || null
}

export function createOrder(order: Order) {
  const orders = getAllOrders()
  orders.push(order)
  saveToStorage("orders", orders)

  // Auto-unlock purchased courses if PAID
  if (order.status === "PAID") {
    unlockPurchasedCourses(order)
  }
}

export function updateOrder(order: Order) {
  const orders = getAllOrders()
  const index = orders.findIndex((o) => o.id === order.id)
  if (index !== -1) {
    const oldStatus = orders[index].status
    orders[index] = order
    saveToStorage("orders", orders)

    // If status changed to PAID, unlock courses
    if (oldStatus !== "PAID" && order.status === "PAID") {
      unlockPurchasedCourses(order)
    }
  }
}

function unlockPurchasedCourses(order: Order) {
  const products = getAllProducts()
  order.items.forEach((item) => {
    const product = products.find((p) => p.id === item.productId)
    if (product && product.courseIds) {
      product.courseIds.forEach((courseId) => {
        let enrollment = getEnrollment(order.userId, courseId)
        if (!enrollment) {
          enrollment = {
            id: `enroll-${Date.now()}-${courseId}`,
            userId: order.userId,
            courseId,
            purchased: true,
            progressPct: 0,
            completedLessonIds: [],
            updatedAt: new Date().toISOString(),
          }
          createEnrollment(enrollment)
        } else {
          enrollment.purchased = true
          updateEnrollment(enrollment)
        }
      })
    }
  })
}

// Certificates
export function getAllCertificates(): Certificate[] {
  return getFromStorage<Certificate[]>("certificates", [])
}

export function getUserCertificates(userId: string): Certificate[] {
  const certificates = getAllCertificates()
  return certificates.filter((c) => c.userId === userId && !c.revoked)
}

export function getCertificate(id: string): Certificate | null {
  const certificates = getAllCertificates()
  return certificates.find((c) => c.id === id) || null
}

export function createCertificate(certificate: Certificate) {
  const certificates = getAllCertificates()
  certificates.push(certificate)
  saveToStorage("certificates", certificates)
}

export function updateCertificate(certificate: Certificate) {
  const certificates = getAllCertificates()
  const index = certificates.findIndex((c) => c.id === certificate.id)
  if (index !== -1) {
    certificates[index] = certificate
    saveToStorage("certificates", certificates)
  }
}

// Reset Database for dev/health page
export function resetDb() {
  if (typeof window === "undefined") return
  localStorage.clear()
  initDb()
}

// Seed More Data for comprehensive demo data
export function seedMoreData() {
  const courses = getAllCourses()
  if (courses.length >= 6) return // Already seeded

  const additionalCourses: Course[] = [
    {
      id: "course5",
      titleAr: "تصميم واجهات المستخدم",
      titleEn: "UI/UX Design",
      category: "تصميم",
      level: "beginner",
      durationHours: 20,
      price: 249,
      thumbnailUrl: "/ui-ux-design-mockup.png",
      instructorName: "ريم عبدالله",
      descriptionAr: "تعلم تصميم واجهات المستخدم الحديثة",
      descriptionEn: "Learn modern UI/UX design",
      requirementsAr: ["لا توجد متطلبات"],
      requirementsEn: ["No prerequisites"],
      outcomesAr: ["تصميم واجهات جذابة", "استخدام Figma"],
      outcomesEn: ["Design attractive interfaces", "Use Figma"],
      modules: [
        {
          id: "mod5",
          titleAr: "أساسيات التصميم",
          titleEn: "Design Basics",
          order: 1,
          lessons: [
            {
              id: "lesson7",
              titleAr: "مبادئ التصميم",
              titleEn: "Design Principles",
              type: "video",
              order: 1,
              durationMin: 30,
              isLocked: false,
            },
          ],
        },
      ],
    },
    {
      id: "course6",
      titleAr: "إدارة المشاريع",
      titleEn: "Project Management",
      category: "إدارة",
      level: "intermediate",
      durationHours: 16,
      price: null,
      thumbnailUrl: "/project-management-board.png",
      instructorName: "يوسف الشمري",
      descriptionAr: "أساسيات إدارة المشاريع الناجحة",
      descriptionEn: "Project management fundamentals",
      requirementsAr: ["لا توجد متطلبات"],
      requirementsEn: ["No prerequisites"],
      outcomesAr: ["إدارة الفرق", "تخطيط المشاريع"],
      outcomesEn: ["Manage teams", "Plan projects"],
      modules: [],
    },
  ]

  additionalCourses.forEach((course) => {
    courses.push(course)
  })
  saveToStorage("courses", courses)
}
