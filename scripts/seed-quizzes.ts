
import { drizzle } from "drizzle-orm/neon-http"
import { neon } from "@neondatabase/serverless"
import * as schema from "../lib/db/schema"

// Read from environment instead of hardcoding secrets

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error("DATABASE_URL not set")

const sql = neon(databaseUrl)
const db = drizzle(sql, { schema })

async function main() {
  console.log("Seeding quizzes...")

  // Get a category
  const category = await db.query.categories.findFirst()
  if (!category) {
      console.error("No categories found. Run seed-data.ts first.")
      return
  }

  // Create a Quiz Challenge
  await db.insert(schema.challenges).values({
    titleEn: "General Knowledge Quiz",
    titleAr: "اختبار المعلومات العامة",
    descriptionEn: "Test your general knowledge with this simple quiz.",
    descriptionAr: "اختبر معلوماتك العامة مع هذا الاختبار البسيط.",
    type: "quiz",
    difficulty: "beginner",
    points: 100,
    categoryId: category.id,
    testCases: [
      {
        id: 1,
        question: "What is the capital of Saudi Arabia?",
        options: ["Jeddah", "Riyadh", "Dammam", "Mecca"],
        answer: "Riyadh"
      },
      {
        id: 2,
        question: "Which framework is used in this project?",
        options: ["Vue", "Angular", "Next.js", "Svelte"],
        answer: "Next.js"
      },
      {
          id: 3,
          question: "What does HTML stand for?",
          options: [
              "Hyper Text Preprocessor",
              "Hyper Text Markup Language",
              "Hyper Text Multiple Language",
              "Hyper Tool Multi Language"
          ],
          answer: "Hyper Text Markup Language"
      }
    ]
  })

  console.log("Quizzes seeded!")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
