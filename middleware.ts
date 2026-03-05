import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

const locales = ["ar", "en"]
const defaultLocale = "ar"

// Define portal paths
const STUDENT_PORTAL = "/student"
const INSTRUCTOR_PORTAL = "/instructor"
const ADMIN_PORTAL = "/admin"

// Define public routes that don't need auth (besides auth routes)
const publicRoutes = [
  "/", 
  "/courses", 
  "/about", 
  "/contact", 
  "/faq", 
  "/pricing", 
  "/store", 
  "/challenges", 
  "/arena", 
  "/mentors", 
  "/cohorts", 
  "/contests", 
  "/verify"
]

// Get the preferred locale from headers or default
function getLocale(request: any) {
  const acceptLanguage = request.headers.get("accept-language")
  if (acceptLanguage?.includes("en")) return "en"
  return defaultLocale
}

export default auth((req) => {
  const { nextUrl } = req
  const pathname = nextUrl.pathname

  // Skip internal paths and API
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".") // static files
  ) {
    return
  }

  // 1. Locale Redirect Logic
  const pathnameIsMissingLocale = locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  )

  if (pathnameIsMissingLocale) {
    const locale = getLocale(req)
    return NextResponse.redirect(
      new URL(`/${locale}${pathname.startsWith("/") ? "" : "/"}${pathname}`, req.url)
    )
  }

  // 2. Auth & RBAC Logic
  const segments = pathname.split("/")
  const locale = segments[1] || defaultLocale
  const pathWithoutLocale = "/" + segments.slice(2).join("/")

  // Check if route is public
  const isPublic = publicRoutes.some(route => pathWithoutLocale === route || pathWithoutLocale.startsWith(route + "/"))
  const isAuthRoute = pathWithoutLocale.startsWith("/auth")
  const isRoot = pathWithoutLocale === "/" || pathWithoutLocale === ""

  // Allow next-auth session and providers to pass through
  if (pathWithoutLocale.startsWith("/api/auth")) {
    return
  }

  if (isPublic || isAuthRoute || isRoot) {
    return
  }

  // If not public, require auth
  if (!req.auth) {
    const signInUrl = new URL(`/${locale}/auth/login`, req.url)
    signInUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(signInUrl)
  }

  const userRole = req.auth.user?.role as string

  // 3. Portal Access Control
  if (pathWithoutLocale.startsWith(ADMIN_PORTAL)) {
    if (userRole !== "admin") {
       if (userRole === "student") return NextResponse.redirect(new URL(`/${locale}/student/dashboard`, req.url))
       if (userRole === "instructor") return NextResponse.redirect(new URL(`/${locale}/instructor/dashboard`, req.url))
       return NextResponse.redirect(new URL(`/${locale}/access-denied`, req.url))
    }
  }

  if (pathWithoutLocale.startsWith(INSTRUCTOR_PORTAL)) {
    if (userRole !== "instructor") {
       if (userRole === "student") return NextResponse.redirect(new URL(`/${locale}/student/dashboard`, req.url))
       if (userRole === "admin") return NextResponse.redirect(new URL(`/${locale}/admin/dashboard`, req.url))
       return NextResponse.redirect(new URL(`/${locale}/access-denied`, req.url))
    }
  }

  if (pathWithoutLocale.startsWith(STUDENT_PORTAL)) {
     if (userRole !== "student") {
        if (userRole === "instructor") return NextResponse.redirect(new URL(`/${locale}/instructor/dashboard`, req.url))
        if (userRole === "admin") return NextResponse.redirect(new URL(`/${locale}/admin/dashboard`, req.url))
        return NextResponse.redirect(new URL(`/${locale}/access-denied`, req.url))
     }
  }

  // 4. Portal Redirects (if accessing root or shared paths, maybe redirect to dashboard?)
  // For now, let them access other protected pages if they exist outside portals (like /profile if it's shared).
  // But user listed /student/profile, /instructor/profile.
  // If there are shared routes, we need to decide.
  
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
