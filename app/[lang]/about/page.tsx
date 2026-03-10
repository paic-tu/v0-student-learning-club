import { NavBar } from "@/components/nav-bar"
import { SiteFooter } from "@/components/site-footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Zap, BookOpen, Users, Target } from "lucide-react"

export default async function AboutPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const isAr = lang === "ar"

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1">
        <section className="border-b bg-gradient-to-b from-background to-muted/20">
          <div className="container mx-auto px-4 py-12 md:py-16" dir={isAr ? "rtl" : "ltr"}>
            <div className="max-w-4xl mx-auto space-y-6">
              <Badge variant="secondary" className="w-fit">
                <Target className="h-3 w-3 mr-1" />
                {isAr ? "About NEON" : "About NEON"}
              </Badge>

              <div className="space-y-3">
                <h1 className="text-3xl md:text-5xl font-bold text-balance">{isAr ? "من نحــن؟" : "Who Are We?"}</h1>
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                  {isAr
                    ? "ﻣﻨﺼﺔ ﺗﻌﻠﻴﻤﻴﺔ ﺗﻘﻨﻴﺔ ﺗﻬﺪف إﻟﻰ ﺗﻤﻜﻴﻦ اﻟﻄﻼب واﻟﻤﻬﺘﻤﻴﻦ ﺑﺎﻟﺘﻘﻨﻴﺔ ﻣﻦ ﺗﻌﻠﻢ وﺗﻌﻠﻴﻢ اﻟﻤﻬﺎرات اﻟﺘﻘﻨﻴﺔ اﻟﻤﻄﻠﻮﺑﺔ ﻓﻲ ﺳﻮق اﻟﻌﻤﻞ."
                    : "NEON is a technology learning platform that aims to empower students and tech enthusiasts to learn and teach in-demand technical skills."}
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  {isAr
                    ? "ﺗﻮﻓﺮ اﻟﻤﻨﺼﺔ ﺑﻴﺌﺔ ﺗﻌﻠﻴﻤﻴﺔ ﺗﻔﺎﻋﻠﻴﺔ ﺗﺴﺎﻋﺪ اﻷﻓﺮاد ﻋﻠﻰ ﺗﻄﻮﻳﺮ ﻣﻬﺎراﺗﻬﻢ اﻟﺘﻘﻨﻴﺔ وﻣﺸﺎرﻛﺔ ﻣﻌﺮﻓﺘﻬﻢ اﻟﺘﻘﻨﻴﺔ. ﺗﺴﻌﻰ ﻣﻨﺼﺔ ﻧﻴﻮن إﻟﻰ ﺗﺒﺴﻴﻂ ﺗﻌﻠﻢ اﻟﺘﻜﻨﻮﻟﻮﺟﻴﺎ وإﺗﺎﺣﺔ اﻟﻔﺮﺻﺔ ﻟﻸﻓﺮاد ﻟﻠﺪﺧﻮل إﻟﻰ ﻋﺎﻟﻢ اﻟﺘﻘﻨﻴﺔ ﺑﻄﺮﻳﻘﺔ واﺿﺤﺔ وﻋﻤﻠﻴﺔ."
                    : "The platform combines practical learning with community building, providing an interactive educational environment that helps individuals develop their technical skills and share knowledge."}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4" dir={isAr ? "rtl" : "ltr"}>
            <div className="max-w-6xl mx-auto space-y-10">
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-muted/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Zap className="h-4 w-4 text-primary" />
                      {isAr ? "ابتكار مستمر" : "Continuous Innovation"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground leading-relaxed">
                    {isAr
                      ? "نطوّر التجربة باستمرار ونحدّث المحتوى بما يواكب التقنية."
                      : "We continuously improve the learning experience and update content to match the latest tech trends."}
                  </CardContent>
                </Card>

                <Card className="border-muted/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <BookOpen className="h-4 w-4 text-primary" />
                      {isAr ? "تعلم عملي" : "Practical Learning"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground leading-relaxed">
                    {isAr
                      ? "تركيز على التطبيق والممارسة للوصول لمهارات قابلة للاستخدام في العمل."
                      : "Hands-on learning focused on real projects and practical outcomes."}
                  </CardContent>
                </Card>

                <Card className="border-muted/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Users className="h-4 w-4 text-primary" />
                      {isAr ? "مجتمع تفاعلي" : "Interactive Community"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground leading-relaxed">
                    {isAr
                      ? "بيئة تفاعلية لمشاركة المعرفة والتعلم مع الآخرين."
                      : "A community-first environment that encourages sharing, mentoring, and collaboration."}
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="border-primary/10">
                  <CardHeader>
                    <CardTitle>{isAr ? "رسالتــنـــــــا" : "Our Mission"}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-muted-foreground leading-relaxed">
                    {isAr
                      ? "ﺗﻤﻜﻴﻦ اﻷﻓﺮاد ﻣﻦ ﺗﻌﻠﻢ وﺗﻌﻠﻴﻢ اﻟﻤﻬﺎرات اﻟﺘﻘﻨﻴﺔ اﻟﺤﺪﻳﺜﺔ، وﺑﻨﺎء ﻣﺠﺘﻤﻊ ﺗﻘﻨﻲ ﻳﺸﺎرك اﻟﻤﻌﺮﻓﺔ وﻳﺴﺎﻫﻢ ﻓﻲ ﺗﻄﻮﻳﺮ اﻟﻘﺪرات اﻟﺘﻘﻨﻴﺔ ﻟﻤﻮاﻛﺒﺔ ﻣﺘﻄﻠﺒﺎت اﻟﻤﺴﺘﻘﺒﻞ."
                      : "Empower individuals to learn and teach modern technical skills, building a tech community that shares knowledge and contributes to developing technical capabilities to meet future requirements."}
                  </CardContent>
                </Card>

                <Card className="border-primary/10">
                  <CardHeader>
                    <CardTitle>{isAr ? "رؤيتــنــــــــا" : "Our Vision"}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-muted-foreground leading-relaxed">
                    {isAr
                      ? "أن ﺗﺼﺒﺢ ﻧﻴﻮن ﻣﻨﺼﺔ راﺋﺪة ﻓﻲ اﻟﺘﻌﻠﻴﻢ اﻟﺘﻘﻨﻲ، وﻣﺮﻛﺰًا ﻟﺒﻨﺎء ﻣﺠﺘﻤﻊ ﺗﻘﻨﻲ ﻗﺎدر ﻋﻠﻰ اﻟﺘﻌﻠﻢ واﻟﻤﺸﺎرﻛﺔ واﻻﺑﺘﻜﺎر."
                      : "To become a leading platform in technical education and a hub for building a tech community capable of learning, sharing, and innovating."}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
