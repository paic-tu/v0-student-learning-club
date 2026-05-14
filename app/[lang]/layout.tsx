import type React from "react"
import type { Metadata } from "next"

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
      icon: [
        { url: '/icon.svg', type: 'image/svg+xml' },
        { url: '/icon-dark-32x32.png', sizes: '32x32', type: 'image/png', media: '(prefers-color-scheme: dark)' },
        { url: '/icon-light-32x32.png', sizes: '32x32', type: 'image/png', media: '(prefers-color-scheme: light)' },
      ],
      shortcut: '/icon.svg',
      apple: [
        { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
      ],
      other: [
        {
          rel: 'mask-icon',
          url: '/icon.svg',
          color: '#5bbad5' // You can customize this color
        },
      ],
    },
    manifest: '/manifest.json',
    openGraph: {
      type: "website",
      locale: isAr ? "ar_SA" : "en_US",
      alternateLocale: isAr ? ["en_US"] : ["ar_SA"],
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

export default async function LangLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ lang: string }>
}>) {
  return (
    <>
      {children}
    </>
  )
}
