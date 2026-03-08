"use client"

import { SessionProvider, useSession, signOut } from "next-auth/react"
import { type ReactNode } from "react"

export function AuthProvider({ children, session }: { children: ReactNode; session?: any }) {
  return <SessionProvider session={session}>{children}</SessionProvider>
}

export function useAuth() {
  const { data: session, status } = useSession()
  
  return {
    user: session?.user as any,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    logout: async () => {
      const isEn = typeof window !== 'undefined' && window.location.pathname.startsWith('/en')
      await signOut({ callbackUrl: isEn ? "/en" : "/ar" })
    },
    isAdmin: (session?.user as any)?.role === "admin",
  }
}
