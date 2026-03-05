import { hash } from "bcryptjs"

async function seed() {
  // Set env var before importing db
  process.env.DATABASE_URL = "postgresql://neondb_owner:npg_wQIfhX8gvT9e@ep-falling-cloud-a424l6xo-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require";
  
  const { db } = await import("../lib/db/index");
  const { users, categories, courses } = await import("../lib/db/schema");

  console.log("Seeding data...")

  try {
    // Create Instructor
    const passwordHash = await hash("password", 10)
    const [instructor] = await db.insert(users).values({
      email: "instructor@neon.edu",
      name: "Dr. Ahmed",
      passwordHash,
      role: "instructor",
      bio: "Senior Instructor at Neon",
    }).returning()
    console.log("Instructor created:", instructor.id)

    // Create Categories
    const [catDev] = await db.insert(categories).values({
      nameEn: "Development",
      nameAr: "تطوير البرمجيات",
      slug: "development",
      descriptionEn: "Learn coding and software development",
      descriptionAr: "تعلم البرمجة وتطوير البرمجيات",
    }).returning()
    console.log("Category created:", catDev.nameEn)

    const [catDesign] = await db.insert(categories).values({
      nameEn: "Design",
      nameAr: "التصميم",
      slug: "design",
      descriptionEn: "Learn UI/UX and Graphic Design",
      descriptionAr: "تعلم تصميم واجهات المستخدم والجرافيك",
    }).returning()
    console.log("Category created:", catDesign.nameEn)

    // Create Courses
    await db.insert(courses).values([
      {
        titleEn: "Full Stack Web Development",
        titleAr: "تطوير الويب المتكامل",
        descriptionEn: "Learn React, Node.js, and Postgres. Build complete web applications from scratch.",
        descriptionAr: "تعلم React و Node.js و Postgres. قم ببناء تطبيقات ويب كاملة من الصفر.",
        slug: "full-stack-web-development",
        instructorId: instructor.id,
        categoryId: catDev.id,
        difficulty: "beginner",
        price: "199.00",
        isPublished: true,
        thumbnailUrl: "https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
      },
      {
        titleEn: "UI/UX Design Masterclass",
        titleAr: "احتراف تصميم تجربة المستخدم",
        descriptionEn: "Master Figma and Design Principles. Create beautiful and functional interfaces.",
        descriptionAr: "احترف فيجما ومبادئ التصميم. قم بإنشاء واجهات جميلة وعملية.",
        slug: "ui-ux-design-masterclass",
        instructorId: instructor.id,
        categoryId: catDesign.id,
        difficulty: "intermediate",
        price: "149.00",
        isPublished: true,
        thumbnailUrl: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
      }
    ])
    console.log("Courses created.")

    console.log("Seeding complete.")
  } catch (error) {
    console.error("Seeding failed:", error)
  }
}

seed().catch(console.error)
