import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { nextUrl } = req
  const pathname = nextUrl.pathname

  // 1. Handle Locale Redirection
  const locales = ['en', 'ar']
  const pathnameIsMissingLocale = locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  )

  if (pathnameIsMissingLocale) {
    // 2. Handle Admin Redirection (moved from app/admin)
    if (pathname === '/admin' || pathname.startsWith('/admin/')) {
      const rest = pathname.replace('/admin', '')
      return NextResponse.redirect(new URL(`/ar/admin${rest}`, req.url))
    }

    // Redirect to /ar if no locale is present
    // But skip internal files, api, and public uploads
    const isInternal = pathname.startsWith('/_next') || 
                       pathname.startsWith('/api') || 
                       pathname.startsWith('/favicon.ico') ||
                       pathname.startsWith('/uploads') ||
                       pathname.startsWith('/icon.svg') ||
                       pathname.startsWith('/apple-icon.png') ||
                       pathname.startsWith('/manifest.json') ||
                       pathname.includes('.')

    if (!isInternal) {
      return NextResponse.redirect(new URL(`/ar${pathname}`, req.url))
    }
  }

  // Set x-pathname in request headers so it's available in Server Components
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-pathname', pathname)

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|uploads).*)"],
}
