"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { NavBar } from "@/components/nav-bar"
import { AnimatedCounter } from "@/components/animated-counter"
import { StarfieldBackground } from "@/components/starfield-background"
import { GlowBlob } from "@/components/glow-blob"
import Link from "next/link"
import { BookOpen, Award, Users, Sparkles, Target, Zap } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { t } from "@/lib/i18n"

export default function HomePage() {
  const { language } = useLanguage()
  const isRTL = language === "ar"

  return (
    <div className="min-h-screen">
      <NavBar />

      <main>
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-accent/5 to-background py-24 md:py-40">
          <div className="absolute inset-0 z-0">
            <StarfieldBackground className="opacity-40 dark:opacity-20" />
          </div>

          <GlowBlob className="top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 z-0" color="primary" size="600px" />
          <GlowBlob className="bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 z-0" color="accent" size="500px" />

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <Badge
                className="mx-auto backdrop-blur-sm bg-background/80 border-primary/20 hover-lift"
                variant="secondary"
              >
                <Sparkles className="h-3 w-3 mr-1" />
                {isRTL ? "منصة التعلم الإلكتروني" : "E-Learning Platform"}
              </Badge>

              <h1 className="text-5xl md:text-7xl font-bold text-balance leading-tight">
                <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
                  {isRTL ? "نيون" : "Neon"}
                </span>
                <br />
                <span className="text-foreground text-4xl md:text-5xl mt-2 block">
                  {isRTL ? "منصتك للتعلم والنمو" : "Your Learning & Growth Platform"}
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-muted-foreground text-balance max-w-2xl mx-auto leading-relaxed">
                {isRTL
                  ? "اكتشف دورات تعليمية متميزة واحصل على شهادات معتمدة من أفضل المدربين في العالم العربي"
                  : "Discover premium educational courses and earn certified certificates from the best instructors in the Arab world"}
              </p>

              <div className="flex gap-4 justify-center flex-wrap pt-4">
                <Link href={`/${language}/courses`}>
                  <Button size="lg" className="font-semibold hover-lift hover-glow text-lg px-8">
                    <Target className="h-5 w-5 mr-2" />
                    {t("startLearning", language)}
                  </Button>
                </Link>
                <Link href={`/${language}/courses`}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="font-semibold hover-lift text-lg px-8 backdrop-blur-sm bg-background/80"
                  >
                    <BookOpen className="h-5 w-5 mr-2" />
                    {isRTL ? "استكشف الدورات" : "Explore Courses"}
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <style jsx>{`
            @keyframes gradient {
              0%, 100% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
            }
            @media (prefers-reduced-motion: no-preference) {
              .animate-gradient {
                animation: gradient 8s ease infinite;
              }
            }
          `}</style>
        </section>

        <section className="py-20 border-b bg-gradient-to-b from-background to-muted/20">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {isRTL ? "إنجازاتنا بالأرقام" : "Our Achievements in Numbers"}
                </h2>
                <p className="text-muted-foreground">
                  {isRTL ? "انضم لآلاف المتعلمين حول العالم" : "Join thousands of learners worldwide"}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                {[
                  {
                    icon: BookOpen,
                    value: 156,
                    suffix: "+",
                    label: isRTL ? "دورة تعليمية" : "Courses",
                    color: "text-blue-500",
                  },
                  {
                    icon: Users,
                    value: 12500,
                    suffix: "+",
                    label: isRTL ? "طالب وطالبة" : "Students",
                    color: "text-green-500",
                  },
                  {
                    icon: Award,
                    value: 8340,
                    suffix: "+",
                    label: isRTL ? "شهادة صادرة" : "Certificates",
                    color: "text-purple-500",
                  },
                  {
                    icon: Zap,
                    value: 98,
                    suffix: "%",
                    label: isRTL ? "نسبة الرضا" : "Satisfaction",
                    color: "text-amber-500",
                  },
                ].map((stat, i) => (
                  <Card key={i} className="text-center card-hover border-muted">
                    <CardContent className="pt-8 pb-6 space-y-3">
                      <stat.icon className={`h-10 w-10 mx-auto ${stat.color}`} strokeWidth={1.5} />
                      <AnimatedCounter
                        value={stat.value}
                        suffix={stat.suffix}
                        duration={2500}
                        className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent"
                      />
                      <div className="text-sm md:text-base text-muted-foreground font-medium">{stat.label}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 text-balance">
                {isRTL ? "لماذا نيون؟" : "Why Neon?"}
              </h2>
              <p className="text-muted-foreground text-lg md:text-xl">
                {isRTL
                  ? "نوفر لك كل ما تحتاجه لتطوير مهاراتك وتحقيق أهدافك المهنية"
                  : "We provide everything you need to develop your skills and achieve your professional goals"}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                {
                  title: isRTL ? "محتوى عالي الجودة" : "High-Quality Content",
                  description: isRTL
                    ? "دورات تعليمية من خبراء في مجالاتهم مع محتوى محدث باستمرار"
                    : "Educational courses from field experts with continuously updated content",
                  icon: "📚",
                  gradient: "from-blue-500/10 to-cyan-500/10",
                },
                {
                  title: isRTL ? "شهادات معتمدة" : "Certified Certificates",
                  description: isRTL
                    ? "احصل على شهادات معتمدة عند إتمام الدورات لتعزيز سيرتك الذاتية"
                    : "Earn certified certificates upon course completion to enhance your resume",
                  icon: "🏆",
                  gradient: "from-purple-500/10 to-pink-500/10",
                },
                {
                  title: isRTL ? "تعلم بمرونة" : "Flexible Learning",
                  description: isRTL
                    ? "ادرس في أي وقت ومن أي مكان بما يناسب جدولك اليومي"
                    : "Study anytime, anywhere to fit your daily schedule",
                  icon: "⏰",
                  gradient: "from-amber-500/10 to-orange-500/10",
                },
              ].map((feature, i) => (
                <Card
                  key={i}
                  className={`text-center card-hover bg-gradient-to-br ${feature.gradient} border-muted/50 backdrop-blur-sm`}
                >
                  <CardContent className="pt-10 pb-8 space-y-4">
                    <div className="text-6xl mb-2">{feature.icon}</div>
                    <h3 className="text-xl md:text-2xl font-bold">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5 z-0" />
          <GlowBlob className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0" color="primary" size="800px" />

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center space-y-8 backdrop-blur-sm bg-background/30 p-12 rounded-2xl border border-primary/10">
              <h2 className="text-3xl md:text-5xl font-bold text-balance">
                {isRTL ? "جاهز لبدء رحلتك التعليمية؟" : "Ready to Start Your Learning Journey?"}
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground text-balance">
                {isRTL
                  ? "انضم لآلاف الطلاب واكتشف دورات تساعدك على تحقيق أهدافك"
                  : "Join thousands of students and discover courses that help you achieve your goals"}
              </p>
              <Link href={`/${language}/courses`}>
                <Button size="lg" className="font-semibold text-lg px-10 hover-lift hover-glow">
                  <Sparkles className="h-5 w-5 mr-2" />
                  {isRTL ? "تصفح الدورات الآن" : "Browse Courses Now"}
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4">
            <div className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {isRTL ? "نيون" : "Neon"}
            </div>
            <p className="text-sm text-muted-foreground">
              {isRTL
                ? "© 2025 Neon | نيون التعليمية. جميع الحقوق محفوظة."
                : "© 2025 Neon Educational Platform. All rights reserved."}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
