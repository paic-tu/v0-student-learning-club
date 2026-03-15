"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { NavBar } from "@/components/nav-bar"
import { AnimatedCounter } from "@/components/animated-counter"
import { StarfieldBackground } from "@/components/starfield-background"
import { GlowBlob } from "@/components/glow-blob"
import Link from "next/link"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { BookOpen, Award, Users, Sparkles, Target, Zap, Clock, Star, HelpCircle } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { t } from "@/lib/i18n"
import { getLandingPageReviews, getLandingPageStats } from "@/lib/actions/stats"
import { getFaqItems } from "@/lib/content/faq"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Reveal } from "@/components/reveal"
import { RotatingWords } from "@/components/rotating-words"
import Script from "next/script"

export default function HomePage() {
  const { language } = useLanguage()
  const isRTL = language === "ar"
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const baseUrl = "https://neonedu.org"
  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${baseUrl}/#organization`,
    name: "Neon",
    alternateName: "نيون",
    url: baseUrl,
    logo: `${baseUrl}/logo.svg`,
    description:
      language === "ar"
        ? "منصة نيون التعليمية للدورات والشهادات المعتمدة في البرمجة والتقنية."
        : "Neon educational platform for accredited courses and certificates in programming and technology.",
  }
  const [stats, setStats] = useState({
    courses: 0,
    students: 0,
    certificates: 0,
    satisfaction: 0
  })
  const [reviews, setReviews] = useState<
    Array<{
      id: string
      rating: number
      comment: string | null
      userName: string | null
      userAvatarUrl: string | null
      courseTitleAr: string | null
      courseTitleEn: string | null
      createdAt: any
    }>
  >([])

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const data = await getLandingPageReviews(8)
        setReviews(data as any)
      } catch {
      }
    }

    getLandingPageStats().then(setStats)
    fetchReviews()

    const interval = setInterval(fetchReviews, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen relative">
      {/* Unified animated background for the whole page */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-background opacity-80" />
        <StarfieldBackground className="opacity-80 dark:opacity-50" />
        <GlowBlob className="top-1/5 left-1/4 -translate-x-1/2 -translate-y-1/2 opacity-45 dark:opacity-30" color="primary" size="720px" />
        <GlowBlob className="bottom-1/6 right-1/4 translate-x-1/2 translate-y-1/2 opacity-40 dark:opacity-25" color="accent" size="640px" />
      </div>
      <NavBar />
      <Script id="ld-org" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify(organizationLd)}
      </Script>

      <main>
        <section className="relative overflow-hidden py-24 md:py-40">
          <div className="pointer-events-none absolute inset-x-0 top-36 md:top-44 h-80 md:h-96 z-0">
            <div className="absolute top-0 right-4 md:right-14 floating-drift-right" style={{ animationDuration: "18s", animationDelay: "-3s" }}>
              <div className="floating-float" style={{ animationDuration: "4.8s", animationDelay: "-1.2s" }}>
                <Badge className="backdrop-blur-sm bg-background/70 border-primary/20 opacity-85" variant="secondary">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {isRTL ? "تعلّم تفاعلي" : "Interactive Learning"}
                </Badge>
              </div>
            </div>

            <div className="absolute top-16 right-7 md:right-24 floating-drift-right" style={{ animationDuration: "22s", animationDelay: "-9s" }}>
              <div className="floating-float" style={{ animationDuration: "5.6s", animationDelay: "-2.4s" }}>
                <Badge className="backdrop-blur-sm bg-background/70 border-primary/20 opacity-85" variant="secondary">
                  <Award className="h-3 w-3 mr-1" />
                  {isRTL ? "دورات معتمدة" : "Certified Courses"}
                </Badge>
              </div>
            </div>

            <div className="absolute top-32 right-4 md:right-16 floating-drift-right" style={{ animationDuration: "20s", animationDelay: "-14s" }}>
              <div className="floating-float" style={{ animationDuration: "4.2s", animationDelay: "-3.0s" }}>
                <Badge className="backdrop-blur-sm bg-background/70 border-primary/20 opacity-85" variant="secondary">
                  <Users className="h-3 w-3 mr-1" />
                  {isRTL ? "مدربون خبراء" : "Expert Instructors"}
                </Badge>
              </div>
            </div>

            <div className="absolute top-0 left-4 md:left-14 floating-drift-left" style={{ animationDuration: "19s", animationDelay: "-6s" }}>
              <div className="floating-float" style={{ animationDuration: "5.0s", animationDelay: "-0.8s" }}>
                <Badge className="backdrop-blur-sm bg-background/70 border-primary/20 opacity-85" variant="secondary">
                  <Zap className="h-3 w-3 mr-1" />
                  {isRTL ? "جلسات مباشرة" : "Live Sessions"}
                </Badge>
              </div>
            </div>

            <div className="absolute top-16 left-7 md:left-24 floating-drift-left" style={{ animationDuration: "23s", animationDelay: "-11s" }}>
              <div className="floating-float" style={{ animationDuration: "5.4s", animationDelay: "-2.0s" }}>
                <Badge className="backdrop-blur-sm bg-background/70 border-primary/20 opacity-85" variant="secondary">
                  <Target className="h-3 w-3 mr-1" />
                  {isRTL ? "تحديات" : "Challenges"}
                </Badge>
              </div>
            </div>

            <div className="absolute top-32 left-4 md:left-16 floating-drift-left" style={{ animationDuration: "21s", animationDelay: "-16s" }}>
              <div className="floating-float" style={{ animationDuration: "4.4s", animationDelay: "-3.4s" }}>
                <Badge className="backdrop-blur-sm bg-background/70 border-primary/20 opacity-85" variant="secondary">
                  <Star className="h-3 w-3 mr-1" />
                  {isRTL ? "شهادات" : "Certificates"}
                </Badge>
              </div>
            </div>

            <div className="absolute top-48 left-7 md:left-28 floating-drift-left hidden sm:block" style={{ animationDuration: "25s", animationDelay: "-7s" }}>
              <div className="floating-float" style={{ animationDuration: "6.0s", animationDelay: "-1.6s" }}>
                <Badge className="backdrop-blur-sm bg-background/70 border-primary/20 opacity-85" variant="secondary">
                  <Clock className="h-3 w-3 mr-1" />
                  {isRTL ? "تعلّم مرن" : "Flexible Learning"}
                </Badge>
              </div>
            </div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <Reveal>
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <div className="w-fit mx-auto floating-float" style={{ animationDuration: "5.2s", animationDelay: "-1.6s" }}>
                <Badge
                  className="mx-auto backdrop-blur-sm bg-background/80 border-primary/20 hover-lift"
                  variant="secondary"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  {isRTL ? "منصة التعلم الإلكتروني" : "E-Learning Platform"}
                </Badge>
              </div>

              <h1 className="text-5xl md:text-7xl font-bold text-balance leading-tight">
                <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
                  {isRTL ? "نيون" : "Neon"}
                </span>
                <br />
                <span className="text-foreground text-4xl md:text-5xl mt-2 block">
                  <span className="inline-flex items-baseline justify-center gap-0 whitespace-nowrap">
                    <span>
                      {isRTL ? "منصتك ل\u200D" : "Your platform for "}
                    </span>
                    <RotatingWords
                      marginInlineStart={isRTL ? "-2.20em" : "0.18em"}
                      words={
                        isRTL
                          ? [
                              { text: "التعلم", className: "bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent" },
                              { text: "النمو", className: "bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent" },
                              { text: "الابتكار", className: "bg-gradient-to-r from-fuchsia-500 to-pink-500 bg-clip-text text-transparent" },
                              { text: "النجاح", className: "bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent" },
                            ]
                          : [
                              { text: "Learning", className: "bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent" },
                              { text: "Growth", className: "bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent" },
                              { text: "Innovation", className: "bg-gradient-to-r from-fuchsia-500 to-pink-500 bg-clip-text text-transparent" },
                              { text: "Success", className: "bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent" },
                            ]
                      }
                    />
                  </span>
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-muted-foreground text-balance max-w-2xl mx-auto leading-relaxed">
                {isRTL
                  ? "اكتشف دورات تعليمية متميزة واحصل على شهادات معتمدة مع أفضل المدربين "
                  : "Discover premium educational courses and earn certified certificates from the best instructors "}
              </p>

              <div className="flex gap-4 justify-center flex-wrap pt-4">
                {isAuthenticated ? (
                  <Button 
                    size="lg" 
                    className="font-semibold hover-lift hover-glow text-lg px-8"
                    onClick={() => {
                      const dashboardLink = user?.role === "admin" 
                        ? `/${language}/admin`
                        : user?.role === "instructor" 
                          ? `/${language}/instructor/dashboard`
                          : `/${language}/student/dashboard`
                      window.location.href = dashboardLink
                    }}
                  >
                    <Target className="h-5 w-5 mr-2" />
                    {isRTL ? "الذهاب إلى لوحة التحكم" : "Go to Dashboard"}
                  </Button>
                ) : (
                  <Link href={`/${language}/courses`}>
                    <Button size="lg" className="font-semibold hover-lift hover-glow text-lg px-8">
                      <Target className="h-5 w-5 mr-2" />
                      {t("startLearning", language)}
                    </Button>
                  </Link>
                )}
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
            </Reveal>
          </div>

          <style jsx global>{`
            @keyframes gradient {
              0%, 100% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
            }
            @media (prefers-reduced-motion: no-preference) {
              .animate-gradient {
                animation: gradient 8s ease infinite;
              }
            }

            @keyframes floating-float-y {
              0%, 100% { transform: translate3d(0, 0, 0); }
              50% { transform: translate3d(0, -10px, 0); }
            }

            @keyframes floating-drift-right {
              0% { transform: translate3d(0, 0, 0); }
              50% { transform: translate3d(26px, 0, 0); }
              100% { transform: translate3d(0, 0, 0); }
            }

            @keyframes floating-drift-left {
              0% { transform: translate3d(0, 0, 0); }
              50% { transform: translate3d(-26px, 0, 0); }
              100% { transform: translate3d(0, 0, 0); }
            }

            @media (prefers-reduced-motion: no-preference) {
              .floating-float {
                animation-name: floating-float-y;
                animation-timing-function: ease-in-out;
                animation-iteration-count: infinite;
              }
              .floating-drift-right {
                animation-name: floating-drift-right;
                animation-timing-function: ease-in-out;
                animation-iteration-count: infinite;
              }
              .floating-drift-left {
                animation-name: floating-drift-left;
                animation-timing-function: ease-in-out;
                animation-iteration-count: infinite;
              }
            }

            .reviews-marquee {
              position: relative;
              overflow: hidden;
              padding: 2px;
              direction: ltr;
            }

            .reviews-track {
              display: flex;
              gap: 12px;
              width: max-content;
              animation: marquee-ltr 32s linear infinite;
              will-change: transform;
            }

            .reviews-marquee:hover .reviews-track {
              animation-play-state: paused;
            }

            .reviews-card {
              width: 280px;
              min-width: 280px;
            }

            @media (min-width: 768px) {
              .reviews-card {
                width: 320px;
                min-width: 320px;
              }
            }

            @keyframes marquee-ltr {
              0% {
                transform: translateX(0);
              }
              100% {
                transform: translateX(-50%);
              }
            }

            .reviews-fade-left,
            .reviews-fade-right {
              position: absolute;
              top: 0;
              bottom: 0;
              width: 60px;
              pointer-events: none;
            }

            .reviews-fade-left {
              left: 0;
              background: linear-gradient(
                to right,
                color-mix(in oklch, var(--background) 80%, transparent),
                transparent
              );
            }

            .reviews-fade-right {
              right: 0;
              background: linear-gradient(
                to left,
                color-mix(in oklch, var(--background) 80%, transparent),
                transparent
              );
            }

            @media (prefers-reduced-motion: reduce) {
              .reviews-track {
                animation: none;
                transform: none;
              }
            }
          `}</style>
        </section>

        <section className="py-20 border-b bg-gradient-to-b from-background to-muted/20">
          <div className="container mx-auto px-4">
            <Reveal>
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
                    value: stats.courses,
                    suffix: "+",
                    label: isRTL ? "دورة تعليمية" : "Courses",
                    color: "text-blue-500",
                  },
                  {
                    icon: Users,
                    value: stats.students,
                    suffix: "+",
                    label: isRTL ? "عضو مسجل" : "Registered Members",
                    color: "text-green-500",
                  },
                  {
                    icon: Award,
                    value: stats.certificates,
                    suffix: "+",
                    label: isRTL ? "شهادة صادرة" : "Certificates",
                    color: "text-purple-500",
                  },
                  {
                    icon: Zap,
                    value: stats.satisfaction,
                    suffix: "%",
                    label: isRTL ? "نسبة الرضا" : "Satisfaction",
                    color: "text-amber-500",
                  },
                ].map((stat, i) => (
                  <Card key={i} className="text-center card-hover border-muted">
                    <CardContent className="pt-8 pb-6 space-y-3">
                      <stat.icon className={`h-10 w-10 mx-auto ${stat.color}`} strokeWidth={1.5} />
                      <AnimatedCounter
                        key={stat.value}
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
            </Reveal>
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
                  Icon: BookOpen,
                  gradient: "from-blue-500/10 to-cyan-500/10",
                  color: "text-blue-600",
                },
                {
                  title: isRTL ? "شهادات معتمدة" : "Certified Certificates",
                  description: isRTL
                    ? "احصل على شهادات معتمدة عند إتمام الدورات لتعزيز سيرتك الذاتية"
                    : "Earn certified certificates upon course completion to enhance your resume",
                  Icon: Award,
                  gradient: "from-purple-500/10 to-pink-500/10",
                  color: "text-purple-600",
                },
                {
                  title: isRTL ? "تعلم بمرونة" : "Flexible Learning",
                  description: isRTL
                    ? "ادرس في أي وقت ومن أي مكان بما يناسب جدولك اليومي"
                    : "Study anytime, anywhere to fit your daily schedule",
                  Icon: Clock,
                  gradient: "from-amber-500/10 to-orange-500/10",
                  color: "text-amber-600",
                },
              ].map((feature, i) => (
                <Card
                  key={i}
                  className={`text-center card-hover bg-gradient-to-br ${feature.gradient} border-muted/50 backdrop-blur-sm`}
                >
                  <CardContent className="pt-10 pb-8 space-y-4">
                    <feature.Icon className={`h-12 w-12 mx-auto ${feature.color}`} strokeWidth={1.6} />
                    <h3 className="text-xl md:text-2xl font-bold">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 border-t border-b">
          <div className="container mx-auto px-4" dir={isRTL ? "rtl" : "ltr"}>
            <Reveal>
            <div className="max-w-6xl mx-auto grid gap-10 lg:grid-cols-2 items-start">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <HelpCircle className="h-4 w-4 text-primary" />
                  {isRTL ? "الأسئلة الشائعة" : "FAQ"}
                </div>
                <h2 className="text-3xl md:text-4xl font-bold">
                  {isRTL ? "إجابات سريعة قبل أن تبدأ" : "Quick Answers Before You Start"}
                </h2>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  {isRTL
                    ? "جمعنا لك أكثر الأسئلة شيوعًا حول NEON: التسجيل، الدورات، الشهادات، والدعم."
                    : "A short list of the most common questions about NEON: signup, courses, certificates, and support."}
                </p>
                <div className="pt-2">
                  <Link href={`/${language}/faq`}>
                    <Button variant="outline" className="font-semibold">
                      {isRTL ? "عرض كل الأسئلة" : "View All FAQs"}
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="rounded-2xl border bg-background/50 backdrop-blur-sm">
                <Accordion type="single" collapsible>
                  {getFaqItems(isRTL ? "ar" : "en")
                    .slice(0, 5)
                    .map((item, idx) => (
                      <AccordionItem key={idx} value={`home-faq-${idx}`}>
                        <AccordionTrigger className="px-5">{item.q}</AccordionTrigger>
                        <AccordionContent className="px-5 text-muted-foreground leading-relaxed">
                          {item.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                </Accordion>
              </div>
            </div>
            </Reveal>
          </div>
        </section>

        <section className="py-24 relative overflow-hidden">
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

              {reviews.length > 0 && (
                <div className="pt-8 border-t border-primary/10 text-start" dir={isRTL ? "rtl" : "ltr"}>
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div className="font-semibold text-base">{isRTL ? "آراء الطلاب" : "Student Reviews"}</div>
                    <div className="text-xs text-muted-foreground">
                      {isRTL ? "أحدث التقييمات" : "Latest ratings"}
                    </div>
                  </div>

                  <div className="reviews-marquee">
                    <div className="reviews-track">
                      {[...reviews, ...reviews].map((r, idx) => (
                        <Card
                          key={`${r.id}-${idx}`}
                          className="reviews-card border-primary/10 bg-background/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:bg-background/80"
                        >
                          <CardContent className="p-4 space-y-3" dir={isRTL ? "rtl" : "ltr"}>
                            <div className="flex items-center justify-between gap-2">
                              <div className="font-medium text-sm truncate">
                                {r.userName || (isRTL ? "طالب" : "Student")}
                              </div>
                              <div className="flex items-center gap-0.5 shrink-0">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={[
                                      "h-3.5 w-3.5",
                                      i < Number((r as any).rating || 0)
                                        ? "text-amber-500 fill-amber-500"
                                        : "text-muted-foreground/40",
                                    ].join(" ")}
                                  />
                                ))}
                              </div>
                            </div>

                            <div className="text-xs text-muted-foreground truncate">
                              {(isRTL ? r.courseTitleAr : r.courseTitleEn) || (isRTL ? "دورة" : "Course")}
                            </div>

                            <div className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                              {r.comment}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    <div className="reviews-fade-left" />
                    <div className="reviews-fade-right" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid gap-10 md:grid-cols-3">
            <div className="space-y-3">
              <div className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {isRTL ? "نيون" : "Neon"}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {isRTL
                  ? "منصة تعلم إلكتروني تساعدك على تطوير مهاراتك عبر دورات عالية الجودة."
                  : "An e-learning platform to help you grow your skills through high-quality courses."}
              </p>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-semibold">{isRTL ? "روابط" : "Links"}</div>
              <div className="grid gap-2 text-sm">
                <Link className="text-muted-foreground hover:text-foreground transition-colors" href={`/${language}/about`}>
                  {isRTL ? "من نحن" : "About Us"}
                </Link>
                <Link className="text-muted-foreground hover:text-foreground transition-colors" href={`/${language}/privacy`}>
                  {isRTL ? "سياسة الخصوصية" : "Privacy Policy"}
                </Link>
                <Link className="text-muted-foreground hover:text-foreground transition-colors" href={`/${language}/terms`}>
                  {isRTL ? "شروط الاستخدام" : "Terms of Use"}
                </Link>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-semibold">{isRTL ? "الدعم" : "Support"}</div>
              <div className="grid gap-2 text-sm">
                <Link className="text-muted-foreground hover:text-foreground transition-colors" href={`/${language}/faq`}>
                  {isRTL ? "الأسئلة الشائعة" : "FAQ"}
                </Link>
                <Link className="text-muted-foreground hover:text-foreground transition-colors" href={`/${language}/contact`}>
                  {isRTL ? "تواصل معنا" : "Contact"}
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-10 border-t pt-6 text-center">
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
