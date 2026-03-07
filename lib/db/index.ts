import { drizzle } from "drizzle-orm/neon-http"
import { neon } from "@neondatabase/serverless"
import * as schema from "./schema"

const databaseUrl = process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL

if (!databaseUrl) {
  console.warn("DATABASE_URL_POOLED or DATABASE_URL environment variable is not set. Database calls will fail.")
}

// Neon client - strictly tagged template literal
const connection = neon(databaseUrl || "postgres://user:pass@host/db")

// Wrapper to support both tagged template (new Neon API) and function call (Drizzle legacy)
const sql: typeof connection = ((stringsOrQuery: any, ...params: any[]) => {
  if (typeof stringsOrQuery === "string") {
    // Handle function call from Drizzle (e.g. for db.insert)
    // params[0] is values array, params[1] is options object
    try {
      // @ts-ignore - query exists on neon client v1.0.2+
      return connection.query(stringsOrQuery, params[0], params[1])
    } catch (err) {
      console.error("[DB Wrapper] Error executing query string:", err)
      throw err
    }
  }
  // Handle tagged template call (e.g. client`SELECT...`)
  return connection(stringsOrQuery, ...params)
}) as any

// Copy properties (like .transaction, .query) from original connection
Object.assign(sql, connection)

export const client = sql
export const db = drizzle(sql, { schema })
