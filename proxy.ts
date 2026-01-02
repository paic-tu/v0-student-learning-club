import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { canAccessAdmin } from "@/lib/rbac/permissions"

// Routes that require authentication
const protectedRoutes = ["/orders", "/library", "/profile", "/admin", "/cart", "/checkout", "/learn"]

// Routes that require admin access
const adminRoutes = ["/admin"]

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Skip middleware for public routes
  if (pathname.startsWith("/_next") || pathname.startsWith("/api")) {
    return NextResponse.next()
  }

  // Check if route requires protection
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route))
  const isAdmin = adminRoutes.some((route) => pathname.startsWith(route))

  if (isProtected) {
    const user = await getCurrentUser()

    if (!user) {
      // Redirect to login if not authenticated
      return NextResponse.redirect(new URL("/auth/login", request.url))
    }

    if (isAdmin && !canAccessAdmin(user.role as any)) {
      // Redirect to home if not authorized for admin
      return NextResponse.redirect(new URL("/?error=unauthorized", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
