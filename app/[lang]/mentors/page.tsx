"use client"

import { useState, useEffect } from "react"
import { useLanguage } from "@/lib/language-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Star, Calendar, Search } from "lucide-react"
import Link from "next/link"

export default function MentorsPage() {
  const { language } = useLanguage()
  const [mentors, setMentors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchMentors()
  }, [])

  async function fetchMentors() {
    try {
      const res = await fetch("/api/mentors")
      const data = await res.json()
      setMentors(data.mentors || [])
    } catch (error) {
      console.error("[v0] Error fetching mentors:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredMentors = mentors.filter((mentor) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      mentor.name.toLowerCase().includes(query) ||
      mentor.bio_en?.toLowerCase().includes(query) ||
      mentor.bio_ar?.toLowerCase().includes(query) ||
      mentor.skills?.some((skill: string) => skill.toLowerCase().includes(query))
    )
  })

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-2">{language === "ar" ? "المرشدون" : "Mentors"}</h1>
          <p className="text-muted-foreground text-lg">
            {language === "ar" ? "احجز جلسة إرشادية مع خبراء في مجالك" : "Book mentorship sessions with experts"}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={language === "ar" ? "ابحث عن مرشد..." : "Search for a mentor..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="h-16 w-16 bg-muted rounded-full mb-4"></div>
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </Card>
            ))}
          </div>
        ) : filteredMentors.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground text-lg">
              {language === "ar" ? "لا توجد مرشدين متاحين" : "No mentors available"}
            </p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMentors.map((mentor: any) => (
              <Card key={mentor.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                    {mentor.avatar_url ? (
                      <img
                        src={mentor.avatar_url || "/placeholder.svg"}
                        alt={mentor.name}
                        className="w-16 h-16 object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-bold">{mentor.name.charAt(0)}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold">{mentor.name}</h3>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      <span className="font-medium">{Number.parseFloat(mentor.rating || 0).toFixed(1)}</span>
                      <span className="text-sm text-muted-foreground">
                        ({mentor.total_sessions || 0} {language === "ar" ? "جلسة" : "sessions"})
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-muted-foreground mb-4 line-clamp-3">
                  {language === "ar" ? mentor.bio_ar : mentor.bio_en}
                </p>

                {mentor.skills && mentor.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {mentor.skills.slice(0, 3).map((skill: string, index: number) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                    {mentor.skills.length > 3 && <Badge variant="outline">+{mentor.skills.length - 3}</Badge>}
                  </div>
                )}

                {mentor.hourly_rate && (
                  <p className="text-lg font-bold mb-4">
                    {mentor.hourly_rate} {language === "ar" ? "ريال/ساعة" : "SAR/hour"}
                  </p>
                )}

                <Link href={`/mentors/${mentor.id}`}>
                  <Button className="w-full">
                    {language === "ar" ? "عرض الملف الشخصي" : "View Profile"}
                    <Calendar className="h-4 w-4 mr-2" />
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
