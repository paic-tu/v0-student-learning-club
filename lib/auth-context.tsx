"use client"

import { SessionProvider, useSession, signOut } from "next-auth/react"
import type { ReactNode } from "react"

export function AuthProvider({ children, session }: { children: ReactNode; session?: any }) {
  return (
    <SessionProvider session={session} refetchOnWindowFocus={false} refetchInterval={0}>
      {children}
    </SessionProvider>
  )
}

export function useAuth() {
  const { data: session, status } = useSession()
  
  return {
    user: session?.user || null,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    logout: () => signOut({ callbackUrl: "/" }),
    isAdmin: session?.user?.role === "admin",
    // Compatibility helpers if needed
    setUser: () => { console.warn("setUser is not supported with NextAuth") }
  }
}
