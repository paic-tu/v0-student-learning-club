import { Suspense } from "react"
import { getPlatformStats } from "@/lib/db/queries"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, BookOpen, Trophy, Award, ShoppingCart, Activity } from "lucide-react"
import { translations, type Language } from "@/lib/i18n"

async function DashboardStats({ lang }: { lang: Language }) {
  const stats = await getPlatformStats()

  if (!stats) {
    return <div>Failed to load stats</div>
  }

  const t = translations

  const statItems = [
    {
      title: t.students[lang],
      value: stats.student_count,
      icon: Users,
      color: "text-blue-500",
    },
    {
      title: t.courses[lang],
      value: stats.course_count,
      icon: BookOpen,
      color: "text-green-500",
    },
    {
      title: t.enrollments[lang],
      value: stats.enrollment_count,
      icon: Activity,
      color: "text-purple-500",
    },
    {
      title: t.certificates[lang],
      value: stats.certificate_count,
      icon: Award,
      color: "text-yellow-500",
    },
    {
      title: t.challenges[lang],
      value: stats.challenge_count,
      icon: Trophy,
      color: "text-orange-500",
    },
    {
      title: t.contests[lang],
      value: stats.contest_count,
      icon: Trophy,
      color: "text-red-500",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {statItems.map((item) => (
        <Card key={item.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
            <item.icon className={`h-4 w-4 ${item.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{item.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default async function AdminDashboardPage(props: { params: Promise<{ lang: Language }> }) {
  const params = await props.params
  const { lang } = params

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{translations.dashboard[lang]}</h1>
        <p className="text-muted-foreground">Overview of your learning platform statistics.</p>
      </div>

      <Suspense fallback={<div>Loading stats...</div>}>
        {/* @ts-expect-error Server Component */}
        <DashboardStats lang={lang} />
      </Suspense>
    </div>
  )
}
