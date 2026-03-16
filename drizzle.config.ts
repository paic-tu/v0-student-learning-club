import type { Config } from "drizzle-kit"

export default {
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dialect: "postgresql",
  schemaFilter: ["public"],
  migrations: {
    schema: "public",
  },
  dbCredentials: {
    url: process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL!,
  },
} satisfies Config
