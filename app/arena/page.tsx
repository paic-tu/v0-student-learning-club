"use client"

import { useState, useEffect } from "react"
import { NavBar } from "@/components/nav-bar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/lib/language-context"
import { Trophy, Medal, Award, TrendingUp } from "lucide-react"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export default function ArenaPage() {
  const { language } = useLanguage()
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLeaderboard()
  }, [])

  const loadLeaderboard = async () => {
    try {
      // Get top users by points
      const users = await sql`
        SELECT 
          id, 
          name, 
          email, 
          points, 
          level,
          avatar_url
        FROM users
        WHERE role = 'student'
        ORDER BY points DESC
        LIMIT 50
      `
      setLeaderboard(users)
    } catch (error) {
      console.error("[v0] Error loading leaderboard:", error)
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-500" />
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />
    if (rank === 3) return <Award className="h-6 w-6 text-amber-700" />
    return null
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
    if (rank === 2) return "bg-gray-400/10 text-gray-400 border-gray-400/20"
    if (rank === 3) return "bg-amber-700/10 text-amber-700 border-amber-700/20"
    return "bg-muted"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Trophy className="h-8 w-8 text-primary" />
            {language === "ar" ? "ساحة المنافسة" : "Competitive Arena"}
          </h1>
          <p className="text-muted-foreground">
            {language === "ar" ? "أفضل المتعلمين على المنصة" : "Top learners on the platform"}
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6 mb-6">
          <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                {language === "ar" ? "المجموع الكلي" : "Total Points"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {leaderboard.reduce((sum, user) => sum + user.points, 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                {language === "ar" ? "المتنافسون" : "Competitors"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{leaderboard.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Award className="h-4 w-4" />
                {language === "ar" ? "أعلى نقاط" : "Highest Score"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{leaderboard[0]?.points || 0}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Medal className="h-4 w-4" />
                {language === "ar" ? "متوسط النقاط" : "Average Points"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(leaderboard.reduce((sum, user) => sum + user.points, 0) / leaderboard.length) || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{language === "ar" ? "لوحة الصدارة" : "Leaderboard"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {leaderboard.map((user, index) => (
                <div
                  key={user.id}
                  className={`flex items-center gap-4 p-4 rounded-lg border transition-colors hover:bg-muted/50 ${
                    index < 3 ? getRankBadge(index + 1) : "border-border"
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-8 text-center font-bold text-lg">
                      {getRankIcon(index + 1) || <span className="text-muted-foreground">#{index + 1}</span>}
                    </div>
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {language === "ar" ? "المستوى" : "Level"} {user.level}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-lg font-bold px-4 py-1">
                    {user.points.toLocaleString()} {language === "ar" ? "نقطة" : "pts"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
