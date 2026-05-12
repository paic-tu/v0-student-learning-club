"use server"

import { signIn } from "@/lib/auth"
import { AuthError } from "next-auth"
import { db } from "@/lib/db"
import { users, passwordResetTokens } from "@/lib/db/schema"
import { eq, ilike } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { sendMail } from "@/lib/mail"
import { getSiteSettings } from "@/lib/db/queries"
import crypto from "crypto"

export async function forgotPasswordAction(formData: FormData) {
  try {
    const email = (formData.get("email") as string)?.toLowerCase()

    if (!email) {
      return { error: "Email is required" }
    }

    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    })

    if (!user) {
      // Don't reveal if user exists for security
      return { success: true }
    }

    // Generate token
    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 3600000) // 1 hour

    // Delete any existing tokens for this email
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.email, email))

    // Save token
    await db.insert(passwordResetTokens).values({
      email,
      token,
      expiresAt,
    })

    // Send Reset Email
    const settings = await getSiteSettings()
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}`

    await sendMail({
      to: email,
      subject: `إعادة تعيين كلمة المرور - ${settings.siteName}`,
      html: `
        <h3 style="color: #0f172a; font-size: 22px; font-weight: 800; margin-bottom: 20px;">طلب إعادة تعيين كلمة المرور</h3>
        <p style="font-size: 16px; color: #475569;">أهلاً ${user.name}،</p>
        <p style="font-size: 16px; color: #475569;">لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بك في <strong>${settings.siteName}</strong>.</p>
        <p style="font-size: 16px; color: #475569; margin-bottom: 30px;">يمكنك إعادة تعيين كلمة المرور من خلال الضغط على الزر أدناه:</p>
        <div style="text-align: center; margin-bottom: 30px;">
          <a href="${resetUrl}" style="display: inline-block; padding: 16px 32px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 16px; font-weight: 700; font-size: 16px;">إعادة تعيين كلمة المرور</a>
        </div>
        <p style="font-size: 14px; color: #64748b;">هذا الرابط صالح لمدة ساعة واحدة فقط. إذا لم تطلب هذا، يمكنك تجاهل هذا البريد الإلكتروني.</p>
      `
    })

    return { success: true }
  } catch (error) {
    console.error("Forgot password error:", error)
    return { error: "Failed to send reset email" }
  }
}

export async function resetPasswordAction(formData: FormData) {
  try {
    const token = formData.get("token") as string
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (!token || !password || !confirmPassword) {
      return { error: "All fields are required" }
    }

    if (password !== confirmPassword) {
      return { error: "Passwords do not match" }
    }

    if (password.length < 6) {
      return { error: "Password must be at least 6 characters" }
    }

    // Verify token
    const resetToken = await db.query.passwordResetTokens.findFirst({
      where: eq(passwordResetTokens.token, token),
    })

    if (!resetToken || resetToken.expiresAt < new Date()) {
      return { error: "Invalid or expired token" }
    }

    // Update user password
    const hashedPassword = await bcrypt.hash(password, 10)
    await db.update(users)
      .set({ passwordHash: hashedPassword, updatedAt: new Date() })
      .where(eq(users.email, resetToken.email))

    // Send Confirmation Email
    try {
      const settings = await getSiteSettings()
      await sendMail({
        to: resetToken.email,
        subject: `تم تغيير كلمة المرور بنجاح - ${settings.siteName}`,
        html: `
          <h3 style="color: #0f172a; font-size: 22px; font-weight: 800; margin-bottom: 20px;">تنبيه أمني: تم تغيير كلمة المرور</h3>
          <p style="font-size: 16px; color: #475569;">أهلاً،</p>
          <p style="font-size: 16px; color: #475569;">نود إعلامك بأنه تم تغيير كلمة المرور الخاصة بحسابك في <strong>${settings.siteName}</strong> بنجاح.</p>
          <p style="font-size: 16px; color: #475569; margin-top: 20px;">إذا لم تقم بهذا التغيير، يرجى التواصل مع فريق الدعم الفني فوراً لحماية حسابك.</p>
        `
      })
    } catch (error) {
      console.error("Error sending password reset confirmation email:", error)
    }

    // Delete the token
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.token, token))

    return { success: true }
  } catch (error) {
    console.error("Reset password error:", error)
    return { error: "Failed to reset password" }
  }
}

export async function loginAction(prevState: any, formData: FormData) {
  try {
    const email = (formData.get("email") as string)?.toLowerCase()
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
  } catch (error: any) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid credentials." }
        default:
          return { error: "Something went wrong." }
      }
    }

    // Check for redirect error
    if (error.digest?.startsWith("NEXT_REDIRECT") || error.message === "NEXT_REDIRECT") {
      return { success: true }
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
    const email = (formData.get("email") as string)?.toLowerCase()
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
      where: ilike(users.email, email),
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

    // Send Welcome Email
    try {
      const settings = await getSiteSettings()
      await sendMail({
        to: email,
        subject: `مرحباً بك في ${settings.siteName}!`,
        html: `
          <h3 style="color: #0f172a; font-size: 22px; font-weight: 800; margin-bottom: 20px;">أهلاً بك يا ${name}!</h3>
          <p style="font-size: 16px; color: #475569;">يسعدنا جداً انضمامك إلى منصة <strong>${settings.siteName}</strong>.</p>
          <p style="font-size: 16px; color: #475569;">لقد تم إنشاء حسابك بنجاح، ويمكنك الآن البدء في استكشاف الدورات التدريبية المتاحة.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/auth/login" style="display: inline-block; padding: 16px 32px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 16px; font-weight: 700; font-size: 16px;">تسجيل الدخول إلى حسابك</a>
          </div>
          <p style="font-size: 14px; color: #64748b;">نتمنى لك رحلة تعليمية ممتعة ومفيدة!</p>
        `
      })
    } catch (error) {
      console.error("Error sending welcome email:", error)
    }

    return { success: true }
  } catch (error) {
    console.error("Registration error:", error)
    return { error: "Registration failed" }
  }
}
