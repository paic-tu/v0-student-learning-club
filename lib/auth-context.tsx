"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { logout as logoutAction, type User } from "./auth"
import { getCurrentUser } from "./auth"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  setUser: (user: User | null) => void
  logout: () => Promise<void>
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadUser = async () => {
      try {
        let retries = 0
        let currentUser = null

        while (retries < 3 && !currentUser) {
          try {
            currentUser = await getCurrentUser()
            if (currentUser) {
              console.log("[Auth] User loaded successfully:", currentUser.email)
              setUser(currentUser)
            } else {
              console.log("[Auth] No user session found (expected on first visit)")
            }
            break
          } catch (error) {
            retries++
            if (retries < 3) {
              console.warn(`[Auth] Retry ${retries}/3 - Load user failed, retrying...`)
              await new Promise((resolve) => setTimeout(resolve, 200 * retries))
            }
          }
        }

        if (retries === 3 && !currentUser) {
          console.warn("[Auth] Failed to load user after 3 retries")
          setUser(null)
        }
      } catch (error) {
        console.error("[Auth] Error loading user:", error)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()
  }, [])

  const logout = async () => {
    try {
      await logoutAction()
      setUser(null)
    } catch (error) {
      console.error("[Auth] Logout error:", error)
    }
  }

  const isAdmin = user?.role === "admin"

  return <AuthContext.Provider value={{ user, isLoading, setUser, logout, isAdmin }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
