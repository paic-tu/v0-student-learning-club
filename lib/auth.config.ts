import type { NextAuthConfig } from "next-auth"

// Fallback for development to prevent crash if secret is missing
// This needs to be here because middleware uses this config
if (!process.env.AUTH_SECRET) {
  if (process.env.NODE_ENV !== "production") {
    process.env.AUTH_SECRET = "dev-secret-key-change-me"
  }
}

export const authConfig = {
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true,
  providers: [], // Providers are configured in auth.ts
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // console.log("[Auth] JWT callback - user logged in:", user.id, "role:", (user as any).role)
        token.id = user.id
        token.role = (user as any).role || "student" // Ensure role is set
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        // console.log("[Auth] Session callback - token:", token.sub, "role:", token.role)
        session.user.id = token.id as string
        // @ts-ignore
        session.user.role = (token.role as string) || "student"
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
} satisfies NextAuthConfig
