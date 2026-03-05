import { neon } from "@neondatabase/serverless"

// Hardcoded for script execution to avoid dotenv issues
const databaseUrl = "postgresql://neondb_owner:npg_wQIfhX8gvT9e@ep-falling-cloud-a424l6xo-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"

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
