"use server"

import { signIn } from "@/lib/auth"
import { AuthError } from "next-auth"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { z } from "zod"

export async function loginAction(prevState: any, formData: FormData) {
  try {
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const redirectTo = formData.get("redirectTo") as string | undefined

    if (!email || !password) {
      return { error: "Email and password are required" }
    }

    await signIn("credentials", {
      email,
      password,
      redirectTo: redirectTo || "/",
    })
    
    return { success: true }
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid credentials." }
        default:
          return { error: "Something went wrong." }
      }
    }
    throw error
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
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const phoneNumber = formData.get("phoneNumber") as string

    if (!name || !email || !password || !phoneNumber) {
      return { error: "Missing required fields" }
    }

    const validatedFields = registerSchema.safeParse({ name, email, password, phoneNumber })

    if (!validatedFields.success) {
      return { error: validatedFields.error.errors[0].message }
    }

    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    })

    if (existingUser) {
      return { error: "Email already registered" }
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await db.insert(users).values({
      name,
      email,
      passwordHash: hashedPassword,
      role: "student",
      phoneNumber,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return { success: true }
  } catch (error) {
    console.error("Registration error:", error)
    return { error: "Registration failed" }
  }
}
