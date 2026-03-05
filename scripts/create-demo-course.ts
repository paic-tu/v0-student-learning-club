
import fs from "fs"
import path from "path"
import bcrypt from "bcryptjs"

// Load .env manually
const envPath = path.resolve(process.cwd(), ".env")
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8")
  envConfig.split("\n").forEach((line) => {
    const [key, value] = line.split("=")
    if (key && value) {
      process.env[key.trim()] = value.trim().replace(/^"|"$/g, "")
    }
  })
}

async function main() {
  try {
    console.log("Starting demo course creation...")

    // Dynamic import to ensure env vars are loaded first
    const { db } = await import("@/lib/db")
    const { users, courses, modules, lessons, enrollments, categories } = await import("@/lib/db/schema")
    const { eq } = await import("drizzle-orm")

    // 1. Ensure Users Exist
    const studentEmail = "student@demo.com"
    const instructorEmail = "instructor@demo.com"
    const password = "password123"
    const passwordHash = await bcrypt.hash(password, 10)

    // Check/Create Student
    let student = await db.query.users.findFirst({
      where: eq(users.email, studentEmail),
    })

    if (!student) {
      console.log(`Creating student: ${studentEmail}`)
      const [newStudent] = await db.insert(users).values({
        email: studentEmail,
        name: "Demo Student",
        role: "student",
        passwordHash,
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=student",
        isActive: true,
      }).returning()
      student = newStudent
    } else {
      console.log(`Found student: ${studentEmail}`)
    }

    // Check/Create Instructor
    let instructor = await db.query.users.findFirst({
      where: eq(users.email, instructorEmail),
    })

    if (!instructor) {
      console.log(`Creating instructor: ${instructorEmail}`)
      const [newInstructor] = await db.insert(users).values({
        email: instructorEmail,
        name: "Demo Instructor",
        role: "instructor",
        passwordHash,
        headline: "Senior Software Engineer",
        bio: "Expert in Next.js and React",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=instructor",
        isActive: true,
      }).returning()
      instructor = newInstructor
    } else {
      console.log(`Found instructor: ${instructorEmail}`)
    }

    // 2. Ensure Category Exists
    let category = await db.query.categories.findFirst({
      where: eq(categories.slug, "web-development"),
    })

    if (!category) {
      console.log("Creating category: Web Development")
      const [newCategory] = await db.insert(categories).values({
        nameEn: "Web Development",
        nameAr: "تطوير الويب",
        slug: "web-development",
        descriptionEn: "Learn modern web development technologies",
        descriptionAr: "تعلم تقنيات تطوير الويب الحديثة",
      }).returning()
      category = newCategory
    }

    // 3. Create Course
    const courseSlug = "nextjs-masterclass"
    let course = await db.query.courses.findFirst({
      where: eq(courses.slug, courseSlug),
    })

    if (!course) {
      console.log("Creating course: Next.js Masterclass")
      const [newCourse] = await db.insert(courses).values({
        titleEn: "Next.js 14 Masterclass",
        titleAr: "دورة Next.js 14 الشاملة",
        slug: courseSlug,
        descriptionEn: "Master Next.js 14 with the App Router, Server Actions, and more.",
        descriptionAr: "اتقن Next.js 14 مع App Router و Server Actions والمزيد.",
        instructorId: instructor.id,
        categoryId: category.id,
        difficulty: "intermediate",
        language: "en",
        price: "0",
        isFree: true,
        isPublished: true,
        thumbnailUrl: "https://assets.vercel.com/image/upload/v1662130559/nextjs/icon.png",
        tags: ["Next.js", "React", "TypeScript"],
        requirements: ["Basic React knowledge", "JavaScript fundamentals"],
        learningOutcomes: ["Build full-stack apps", "Understand Server Components", "Deploy to Vercel"],
      }).returning()
      course = newCourse
    } else {
      console.log(`Course already exists: ${course.titleEn}`)
    }

    // 4. Create Module
    const moduleTitle = "Getting Started"
    let courseModule = await db.query.modules.findFirst({
      where: (modules, { and, eq }) => and(
        eq(modules.courseId, course!.id),
        eq(modules.titleEn, moduleTitle)
      ),
    })

    if (!courseModule) {
      console.log(`Creating module: ${moduleTitle}`)
      const [newModule] = await db.insert(modules).values({
        courseId: course.id,
        titleEn: moduleTitle,
        titleAr: "البداية",
        orderIndex: 1,
      }).returning()
      courseModule = newModule
    }

    // 5. Create Lesson
    const lessonTitle = "Introduction to Next.js"
    let lesson = await db.query.lessons.findFirst({
      where: (lessons, { and, eq }) => and(
        eq(lessons.moduleId, courseModule!.id),
        eq(lessons.titleEn, lessonTitle)
      ),
    })

    if (!lesson) {
      console.log(`Creating lesson: ${lessonTitle}`)
      const [newLesson] = await db.insert(lessons).values({
        moduleId: courseModule.id,
        courseId: course.id,
        titleEn: lessonTitle,
        titleAr: "مقدمة في Next.js",
        slug: "intro-to-nextjs",
        descriptionEn: "An overview of what Next.js is and why you should use it.",
        descriptionAr: "نظرة عامة على ماهية Next.js ولماذا يجب عليك استخدامه.",
        type: "video",
        videoUrl: "https://www.youtube.com/watch?v=__mSgDEOyv8", // Example video
        videoProvider: "youtube",
        durationMinutes: 10,
        orderIndex: 1,
        status: "published",
        isPreview: true,
      }).returning()
      lesson = newLesson
    }

    // 6. Enroll Student
    let enrollment = await db.query.enrollments.findFirst({
      where: (enrollments, { and, eq }) => and(
        eq(enrollments.userId, student!.id),
        eq(enrollments.courseId, course!.id)
      ),
    })

    if (!enrollment) {
      console.log(`Enrolling student: ${studentEmail}`)
      await db.insert(enrollments).values({
        userId: student.id,
        courseId: course.id,
        status: "active",
        progress: 0,
        completedLessons: [],
      })
      console.log("Enrollment successful!")
    } else {
      console.log("Student already enrolled.")
    }

    console.log("\n✅ Demo setup complete!")
    console.log(`Course: ${course.titleEn}`)
    console.log(`Student: ${student.email}`)
    console.log(`Password: ${password}`)

  } catch (error) {
    console.error("Error creating demo course:", error)
    process.exit(1)
  } finally {
    process.exit(0)
  }
}

main()
