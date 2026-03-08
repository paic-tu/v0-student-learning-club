import type React from "react"
import type { Metadata } from "next"
import { IBM_Plex_Sans_Arabic, Inter, Playfair_Display, Dancing_Script } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "../globals.css"
import { LanguageProvider } from "@/lib/language-context"
import { ThemeProvider } from "@/lib/theme-context"
import { AuthProvider } from "@/lib/auth-context"
import { Toaster } from "@/components/ui/toaster"
import { auth } from "@/lib/auth"
import { SWUnregister } from "@/components/sw-unregister"
import { RotateDevicePrompt } from "@/components/rotate-device-prompt"

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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://neon-platform.vercel.app'),
  title: {
    default: "Neon | نيون التعليمية - منصة التعلم الإلكتروني",
    template: "%s | Neon - نيون"
  },
  description: "منصة نيون التعليمية للدورات والشهادات المعتمدة في البرمجة والتقنية. انضم إلينا لتعلم مهارات المستقبل.",
  keywords: ["تعليم", "دورات", "برمجة", "نيون", "education", "courses", "programming", "neon", "web development", "tech", "learning platform"],
  authors: [{ name: "Neon Team" }],
  creator: "Neon Team",
  publisher: "Neon Team",
  openGraph: {
    type: "website",
    locale: "ar_SA",
    url: "/",
    title: "Neon | نيون التعليمية",
    description: "منصة نيون التعليمية للدورات والشهادات المعتمدة في البرمجة والتقنية",
    siteName: "Neon | نيون",
  },
  twitter: {
    card: "summary_large_image",
    title: "Neon | نيون التعليمية",
    description: "منصة نيون التعليمية للدورات والشهادات المعتمدة",
    creator: "@neon_edu",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/en',
      'ar-SA': '/ar',
    },
  },
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
        <ThemeProvider>
          <LanguageProvider defaultLang={lang as "ar" | "en"}>
            <AuthProvider session={session}>
              <SWUnregister />
              <RotateDevicePrompt />
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
