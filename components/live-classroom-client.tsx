"use client"

import {
  LiveKitRoom,
  useRoomContext,
  VideoConference,
} from "@livekit/components-react"
import "@livekit/components-styles"
import { DataPacket_Kind, RoomEvent } from "livekit-client"
import { useEffect, useMemo, useRef, useState } from "react"
import { Hand, Loader2, MicOff, VideoOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface UserInfo {
  id: string
  name: string
  role: string
}

const LiveKitRoomAny = LiveKitRoom as any
const VideoConferenceAny = VideoConference as any

export default function LiveClassroomClient({
  roomName,
  user,
  isAr,
  mode,
}: {
  roomName: string
  user: UserInfo
  isAr: boolean
  mode?: "student" | "instructor"
}) {
  const [token, setToken] = useState("")
  const { toast } = useToast()

  const effectiveMode = useMemo(() => {
    if (mode) return mode
    return user.role === "instructor" || user.role === "admin" ? "instructor" : "student"
  }, [mode, user.role])

  useEffect(() => {
    if (!roomName || !user) return

    const controller = new AbortController()
    ;(async () => {
      try {
        const resp = await fetch(
          `/api/livekit?room=${roomName}&username=${encodeURIComponent(user.name || user.id)}`,
          { signal: controller.signal }
        )
        const data = await resp.json()
        setToken(data.token)
      } catch (e) {
        if ((e as any)?.name === "AbortError") return
        console.error(e)
        toast({
          title: isAr ? "خطأ" : "Error",
          description: isAr ? "فشل في الاتصال بالخادم" : "Failed to connect to server",
          variant: "destructive",
        })
      }
    })()

    return () => controller.abort()
  }, [roomName, user, isAr, toast])

  if (!token) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className={cn("ml-2", isAr && "ml-0 mr-2")}>
          {isAr ? "جاري الانضمام..." : "Joining Class..."}
        </span>
      </div>
    )
  }

  const shouldAutoEnableAv = effectiveMode === "instructor"

  return (
    <LiveKitRoomAny
      video={shouldAutoEnableAv}
      audio={shouldAutoEnableAv}
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      data-lk-theme="default"
      style={{ height: "100vh" }}
      onDisconnected={() => {
        toast({
          title: isAr ? "انقطع الاتصال" : "Disconnected",
          description: isAr ? "لقد غادرت البث المباشر" : "You have left the live stream",
        })
      }}
    >
      <ClassroomLayout isAr={isAr} user={user} effectiveMode={effectiveMode} />
    </LiveKitRoomAny>
  )
}

function ClassroomLayout({
  isAr,
  user,
  effectiveMode,
}: {
  isAr: boolean
  user: UserInfo
  effectiveMode: "student" | "instructor"
}) {
  const room = useRoomContext()
  const { toast } = useToast()
  const [raisedHands, setRaisedHands] = useState<string[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<BlobPart[]>([])

  const isInstructorView = effectiveMode === "instructor"

  useEffect(() => {
    if (effectiveMode !== "student") return

    const applyDefaultMute = async () => {
      try {
        await room.localParticipant.setMicrophoneEnabled(false)
      } catch {
      }
      try {
        await room.localParticipant.setCameraEnabled(false)
      } catch {
      }
    }

    const onConnected = () => {
      void applyDefaultMute()
    }

    room.on(RoomEvent.Connected, onConnected)
    void applyDefaultMute()

    return () => {
      room.off(RoomEvent.Connected, onConnected)
    }
  }, [room, effectiveMode])

  useEffect(() => {
    const handleData = (payload: Uint8Array, participant?: any, _kind?: DataPacket_Kind) => {
      const str = new TextDecoder().decode(payload)
      try {
        const data = JSON.parse(str)

        if (data.type === "RAISE_HAND") {
          toast({
            title: isAr ? "رفع اليد" : "Hand Raised",
            description: `${participant?.identity || "Someone"} ${isAr ? "رفع يده" : "raised their hand"}`,
          })
          const who = participant?.identity || "Unknown"
          setRaisedHands((prev) => {
            if (prev.includes(who)) return prev
            return [...prev, who]
          })
          return
        }

        if (effectiveMode !== "student") return

        if (data.type === "FORCE_MUTE") {
          void room.localParticipant.setMicrophoneEnabled(false)
          toast({
            title: isAr ? "تم كتم المايك" : "Mic muted",
            description: isAr ? "تم إيقاف المايك بواسطة المدرس" : "Instructor muted your microphone",
          })
          return
        }

        if (data.type === "FORCE_CAMERA_OFF") {
          void room.localParticipant.setCameraEnabled(false)
          toast({
            title: isAr ? "تم إيقاف الكاميرا" : "Camera off",
            description: isAr ? "تم إيقاف الكاميرا بواسطة المدرس" : "Instructor turned off your camera",
          })
          return
        }
      } catch {
      }
    }

    room.on(RoomEvent.DataReceived, handleData)
    return () => {
      room.off(RoomEvent.DataReceived, handleData)
    }
  }, [room, isAr, toast, effectiveMode])

  const sendRaiseHand = async () => {
    const data = JSON.stringify({ type: "RAISE_HAND" })
    const encoder = new TextEncoder()
    await room.localParticipant.publishData(encoder.encode(data), {
      reliable: true,
    })
    toast({
      title: isAr ? "تم رفع اليد" : "Hand Raised",
      description: isAr ? "لقد قمت برفع يدك للمدرس" : "You raised your hand to the instructor",
    })
  }

  const broadcast = async (type: "FORCE_MUTE" | "FORCE_CAMERA_OFF") => {
    const data = JSON.stringify({ type })
    const encoder = new TextEncoder()
    await room.localParticipant.publishData(encoder.encode(data), { reliable: true })
  }

  const startRecording = async () => {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      })
      const mimeType = "video/webm"
      const recorder = new MediaRecorder(displayStream, { mimeType })
      recordedChunksRef.current = []
      recorder.ondataavailable = (e: BlobEvent) => {
        if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: mimeType })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `live-recording-${new Date().toISOString()}.webm`
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
        toast({
          title: isAr ? "تم حفظ التسجيل" : "Recording Saved",
          description: isAr ? "تم تنزيل الفيديو على جهازك" : "Video downloaded to your device",
        })
      }
      recorder.start()
      mediaRecorderRef.current = recorder
      setIsRecording(true)
      toast({
        title: isAr ? "بدأ التسجيل" : "Recording Started",
        description: isAr ? "يتم تسجيل الشاشة والصوت الآن" : "Screen and audio are now recording",
      })
    } catch (e) {
      console.error(e)
      toast({
        title: isAr ? "فشل التسجيل" : "Recording Failed",
        description: isAr
          ? "تأكد من منح صلاحية مشاركة الشاشة والصوت"
          : "Ensure screen/audio capture permission is granted",
        variant: "destructive",
      })
    }
  }

  const stopRecording = () => {
    const r = mediaRecorderRef.current
    if (r && r.state !== "inactive") {
      r.stop()
      setIsRecording(false)
    }
  }

  const handleMuteAll = async () => {
    await broadcast("FORCE_MUTE")
    toast({
      title: isAr ? "تم إرسال أمر الكتم" : "Mute sent",
      description: isAr ? "تم كتم مايكات الطلاب" : "Students' microphones were muted",
    })
  }

  const handleCameraOffAll = async () => {
    await broadcast("FORCE_CAMERA_OFF")
    toast({
      title: isAr ? "تم إرسال أمر إيقاف الكاميرات" : "Camera off sent",
      description: isAr ? "تم إيقاف كاميرات الطلاب" : "Students' cameras were turned off",
    })
  }

  return (
    <div className="relative h-full w-full">
      <VideoConferenceAny />
      
      {!isInstructorView && (
        <div
          className={cn(
            "absolute bottom-4 left-4 z-50 flex flex-wrap items-center gap-2",
            isAr && "left-auto right-4"
          )}
        >
          <Button
            variant="secondary"
            size="sm"
            onClick={sendRaiseHand}
            className="shadow-lg bg-background/80 backdrop-blur-sm hover:bg-background"
          >
            <Hand className={cn("mr-2 h-4 w-4 text-yellow-500", isAr && "mr-0 ml-2")} />
            {isAr ? "رفع اليد" : "Raise Hand"}
          </Button>
        </div>
      )}

      {isInstructorView && (
        <aside
          className={cn(
            "absolute top-4 right-4 z-50 w-64 rounded-lg border bg-background/80 backdrop-blur-sm shadow-lg",
            isAr && "right-auto left-4"
          )}
        >
          <div className="p-3 border-b text-sm font-semibold">
            {isAr ? "تحكم البث" : "Live Controls"}
          </div>
          <div className="p-3 space-y-2">
            <Button
              variant="secondary"
              size="sm"
              className="w-full justify-start"
              onClick={handleMuteAll}
            >
              <MicOff className={cn("mr-2 h-4 w-4", isAr && "mr-0 ml-2")} />
              {isAr ? "كتم الطلاب" : "Mute Students"}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="w-full justify-start"
              onClick={handleCameraOffAll}
            >
              <VideoOff className={cn("mr-2 h-4 w-4", isAr && "mr-0 ml-2")} />
              {isAr ? "إيقاف الكاميرات" : "Stop Cameras"}
            </Button>
            <Button
              variant={isRecording ? "destructive" : "secondary"}
              size="sm"
              className="w-full justify-start"
              onClick={isRecording ? stopRecording : startRecording}
            >
              <div
                className={cn(
                  "mr-2 h-3 w-3 rounded-full",
                  isAr && "mr-0 ml-2",
                  isRecording ? "bg-red-600 animate-pulse" : "bg-green-600"
                )}
              />
              {isRecording ? (isAr ? "إيقاف التسجيل" : "Stop Recording") : (isAr ? "بدء التسجيل" : "Start Recording")}
            </Button>
          </div>
          {raisedHands.length > 0 && (
            <div className="p-3 border-t text-xs text-muted-foreground">
              <div className="font-medium mb-1">
                {isAr ? "أيدي مرفوعة:" : "Raised Hands:"}
              </div>
              <div className="space-y-1">
                {raisedHands.map((n) => (
                  <div key={n} className="truncate">{n}</div>
                ))}
              </div>
            </div>
          )}
        </aside>
      )}
    </div>
  )
}
