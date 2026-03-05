import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
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
    const email = "mohsen.alghamdi1@hotmail.com"
    console.log(`Checking for user with email: ${email}`)

    // Dynamic import to ensure env vars are loaded first
    const { db } = await import("@/lib/db")
    const { users } = await import("@/lib/db/schema")
    const { eq } = await import("drizzle-orm")

    const user = await db.select().from(users).where(eq(users.email, email)).limit(1)

    if (user.length === 0) {
      console.log("User not found.")
      process.exit(1)
    }

    console.log(`User found: ${user[0].name} (ID: ${user[0].id}, Role: ${user[0].role})`)

    if (user[0].role === "admin") {
      console.log("User is already an admin.")
      process.exit(0)
    }

    console.log("Updating user role to admin...")
    await db.update(users).set({ role: "admin" }).where(eq(users.email, email))
    console.log("User role updated successfully.")

  } catch (error) {
    console.error("Error:", error)
    process.exit(1)
  } finally {
    process.exit(0)
  }
}

main()
