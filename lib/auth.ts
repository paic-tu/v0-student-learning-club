import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
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

          // Use Drizzle to fetch user
          const user = await db.query.users.findFirst({
            where: eq(users.email, email),
          })

          if (!user || !user.passwordHash) {
            console.log("[Auth] User not found or no password hash")
            return null
          }

          const passwordsMatch = await bcrypt.compare(password, user.passwordHash)

          if (passwordsMatch) {
            console.log("[Auth] Password match, returning user:", user.id)
            return {
              id: user.id,
              email: user.email,
              name: user.name || "",
              role: user.role || "student",
              image: user.avatarUrl || null,
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
        console.log("[Auth] JWT callback - user logged in:", user.id, "role:", user.role)
        token.id = user.id
        token.role = user.role || "student" // Ensure role is set
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        console.log("[Auth] Session callback - token:", token.sub, "role:", token.role)
        session.user.id = token.id as string
        session.user.role = (token.role as string) || "student"
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
