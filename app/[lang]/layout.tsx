import type React from "react"
import type { Metadata } from "next"
import { IBM_Plex_Sans_Arabic, Inter, Playfair_Display, Dancing_Script } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "../globals.css"
import { LanguageProvider } from "@/lib/language-context"
import { ThemeProvider } from "@/lib/theme-context"
import { AuthProvider } from "@/lib/auth-context"
import { Toaster } from "@/components/ui/toaster"
import { DbInitializer } from "@/components/db-initializer"
import { auth } from "@/lib/auth"
import { SWUnregister } from "@/components/sw-unregister"

const arabic = IBM_Plex_Sans_Arabic({
  weight: ["400", "500", "600", "700"],
  subsets: ["arabic"],
  variable: "--font-arabic",
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
})

const dancing = Dancing_Script({
  subsets: ["latin"],
  variable: "--font-dancing",
})

export const metadata: Metadata = {
  title: "Neon | نيون التعليمية - منصة التعلم الإلكتروني",
  description: "منصة نيون التعليمية للدورات والشهادات المعتمدة",
  generator: "v0.app",
}

export async function generateStaticParams() {
  return [{ lang: "ar" }, { lang: "en" }]
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ lang: string }>
}>) {
  const { lang } = await params
  const dir = lang === "en" ? "ltr" : "rtl"
  const session = await auth()

  return (
    <html lang={lang} dir={dir} suppressHydrationWarning>
      <body className={`${arabic.variable} ${inter.variable} ${playfair.variable} ${dancing.variable} font-sans antialiased`}>
        <DbInitializer />
        <ThemeProvider>
          <LanguageProvider defaultLang={lang as "ar" | "en"}>
            <AuthProvider session={session}>
              <SWUnregister />
              {children}
              <Toaster />
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
