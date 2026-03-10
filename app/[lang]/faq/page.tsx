import { NavBar } from "@/components/nav-bar"
import { SiteFooter } from "@/components/site-footer"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { HelpCircle } from "lucide-react"
import { getFaqItems } from "@/lib/content/faq"

export default async function FAQPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const isAr = lang === "ar"

  const faqs = getFaqItems(isAr ? "ar" : "en")

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1">
        <section className="border-b bg-gradient-to-b from-background to-muted/20">
          <div className="container mx-auto px-4 py-12 md:py-16" dir={isAr ? "rtl" : "ltr"}>
            <div className="max-w-3xl mx-auto space-y-4">
              <Badge variant="secondary" className="w-fit">
                <HelpCircle className="h-3 w-3 mr-1" />
                {isAr ? "مركز المساعدة" : "Help Center"}
              </Badge>
              <h1 className="text-3xl md:text-5xl font-bold text-balance">
                {isAr ? "الأسئلة الشائعة" : "Frequently Asked Questions"}
              </h1>
              <p className="text-muted-foreground text-lg leading-relaxed">
                {isAr ? "إجابات سريعة لأكثر الأسئلة شيوعًا حول NEON." : "Quick answers to the most common questions about NEON."}
              </p>
            </div>
          </div>
        </section>

        <section className="py-10 md:py-12">
          <div className="container mx-auto px-4" dir={isAr ? "rtl" : "ltr"}>
            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible className="rounded-xl border bg-background/50 backdrop-blur-sm">
                {faqs.map((item, idx) => (
                  <AccordionItem key={idx} value={`item-${idx}`}>
                    <AccordionTrigger className="px-5">{item.q}</AccordionTrigger>
                    <AccordionContent className="px-5 text-muted-foreground leading-relaxed">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
