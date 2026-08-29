import fs from "fs"
import path from "path"

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
    console.log("Adding demo course content...")

    const { db } = await import("@/lib/db")
    const { courses, modules, lessons, assignments, challenges } = await import("@/lib/db/schema")
    const { eq, and } = await import("drizzle-orm")

    const courseSlug = "nextjs-masterclass"
    const course = await db.query.courses.findFirst({ where: eq(courses.slug, courseSlug) })
    if (!course) throw new Error("Demo course not found — run create-demo-course.ts first")

    // --- Module 1 (existing "Getting Started"): add a 2nd lesson ---
    const module1 = await db.query.modules.findFirst({
      where: and(eq(modules.courseId, course.id), eq(modules.titleEn, "Getting Started")),
    })
    if (!module1) throw new Error("Module 1 (Getting Started) not found")

    const module1Lesson2Title = "Routing and Layouts"
    let module1Lesson2 = await db.query.lessons.findFirst({
      where: and(eq(lessons.moduleId, module1.id), eq(lessons.titleEn, module1Lesson2Title)),
    })
    if (!module1Lesson2) {
      console.log(`Creating lesson: ${module1Lesson2Title}`)
      ;[module1Lesson2] = await db
        .insert(lessons)
        .values({
          moduleId: module1.id,
          courseId: course.id,
          titleEn: module1Lesson2Title,
          titleAr: "التوجيه والتخطيطات",
          slug: "routing-and-layouts",
          descriptionEn: "Learn how the App Router handles routing, layouts, and nested pages.",
          descriptionAr: "تعرّف على كيفية تعامل App Router مع التوجيه والتخطيطات والصفحات المتداخلة.",
          type: "video",
          videoUrl: "https://www.youtube.com/watch?v=gSSsZReIFRk",
          videoProvider: "youtube",
          durationMinutes: 14,
          orderIndex: 2,
          status: "published",
          isPreview: false,
        })
        .returning()
    } else {
      console.log(`Lesson already exists: ${module1Lesson2Title}`)
    }

    // --- Module 2: new module with 2 lessons ---
    const module2Title = "Advanced Concepts"
    let module2 = await db.query.modules.findFirst({
      where: and(eq(modules.courseId, course.id), eq(modules.titleEn, module2Title)),
    })
    if (!module2) {
      console.log(`Creating module: ${module2Title}`)
      ;[module2] = await db
        .insert(modules)
        .values({
          courseId: course.id,
          titleEn: module2Title,
          titleAr: "مفاهيم متقدمة",
          orderIndex: 2,
        })
        .returning()
    } else {
      console.log(`Module already exists: ${module2Title}`)
    }

    const module2LessonDefs = [
      {
        titleEn: "Server Actions Deep Dive",
        titleAr: "التعمق في Server Actions",
        slug: "server-actions-deep-dive",
        descriptionEn: "Understand how Server Actions work and when to use them.",
        descriptionAr: "افهم كيف تعمل Server Actions ومتى تستخدمها.",
        videoUrl: "https://www.youtube.com/watch?v=dDpZfOQBMaU",
        durationMinutes: 18,
        orderIndex: 1,
      },
      {
        titleEn: "Deploying to Production",
        titleAr: "النشر للإنتاج",
        slug: "deploying-to-production",
        descriptionEn: "Ship your Next.js app to production with confidence.",
        descriptionAr: "انشر تطبيق Next.js الخاص بك للإنتاج بثقة.",
        videoUrl: "https://www.youtube.com/watch?v=2HBIzEx6IZA",
        durationMinutes: 12,
        orderIndex: 2,
      },
    ]

    for (const def of module2LessonDefs) {
      const existing = await db.query.lessons.findFirst({
        where: and(eq(lessons.moduleId, module2.id), eq(lessons.titleEn, def.titleEn)),
      })
      if (!existing) {
        console.log(`Creating lesson: ${def.titleEn}`)
        await db.insert(lessons).values({
          moduleId: module2.id,
          courseId: course.id,
          titleEn: def.titleEn,
          titleAr: def.titleAr,
          slug: def.slug,
          descriptionEn: def.descriptionEn,
          descriptionAr: def.descriptionAr,
          type: "video",
          videoUrl: def.videoUrl,
          videoProvider: "youtube",
          durationMinutes: def.durationMinutes,
          orderIndex: def.orderIndex,
          status: "published",
          isPreview: false,
        })
      } else {
        console.log(`Lesson already exists: ${def.titleEn}`)
      }
    }

    // --- Assignment ---
    const assignmentTitle = "Build a Blog with the App Router"
    let assignment = await db.query.assignments.findFirst({
      where: and(eq(assignments.courseId, course.id), eq(assignments.titleEn, assignmentTitle)),
    })
    if (!assignment) {
      console.log(`Creating assignment: ${assignmentTitle}`)
      const dueAt = new Date()
      dueAt.setDate(dueAt.getDate() + 14)
      ;[assignment] = await db
        .insert(assignments)
        .values({
          courseId: course.id,
          titleEn: assignmentTitle,
          titleAr: "بناء مدونة باستخدام App Router",
          descriptionEn: "Build a small blog using the Next.js App Router with at least 3 pages and dynamic routing.",
          descriptionAr: "ابنِ مدونة صغيرة باستخدام App Router بحيث تحتوي على 3 صفحات على الأقل وتوجيه ديناميكي.",
          dueAt,
          isPublished: true,
          createdById: course.instructorId,
        })
        .returning()
    } else {
      console.log(`Assignment already exists: ${assignmentTitle}`)
    }

    // --- Quiz ---
    const quizTitle = "Next.js Fundamentals Quiz"
    let quiz = await db.query.challenges.findFirst({
      where: and(eq(challenges.courseId, course.id), eq(challenges.titleEn, quizTitle)),
    })
    if (!quiz) {
      console.log(`Creating quiz: ${quizTitle}`)
      const questions = [
        {
          question: "What command creates a new Next.js app?",
          options: ["npx create-next-app", "npm init next", "next new", "npx new-next"],
          answer: 0,
          points: 1,
        },
        {
          question: "Which file defines a route's UI in the App Router?",
          options: ["route.tsx", "page.tsx", "index.tsx", "app.tsx"],
          answer: 1,
          points: 1,
        },
        {
          question: "What do Server Actions let you do?",
          options: [
            "Run client-only animations",
            "Mutate data directly from Server Components/forms",
            "Style components",
            "Cache images",
          ],
          answer: 1,
          points: 1,
        },
      ]
      ;[quiz] = await db
        .insert(challenges)
        .values({
          titleEn: quizTitle,
          titleAr: "كويز أساسيات Next.js",
          descriptionEn: "Test your understanding of Next.js fundamentals covered in this course.",
          descriptionAr: "اختبر فهمك لأساسيات Next.js اللي تناولتها هذي الدورة.",
          type: "quiz",
          difficulty: "beginner",
          points: 10,
          timeLimit: 15,
          testCases: questions,
          solution: "",
          courseId: course.id,
          instructorId: course.instructorId,
          isActive: true,
        })
        .returning()
    } else {
      console.log(`Quiz already exists: ${quizTitle}`)
    }

    console.log("\n✅ Demo content added!")
    console.log(`Course: ${course.titleEn}`)
    console.log(`Modules: Getting Started (2 lessons), Advanced Concepts (2 lessons)`)
    console.log(`Assignment: ${assignmentTitle}`)
    console.log(`Quiz: ${quizTitle}`)
  } catch (error) {
    console.error("Error adding demo content:", error)
    process.exit(1)
  } finally {
    process.exit(0)
  }
}

main()
