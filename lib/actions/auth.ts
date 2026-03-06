"use server"

import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { z } from "zod"

import { signIn } from "@/lib/auth"
import { AuthError } from "next-auth"

export async function loginAction(prevState: any, formData: FormData) {
  try {
    const email = formData.get("email")
    const password = formData.get("password")

    if (!email || !password) {
      return { error: "Email and password are required" }
    }

    console.log("[Auth Action] Attempting login for:", email)

    const redirectTo = formData.get("redirectTo") as string | undefined

    await signIn("credentials", {
      email,
      password,
      redirectTo: redirectTo || undefined,
    })
    
    console.log("[Auth Action] Login successful")
    return { success: true }
  } catch (error) {
    console.error("[Auth Action] Detailed Error:", error)
    
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid credentials." }
        default:
          return { error: "Authentication failed." }
      }
    }

    // Rethrow redirect errors
    throw error
  }
}

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
})

export async function registerAction(formData: FormData) {
  const name = formData.get("name")
  const email = formData.get("email")
  const password = formData.get("password")

  if (!name || !email || !password) {
    return { error: "Missing required fields" }
  }

  const validatedFields = registerSchema.safeParse({ name, email, password })

  if (!validatedFields.success) {
    return { error: "Invalid input" }
  }

  const data = validatedFields.data

  try {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, data.email),
    })

    if (existingUser) {
      return { error: "Email already registered" }
    }

    const passwordHash = await bcrypt.hash(data.password, 10)

    await db.insert(users).values({
      name: data.name,
      email: data.email,
      passwordHash,
      role: "student",
    })

    return { success: true }
  } catch (error) {
    console.error("Registration error:", error)
    return { error: "Registration failed" }
  }
}
