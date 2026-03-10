import { NavBar } from "@/components/nav-bar"
import { SiteFooter } from "@/components/site-footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mail, Phone, MessageCircle } from "lucide-react"
import { ContactSheetForm } from "@/components/contact/contact-sheet-form"

export default async function ContactPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const isAr = lang === "ar"

  const phoneDisplay = "+966553377172"
  const email = "neonedusa@gmail.com"
  const phoneHref = "tel:+966553377172"
  const emailHref = "mailto:neonedusa@gmail.com"

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1">
        <section className="border-b bg-gradient-to-b from-background to-muted/20">
          <div className="container mx-auto px-4 py-12 md:py-16" dir={isAr ? "rtl" : "ltr"}>
            <div className="max-w-3xl mx-auto space-y-4">
              <Badge variant="secondary" className="w-fit">
                <MessageCircle className="h-3 w-3 mr-1" />
                {isAr ? "الدعم" : "Support"}
              </Badge>
              <h1 className="text-3xl md:text-5xl font-bold">{isAr ? "تواصل معنا" : "Contact Us"}</h1>
              <p className="text-lg text-muted-foreground">
                {isAr ? "تواصل مع فريق الدعم لدينا." : "Get in touch with our support team."}
              </p>
            </div>
          </div>
        </section>

        <section className="py-10 md:py-12">
          <div className="container mx-auto px-4" dir={isAr ? "rtl" : "ltr"}>
            <div className="max-w-3xl mx-auto grid gap-4 md:grid-cols-2">
              <Card className="border-primary/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Phone className="h-4 w-4 text-primary" />
                    {isAr ? "رقم التواصل" : "Phone"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <a className="text-foreground hover:underline" href={phoneHref} dir="ltr">
                    {phoneDisplay}
                  </a>
                </CardContent>
              </Card>

              <Card className="border-primary/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Mail className="h-4 w-4 text-primary" />
                    {isAr ? "البريد الإلكتروني" : "Email"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <a className="text-foreground hover:underline" href={emailHref}>
                    {email}
                  </a>
                </CardContent>
              </Card>
            </div>

            <div className="max-w-3xl mx-auto mt-6">
              <ContactSheetForm lang={isAr ? "ar" : "en"} />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
