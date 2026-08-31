
import * as schema from "./schema"

const databaseUrl = process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL

let db: any
let client: any

if (databaseUrl) {
  const { drizzle } = require("drizzle-orm/neon-http")
  const { neon } = require("@neondatabase/serverless")
  const connection = neon(databaseUrl)
  client = connection
  db = drizzle(connection, { schema })
} else {
  // Local dev fallback: no DATABASE_URL configured, use an embedded
  // Postgres-compatible database on disk so the app is still usable locally.
  console.warn("DATABASE_URL not set — using local PGlite database at ./.local-db")
  const { drizzle } = require("drizzle-orm/pglite")
  const { PGlite } = require("@electric-sql/pglite")
  const pglite = new PGlite("./.local-db")
  client = pglite
  db = drizzle(pglite, { schema })
}

export { client, db }
