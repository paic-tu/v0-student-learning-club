"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { MessageCircle, User, Calendar, Trophy, BookOpen, CheckCircle, Loader2 } from "lucide-react"
import { createPrivateChat, getPublicUserProfile } from "@/lib/actions/chat"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"

interface UserActionPopoverProps {
  children: React.ReactNode
  user: {
    id: string
    name: string
    avatarUrl?: string | null
    role?: string
  }
  currentUserId: string
  onOpenChange?: (open: boolean) => void
}

export function UserActionPopover({ children, user, currentUserId, onOpenChange }: UserActionPopoverProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [loading, setLoading] = useState(false)
  const [profileData, setProfileData] = useState<any>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const isMe = user.id === currentUserId

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    onOpenChange?.(open)
  }

  const handleSendMessage = async () => {
    try {
      setLoading(true)
      const result = await createPrivateChat(user.id)
      
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      } else if (result.conversationId) {
        // Find the current path segment to know if we are in student, instructor or admin
        const path = window.location.pathname
        let prefix = "/student"
        if (path.includes("/instructor/")) prefix = "/instructor"
        else if (path.includes("/admin/")) prefix = "/admin"
        
        router.push(`${prefix}/chat?id=${result.conversationId}`)
        setIsOpen(false)
      }
    } catch (error) {
      console.error("Failed to create chat:", error)
      toast({
        title: "Error",
        description: "Failed to start conversation",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleViewProfile = async () => {
    setIsOpen(false)
    setShowProfile(true)
    
    try {
      setProfileLoading(true)
      const data = await getPublicUserProfile(user.id)
      setProfileData(data)
    } catch (error) {
      console.error("Failed to fetch profile:", error)
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      })
    } finally {
      setProfileLoading(false)
    }
  }

  if (isMe) {
    return <>{children}</>
  }

  return (
    <>
      <Popover open={isOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          {children}
        </PopoverTrigger>
        <PopoverContent className="w-60 p-0" align="start">
          <div className="flex flex-col p-4 border-b bg-muted/20">
            <div className="flex items-center gap-3 mb-2">
              <Avatar className="h-10 w-10 border">
                <AvatarImage src={user.avatarUrl || "/placeholder-user.jpg"} />
                <AvatarFallback>{user.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col overflow-hidden">
                <span className="font-semibold truncate text-sm">{user.name}</span>
                <span className="text-xs text-muted-foreground capitalize">{user.role || "Member"}</span>
              </div>
            </div>
          </div>
          <div className="p-1">
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2 h-9 text-sm" 
              onClick={handleSendMessage}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
              Send Message
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2 h-9 text-sm"
              onClick={handleViewProfile}
            >
              <User className="h-4 w-4" />
              View Profile
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>User Profile</DialogTitle>
          </DialogHeader>
          
          {profileLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-sm text-muted-foreground">Loading profile...</p>
            </div>
          ) : profileData ? (
            <div className="flex flex-col gap-6 py-2">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-20 w-20 border-2 border-primary/10 mb-3">
                  <AvatarImage src={profileData.avatarUrl || "/placeholder-user.jpg"} />
                  <AvatarFallback className="text-xl">{profileData.name[0]}</AvatarFallback>
                </Avatar>
                <h3 className="font-bold text-xl">{profileData.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="capitalize">
                    {profileData.role}
                  </Badge>
                  {profileData.headline && (
                    <span className="text-sm text-muted-foreground">
                      {profileData.headline}
                    </span>
                  )}
                </div>
                {profileData.createdAt && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                    <Calendar className="h-3 w-3" />
                    <span>Joined {new Date(profileData.createdAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {profileData.bio && (
                <div className="bg-muted/30 p-3 rounded-lg text-sm text-muted-foreground italic">
                  "{profileData.bio}"
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col items-center p-3 bg-secondary/20 rounded-lg border border-secondary/30">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                    <Trophy className="h-3.5 w-3.5" />
                    <span>Points</span>
                  </div>
                  <span className="font-bold text-lg">{profileData.points || 0}</span>
                </div>
                <div className="flex flex-col items-center p-3 bg-secondary/20 rounded-lg border border-secondary/30">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>Level</span>
                  </div>
                  <span className="font-bold text-lg">{profileData.level || 1}</span>
                </div>
              </div>

              {profileData.stats && (
                <div className="grid grid-cols-2 gap-3">
                   <div className="flex flex-col items-center p-3 bg-muted/20 rounded-lg">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                      <BookOpen className="h-3.5 w-3.5" />
                      <span>Enrolled</span>
                    </div>
                    <span className="font-bold text-lg">{profileData.stats.enrolled || 0}</span>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-muted/20 rounded-lg">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>Completed</span>
                    </div>
                    <span className="font-bold text-lg">{profileData.stats.completed || 0}</span>
                  </div>
                </div>
              )}
              
              <Button onClick={handleSendMessage} className="w-full gap-2" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                Send Message
              </Button>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              User profile not found.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
