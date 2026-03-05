import { drizzle } from "drizzle-orm/neon-http"
import { neon } from "@neondatabase/serverless"
import * as schema from "./schema"

const databaseUrl = process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL

if (!databaseUrl) {
  console.warn("DATABASE_URL_POOLED or DATABASE_URL environment variable is not set. Database calls will fail.")
}

const sql = neon(databaseUrl || "postgres://user:pass@host/db")
export const db = drizzle(sql, { schema })
