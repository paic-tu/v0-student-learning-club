import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"
import { z } from "zod"

if (!process.env.AUTH_SECRET && process.env.NEXTAUTH_SECRET) {
  process.env.AUTH_SECRET = process.env.NEXTAUTH_SECRET
}

// Fallback for development to prevent crash if secret is missing
if (!process.env.AUTH_SECRET) {
  console.warn("AUTH_SECRET or NEXTAUTH_SECRET is not set. Auth will fail.")
  if (process.env.NODE_ENV !== "production") {
    process.env.AUTH_SECRET = "dev-secret-key-change-me"
  }
}

if (!process.env.AUTH_URL && process.env.NEXTAUTH_URL) {
  process.env.AUTH_URL = process.env.NEXTAUTH_URL
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export interface User {
  id: string
  name: string
  email: string
  role: string
  image?: string | null
}

let sql: ReturnType<typeof neon> | null = null
function getSql() {
  if (sql) return sql
  const databaseUrl = process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error("DATABASE_URL_POOLED or DATABASE_URL is not set")
  }
  sql = neon(databaseUrl)
  return sql
}

let usersColumnsCache: Set<string> | null = null
async function getUsersColumns(): Promise<Set<string>> {
  if (usersColumnsCache) return usersColumnsCache
  const cols = await getSql()`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users'
  `
  usersColumnsCache = new Set((cols as any[]).map((r: any) => r.column_name))
  return usersColumnsCache
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        try {
          console.log("[Auth] Authorize called with:", credentials?.email)
          const validatedFields = loginSchema.safeParse(credentials)

          if (!validatedFields.success) {
            console.log("[Auth] Validation failed:", validatedFields.error)
            return null
          }

          const { email, password } = validatedFields.data

          // Select minimal guaranteed columns, add optional columns if they exist
          const cols = await getUsersColumns()
          const selectRole = cols.has("role")
          const selectName = cols.has("name")
          let rows: any
          if (selectRole && selectName) {
            rows = (await getSql()`
              SELECT id, email, name, role, password_hash
              FROM users
              WHERE email = ${email}
              LIMIT 1
            `) as any
          } else if (selectRole && !selectName) {
            rows = (await getSql()`
              SELECT id, email, role, password_hash
              FROM users
              WHERE email = ${email}
              LIMIT 1
            `) as any
          } else if (!selectRole && selectName) {
            rows = (await getSql()`
              SELECT id, email, name, password_hash
              FROM users
              WHERE email = ${email}
              LIMIT 1
            `) as any
          } else {
            rows = (await getSql()`
              SELECT id, email, password_hash
              FROM users
              WHERE email = ${email}
              LIMIT 1
            `) as any
          }
          const user = (rows as any[])?.[0] as any | undefined

          if (!user || !user.password_hash) {
            console.log("[Auth] User not found or no password hash")
            return null
          }

          const passwordsMatch = await bcrypt.compare(password, user.password_hash)

          if (passwordsMatch) {
            console.log("[Auth] Password match, returning user:", user.id)
            return {
              id: user.id,
              email: user.email,
              name: user.name || null,
              role: user.role || "student",
            }
          }

          console.log("[Auth] Password mismatch")
          return null
        } catch (error) {
          console.error("[Auth] Authorize error:", error)
          return null
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
})

export const getCurrentUser = async () => {
  const session = await auth()
  return session?.user
}
