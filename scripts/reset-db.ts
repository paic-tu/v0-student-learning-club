import { neon } from "@neondatabase/serverless"

// Read from environment variable
const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set")
}

const sql = neon(databaseUrl)

async function reset() {
  console.log("Resetting database...")
  try {
    await sql`DROP SCHEMA public CASCADE;`
    await sql`CREATE SCHEMA public;`
    console.log("Database reset complete.")
  } catch (error) {
    console.error("Error resetting database:", error)
    process.exit(1)
  }
}

reset()
