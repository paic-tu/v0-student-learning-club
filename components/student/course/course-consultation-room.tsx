"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import LiveClassroomClient from "@/components/live-classroom-client"
import { ArrowLeft } from "lucide-react"

interface CourseConsultationRoomProps {
  lang: string
  roomName: string
  user: {
    id: string
    name: string
    role: string
    image?: string
  }
}

export function CourseConsultationRoom({ lang, roomName, user }: CourseConsultationRoomProps) {
  const isAr = lang === "ar"
  const [joined, setJoined] = useState(false)

  if (!joined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{isAr ? "استشارة تقنية مباشرة" : "Live Tech Consultation"}</CardTitle>
          <CardDescription>
            {isAr
              ? "ادخل الغرفة واطرح سؤالك، ويمكنك رفع اليد للتحدث."
              : "Join the room, ask your question, and raise your hand to speak."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button size="lg" className="w-full" onClick={() => setJoined(true)}>
            {isAr ? "دخول الاستشارة" : "Join Consultation"}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="relative h-[75vh] rounded-lg border bg-background overflow-hidden">
      <div className="absolute top-4 left-4 z-10">
        <Button variant="secondary" onClick={() => setJoined(false)} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          {isAr ? "رجوع" : "Back"}
        </Button>
      </div>

      <LiveClassroomClient roomName={roomName} user={user} isAr={isAr} />
    </div>
  )
}
