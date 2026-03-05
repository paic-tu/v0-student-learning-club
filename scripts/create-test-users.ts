import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"
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
    const password = "password123"
    const passwordHash = await bcrypt.hash(password, 10)

    const testUsers = [
      {
        email: "student@demo.com",
        name: "Demo Student",
        role: "student",
        bio: "I am a student learning on Neon.",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=student"
      },
      {
        email: "student@testing.com",
        name: "Testing Student",
        role: "student",
        bio: "Test student account",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=testing-student"
      },
      {
        email: "studemt@testing.com",
        name: "Testing Student (typo email)",
        role: "student",
        bio: "Test student account (as requested)",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=studemt"
      },
      {
        email: "instructor@demo.com",
        name: "Demo Instructor",
        role: "instructor",
        bio: "I teach courses on Neon.",
        headline: "Senior Software Engineer",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=instructor"
      },
      {
        email: "admin@demo.com",
        name: "Demo Admin",
        role: "admin",
        bio: "System Administrator",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin"
      }
    ]

    console.log("Creating test users...")

    // Dynamic import to ensure env vars are loaded first
    const { db } = await import("@/lib/db")
    const { users } = await import("@/lib/db/schema")
    const { eq } = await import("drizzle-orm")

    for (const userData of testUsers) {
      const existingUser = await db.select().from(users).where(eq(users.email, userData.email)).limit(1)

      if (existingUser.length > 0) {
        console.log(`Updating existing user: ${userData.email}`)
        await db.update(users).set({
          name: userData.name,
          role: userData.role as any,
          passwordHash: passwordHash, // Reset password
          bio: userData.bio,
          headline: userData.headline,
          avatarUrl: userData.avatarUrl,
          updatedAt: new Date()
        }).where(eq(users.email, userData.email))
      } else {
        console.log(`Creating new user: ${userData.email}`)
        await db.insert(users).values({
          email: userData.email,
          name: userData.name,
          role: userData.role as any,
          passwordHash: passwordHash,
          bio: userData.bio,
          headline: userData.headline,
          avatarUrl: userData.avatarUrl,
          isActive: true
        })
      }
    }

    console.log("\n✅ Test users created successfully!")
    console.log("\n---------------------------------------------------")
    console.log("Credentials for all accounts:")
    console.log("Password: password123")
    console.log("---------------------------------------------------")
    console.log("Student:    student@demo.com")
    console.log("Student:    student@testing.com")
    console.log("Student:    studemt@testing.com")
    console.log("Instructor: instructor@demo.com")
    console.log("Admin:      admin@demo.com")
    console.log("---------------------------------------------------")

  } catch (error) {
    console.error("Error creating users:", error)
    process.exit(1)
  } finally {
    process.exit(0)
  }
}

main()
