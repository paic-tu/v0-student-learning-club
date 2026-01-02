"use server"

import { cookies } from "next/headers"
import { neon } from "@neondatabase/serverless"
import crypto from "crypto"
import bcrypt from "bcryptjs"

const sql = neon(process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL!)

export type User = {
  id: number
  email: string
  name: string
  role: "student" | "instructor" | "admin"
  avatar_url: string | null
  bio: string | null
  points: number
  level: number
  created_at: Date
  updated_at: Date
}

export type Session = {
  id: number
  user_id: number
  token: string
  expires_at: Date
  created_at: Date
}

const SALT_ROUNDS = 10
const DEBUG_AUTH = false

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    const isValid = await bcrypt.compare(password, hash)
    return isValid
  } catch (error) {
    if (DEBUG_AUTH) {
      console.error("[Auth] Password verification error:", error)
    }
    return false
  }
}

// Generate session token
function generateToken(): string {
  return crypto.randomBytes(32).toString("hex")
}

async function executeWithRetry<T>(fn: () => Promise<T>, maxRetries = 3, delayMs = 100): Promise<T> {
  let lastError: Error | null = null

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      if (DEBUG_AUTH) {
        console.error(`[Auth] Attempt ${i + 1}/${maxRetries} failed:`, lastError.message)
      }

      // Don't retry on non-network errors
      if (error instanceof Error && !error.message.includes("Failed to fetch")) {
        throw error
      }

      if (i < maxRetries - 1) {
        // Exponential backoff: 100ms, 200ms, 400ms
        const delay = delayMs * Math.pow(2, i)
        if (DEBUG_AUTH) {
          console.log(`[Auth] Retrying in ${delay}ms...`)
        }
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError
}

// Get user by session token
export async function getUserBySession(token: string): Promise<User | null> {
  try {
    const result = await executeWithRetry(
      () =>
        sql`
        SELECT u.* FROM users u
        JOIN sessions s ON u.id = s.user_id
        WHERE s.token = ${token}
        AND s.expires_at > NOW()
        LIMIT 1
      `,
      3,
      100,
    )

    const user = (result[0] as User) || null
    if (user && DEBUG_AUTH) {
      console.log("[Auth] User loaded from session:", user.email)
    }
    return user
  } catch (error) {
    if (DEBUG_AUTH) {
      console.error("[Auth] Error getting user by session:", error)
    }
    // Return null to allow graceful degradation, but log the error
    return null
  }
}

// Get current user from cookies
export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("session_token")?.value

  if (!token) {
    if (DEBUG_AUTH) {
      console.log("[Auth] No session token found in cookies")
    }
    return null
  }

  return getUserBySession(token)
}

export async function login(
  email: string,
  password: string,
): Promise<{ success: boolean; error?: string; user?: User }> {
  try {
    // Find user by email only
    const users = await sql`
      SELECT * FROM users
      WHERE email = ${email}
      LIMIT 1
    `

    if (users.length === 0) {
      return { success: false, error: "EMAIL_NOT_FOUND" }
    }

    const user = users[0] as User & { password_hash: string }

    // Verify password with bcrypt
    const isValidPassword = await verifyPassword(password, user.password_hash)

    if (!isValidPassword) {
      return { success: false, error: "INVALID_PASSWORD" }
    }

    // Create session
    const token = generateToken()
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

    await sql`
      INSERT INTO sessions (user_id, token, expires_at)
      VALUES (${user.id}, ${token}, ${expiresAt})
    `

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set("session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    })

    // Remove password_hash from returned user
    const { password_hash: _, ...safeUser } = user
    return { success: true, user: safeUser as User }
  } catch (error) {
    if (DEBUG_AUTH) {
      console.error("[Auth] Login error:", error)
    }
    return { success: false, error: "LOGIN_ERROR" }
  }
}

export async function register(
  email: string,
  password: string,
  name: string,
): Promise<{ success: boolean; error?: string; user?: User }> {
  try {
    // Check if user exists
    const existingUsers = await sql`
      SELECT id FROM users WHERE email = ${email} LIMIT 1
    `

    if (existingUsers.length > 0) {
      return { success: false, error: "Email already registered" }
    }

    // Hash password with bcrypt
    const passwordHash = await hashPassword(password)

    // Create user
    const users = await sql`
      INSERT INTO users (email, password_hash, name, role)
      VALUES (${email}, ${passwordHash}, ${name}, 'student')
      RETURNING *
    `

    const user = users[0] as User & { password_hash: string }

    // Create session
    const token = generateToken()
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

    await sql`
      INSERT INTO sessions (user_id, token, expires_at)
      VALUES (${user.id}, ${token}, ${expiresAt})
    `

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set("session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    })

    // Remove password_hash from returned user
    const { password_hash: _, ...safeUser } = user
    return { success: true, user: safeUser as User }
  } catch (error) {
    if (DEBUG_AUTH) {
      console.error("[Auth] Register error:", error)
    }
    return { success: false, error: "An error occurred during registration" }
  }
}

// Logout
export async function logout(): Promise<void> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("session_token")?.value

    if (token) {
      // Delete session from database
      await sql`
        DELETE FROM sessions WHERE token = ${token}
      `
    }

    // Clear cookie
    cookieStore.delete("session_token")
  } catch (error) {
    if (DEBUG_AUTH) {
      console.error("[Auth] Logout error:", error)
    }
  }
}

// Clean up expired sessions (can be called periodically)
export async function cleanupExpiredSessions(): Promise<void> {
  try {
    await sql`
      DELETE FROM sessions WHERE expires_at < NOW()
    `
  } catch (error) {
    if (DEBUG_AUTH) {
      console.error("[Auth] Cleanup sessions error:", error)
    }
  }
}
