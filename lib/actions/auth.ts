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
  } catch (error: any) {
    console.error("[Auth Action] Detailed Error:", error)
    
    // Check for specific database quota error
    if (error?.message?.includes("data transfer quota") || error?.cause?.message?.includes("data transfer quota")) {
      return { error: "Service unavailable: Data transfer quota exceeded. Please try again later." }
    }

    if (error instanceof AuthError) {
      // Check if the cause is the quota error
      if ((error.cause as any)?.message?.includes("data transfer quota")) {
         return { error: "Service unavailable: Data transfer quota exceeded. Please try again later." }
      }

      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid credentials." }
        case "CallbackRouteError":
            // Check if the underlying error is the quota error
            if ((error.cause?.err as any)?.message?.includes("data transfer quota")) {
                return { error: "Service unavailable: Data transfer quota exceeded. Please try again later." }
            }
            return { error: "Authentication failed." }
        default:
          return { error: "Authentication failed." }
      }
    }

    // Rethrow redirect errors (Next.js redirects are thrown as errors)
    if (error.message === "NEXT_REDIRECT" || error.digest?.startsWith("NEXT_REDIRECT")) {
        throw error
    }
    
    // Check for generic error message from Neon
    if (error?.message?.includes("503") || error?.message?.includes("402")) {
         return { error: "Service temporarily unavailable. Please try again later." }
    }

    return { error: "An unexpected error occurred." }
  }
}

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phoneNumber: z.string().min(1, "Phone number is required"),
})

export async function registerAction(formData: FormData) {
  try {
    const name = formData.get("name")
    const email = formData.get("email")
    const password = formData.get("password")
    const phoneNumber = formData.get("phoneNumber")

    if (!name || !email || !password || !phoneNumber) {
      return { error: "Missing required fields" }
    }

    // Validate input types
    if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string" || typeof phoneNumber !== "string") {
       return { error: "Invalid input format" }
    }

    const validatedFields = registerSchema.safeParse({ name, email, password, phoneNumber })

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
      phoneNumber: data.phoneNumber,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    console.log("User inserted successfully")

    return { success: true }
  } catch (error: any) {
    console.error("Registration error details:", error)
    if (error instanceof Error) {
        console.error("Error message:", error.message)
        console.error("Error stack:", error.stack)
    }

    // Check for specific database quota error
    if (error?.message?.includes("data transfer quota") || error?.cause?.message?.includes("data transfer quota")) {
       return { error: "Service unavailable: Data transfer quota exceeded. Please try again later." }
    }
    
    // Check for generic error message from Neon
    if (error?.message?.includes("503") || error?.message?.includes("402")) {
         return { error: "Service temporarily unavailable. Please try again later." }
    }

    return { error: "Registration failed. Please try again later." }
  }
}
