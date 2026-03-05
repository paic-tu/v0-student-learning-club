import { Suspense } from "react"
import { getPlatformStats } from "@/lib/db/queries"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, BookOpen, Trophy, Award, ShoppingCart, Activity } from "lucide-react"

async function DashboardStats() {
  const stats = await getPlatformStats()

  if (!stats) {
    return <div>Failed to load stats</div>
  }

  const statItems = [
    {
      title: "Students",
      value: stats.student_count,
      icon: Users,
      color: "text-blue-500",
    },
    {
      title: "Courses",
      value: stats.course_count,
      icon: BookOpen,
      color: "text-green-500",
    },
    {
      title: "Enrollments",
      value: stats.enrollment_count,
      icon: Activity,
      color: "text-purple-500",
    },
    {
      title: "Certificates",
      value: stats.certificate_count,
      icon: Award,
      color: "text-yellow-500",
    },
    {
      title: "Challenges",
      value: stats.challenge_count,
      icon: Trophy,
      color: "text-orange-500",
    },
    {
      title: "Contests",
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

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your learning platform statistics.</p>
      </div>

      <Suspense fallback={<div>Loading stats...</div>}>
        {/* @ts-expect-error Server Component */}
        <DashboardStats />
      </Suspense>
    </div>
  )
}
