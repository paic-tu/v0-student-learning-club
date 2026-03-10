import type React from "react"
import type { Metadata } from "next"
import { IBM_Plex_Sans_Arabic, Inter, Playfair_Display, Dancing_Script } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import Script from "next/script"
import "../globals.css"
import { LanguageProvider } from "@/lib/language-context"
import { ThemeProvider } from "@/lib/theme-context"
import { AuthProvider } from "@/lib/auth-context"
import { Toaster } from "@/components/ui/toaster"
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

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  const isAr = lang === "ar"

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://neonedu.org'),
    title: {
      default: isAr ? "Neon | نيون التعليمية - منصة التعلم الإلكتروني" : "Neon | E-Learning Platform",
      template: isAr ? "%s | Neon - نيون" : "%s | Neon"
    },
    description: isAr 
      ? "منصة نيون التعليمية للدورات والشهادات المعتمدة في البرمجة والتقنية. انضم إلينا لتعلم مهارات المستقبل." 
      : "Neon educational platform for accredited courses and certificates in programming and technology. Join us to learn future skills.",
    keywords: [
      "تعليم", "دورات", "برمجة", "نيون", "education", "courses", "programming", "neon", 
      "web development", "tech", "learning platform", "online courses", "elearning", "منصة تعليمية"
    ],
    authors: [{ name: "Neon Team" }],
    creator: "Neon Team",
    publisher: "Neon Team",
    icons: {
      icon: '/icon.svg',
      apple: '/apple-icon.png',
    },
    openGraph: {
      type: "website",
      locale: isAr ? "ar_SA" : "en_US",
      url: `/${lang}`,
      title: isAr ? "Neon | نيون التعليمية" : "Neon | E-Learning Platform",
      description: isAr 
        ? "منصة نيون التعليمية للدورات والشهادات المعتمدة في البرمجة والتقنية" 
        : "Neon educational platform for accredited courses and certificates in programming and technology",
      siteName: isAr ? "Neon | نيون" : "Neon",
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: 'Neon Learning Platform',
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: isAr ? "Neon | نيون التعليمية" : "Neon | E-Learning Platform",
      description: isAr 
        ? "منصة نيون التعليمية للدورات والشهادات المعتمدة" 
        : "Neon educational platform for accredited courses and certificates",
      creator: "@neon_edu", // Update if there is a real handle
      images: ['/og-image.png'],
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
      canonical: `/${lang}`,
      languages: {
        'en-US': '/en',
        'ar-SA': '/ar',
      },
    },
  }
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

  return (
    <html lang={lang} dir={dir} suppressHydrationWarning>
      <body className={`${arabic.variable} ${inter.variable} ${playfair.variable} ${dancing.variable} font-sans antialiased`}>
        <Script id="silence-console" strategy="beforeInteractive">
          {`(function(){var n=function(){};var c=window.console||{};c.log=n;c.debug=n;c.info=n;c.warn=n;c.error=n;window.console=c})();`}
        </Script>
        <ThemeProvider>
          <LanguageProvider defaultLang={lang as "ar" | "en"}>
            <AuthProvider>
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
