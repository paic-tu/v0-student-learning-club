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
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export async function registerAction(formData: FormData) {
  try {
    const name = formData.get("name")
    const email = formData.get("email")
    const password = formData.get("password")

    if (!name || !email || !password) {
      return { error: "Missing required fields" }
    }

    // Validate input types
    if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string") {
       return { error: "Invalid input format" }
    }

    const validatedFields = registerSchema.safeParse({ name, email, password })

    if (!validatedFields.success) {
      return { error: validatedFields.error.errors[0].message }
    }

    const data = validatedFields.data

    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, data.email),
    })

    if (existingUser) {
      console.log("Email already registered:", data.email)
      return { error: "Email already registered" }
    }

    console.log("Hashing password...")
    const passwordHash = await bcrypt.hash(data.password, 10)

    console.log("Inserting user into database...")
    await db.insert(users).values({
      name: data.name,
      email: data.email,
      passwordHash,
      role: "student",
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    console.log("User inserted successfully")

    return { success: true }
  } catch (error) {
    console.error("Registration error details:", error)
    if (error instanceof Error) {
        console.error("Error message:", error.message)
        console.error("Error stack:", error.stack)
    }
    return { error: "Registration failed. Please try again later." }
  }
}
