import type React from "react"
import { IBM_Plex_Sans_Arabic, Inter, Playfair_Display, Dancing_Script } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import Script from "next/script"
import { headers } from "next/headers"
import "@/app/globals.css"
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const headerList = await headers()
  const pathname = headerList.get("x-pathname") || ""
  
  // Determine language from pathname
  const lang = pathname.startsWith("/en") ? "en" : "ar"
  const dir = lang === "en" ? "ltr" : "rtl"

  return (
    <html lang={lang} dir={dir} suppressHydrationWarning>
      <body className={`${arabic.variable} ${inter.variable} ${playfair.variable} ${dancing.variable} font-sans antialiased`}>
        <Script id="silence-console" strategy="beforeInteractive">
          {`(function(){try{var n=function(){};var c=window.console||{};c.log=n;c.debug=n;c.info=n;c.warn=n;c.error=n;window.console=c}catch(e){};try{var p=window.performance;if(p&&p.measure&&!p.__neonPatchedMeasure){var m=p.measure.bind(p);p.measure=function(a,b,d){try{if(b&&typeof b==="object"&&(typeof b.start==="number"||typeof b.end==="number")){var o=b;if(typeof o.start==="number"&&o.start<0){o=Object.assign({},o,{start:0})}if(typeof o.end==="number"&&o.end<0){o=Object.assign({},o,{end:0})}return m(a,o)}return m(a,b,d)}catch(e){if(e&&typeof e.message==="string"&&e.message.indexOf("negative time stamp")!==-1){return}throw e}};p.__neonPatchedMeasure=true}}catch(e){}})();`}
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
