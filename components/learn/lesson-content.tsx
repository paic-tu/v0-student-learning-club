"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PlayCircle, FileText, Trash2, Clock } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useState, useRef, useEffect } from "react"
import { createNote, deleteNote } from "@/lib/db/queries"
import { formatDistanceToNow } from "date-fns"
import { arSA, enUS } from "date-fns/locale"
import ReactMarkdown from "react-markdown"

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

interface NotesSectionProps {
  isAr: boolean
  newNote: string
  setNewNote: (val: string) => void
  isSubmitting: boolean
  onAddNote: () => void
  videoRef: React.RefObject<HTMLVideoElement>
  notes: any[]
  onDeleteNote: (id: string) => void
  onSeek: (timestamp: number) => void
}

function NotesSection({
  isAr,
  newNote,
  setNewNote,
  isSubmitting,
  onAddNote,
  videoRef,
  notes,
  onDeleteNote,
  onSeek
}: NotesSectionProps) {
  return (
    <div className="space-y-6 py-4">
      <div className="space-y-4">
        <Textarea
          placeholder={isAr ? "أضف ملاحظة جديدة..." : "Add a new note..."}
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          rows={3}
          className="text-start"
        />
        <div className="flex justify-between items-center">
          <Button 
            onClick={onAddNote} 
            disabled={!newNote.trim() || isSubmitting}
          >
            {isSubmitting ? (isAr ? "جاري الحفظ..." : "Saving...") : (isAr ? "حفظ الملاحظة" : "Save Note")}
          </Button>
          {videoRef?.current && (
            <Badge variant="outline" className="text-xs">
              {isAr ? "الوقت الحالي: " : "Current time: "}
              {formatTime(videoRef.current.currentTime)}
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {notes.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            {isAr ? "لا توجد ملاحظات حتى الآن." : "No notes yet."}
          </p>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="border rounded-lg p-4 space-y-2 bg-card">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  {note.timestamp !== null && note.timestamp !== undefined && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs font-mono bg-muted hover:bg-muted/80"
                      onClick={() => onSeek(note.timestamp)}
                    >
                      <Clock className="h-3 w-3 me-1" />
                      {formatTime(note.timestamp)}
                    </Button>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(note.createdAt), { 
                      addSuffix: true,
                      locale: isAr ? arSA : enUS 
                    })}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  onClick={() => onDeleteNote(note.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <p className="whitespace-pre-wrap text-sm text-start">{note.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

import { QuizClient } from "@/components/quiz-client"

interface LessonContentProps {
  lesson: any
  lang: string
  userId?: string
  initialNotes?: any[]
  quiz?: any
  quizSubmission?: any
}

export function LessonContent({ lesson, lang, userId, initialNotes = [], quiz, quizSubmission }: LessonContentProps) {
  const isAr = lang === "ar"
  const [notes, setNotes] = useState(initialNotes)
  const [newNote, setNewNote] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Update notes when initialNotes changes (e.g. navigation)
  useEffect(() => {
    setNotes(initialNotes)
  }, [initialNotes])

  const handleAddNote = async () => {
    if (!newNote.trim() || !userId) return
    setIsSubmitting(true)
    
    // Get current timestamp if video is available
    const timestamp = videoRef.current ? Math.floor(videoRef.current.currentTime) : undefined
    
    try {
      const note = await createNote(userId, lesson.id, newNote, timestamp)
      if (note) {
        setNotes([note, ...notes])
        setNewNote("")
      }
    } catch (error) {
      console.error("Failed to add note", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!userId) return
    try {
      await deleteNote(noteId, userId)
      setNotes(notes.filter(n => n.id !== noteId))
    } catch (error) {
      console.error("Failed to delete note", error)
    }
  }

  const seekTo = (timestamp: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp
      videoRef.current.play()
    }
  }

  if (lesson.type === "video") {
    return (
      <div className="space-y-6">
        <div className="aspect-video bg-black rounded-lg overflow-hidden relative group">
          {lesson.videoUrl ? (
            <video 
              ref={videoRef}
              src={lesson.videoUrl} 
              controls 
              className="w-full h-full"
              poster={lesson.thumbnailUrl}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/50">
              <div className="text-center">
                <PlayCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Video content unavailable</p>
              </div>
            </div>
          )}
        </div>
        
        <Tabs defaultValue="overview" className="w-full" dir={isAr ? "rtl" : "ltr"}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">{isAr ? "نظرة عامة" : "Overview"}</TabsTrigger>
            <TabsTrigger value="notes">{isAr ? "الملاحظات" : "Notes"}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-6 text-start">
            <h1 className="text-2xl font-bold mb-2">{isAr ? lesson.titleAr : lesson.titleEn}</h1>
            <div className="prose dark:prose-invert max-w-none mb-6">
              <p>{isAr ? lesson.descriptionAr : lesson.descriptionEn}</p>
            </div>
            {(isAr ? lesson.contentAr : lesson.contentEn) && (
              <div className="prose dark:prose-invert max-w-none border-t pt-6">
                <ReactMarkdown>{isAr ? lesson.contentAr : lesson.contentEn || ""}</ReactMarkdown>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="notes">
            <NotesSection 
              isAr={isAr}
              newNote={newNote}
              setNewNote={setNewNote}
              isSubmitting={isSubmitting}
              onAddNote={handleAddNote}
              videoRef={videoRef}
              notes={notes}
              onDeleteNote={handleDeleteNote}
              onSeek={seekTo}
            />
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  if (lesson.type === "quiz") {
    if (!quiz) {
      return (
        <Card className="p-8 text-center border-dashed">
          <p className="text-muted-foreground">
            {isAr ? "لم يتم العثور على الاختبار" : "Quiz content not found"}
          </p>
        </Card>
      )
    }
    
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <Badge variant="outline" className="capitalize">
            <FileText className="h-3 w-3 me-1" />
            {lesson.type}
          </Badge>
          {lesson.durationMinutes && (
            <span className="text-sm text-muted-foreground">{lesson.durationMinutes} min</span>
          )}
        </div>
        
        <h1 className="text-3xl font-bold mb-6 text-start">{isAr ? lesson.titleAr : lesson.titleEn}</h1>
        
        <QuizClient challenge={quiz} previousSubmission={quizSubmission} />
      </div>
    )
  }

  if (lesson.type === "article" || lesson.type === "resource" || lesson.type === "assignment") {
    return (
      <Card className="p-8 text-start" dir={isAr ? "rtl" : "ltr"}>
        <div className="flex items-center gap-2 mb-6">
          <Badge variant="outline" className="capitalize">
            <FileText className="h-3 w-3 me-1" />
            {lesson.type}
          </Badge>
          <span className="text-sm text-muted-foreground">{lesson.durationMinutes} min</span>
        </div>
        
        <h1 className="text-3xl font-bold mb-6">{isAr ? lesson.titleAr : lesson.titleEn}</h1>
        
        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="content">{isAr ? "المحتوى" : "Content"}</TabsTrigger>
            <TabsTrigger value="notes">{isAr ? "الملاحظات" : "Notes"}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="content">
            <div className="prose dark:prose-invert max-w-none">
              <ReactMarkdown>{isAr ? lesson.contentAr : lesson.contentEn || ""}</ReactMarkdown>
            </div>
          </TabsContent>
          
          <TabsContent value="notes">
            <NotesSection 
              isAr={isAr}
              newNote={newNote}
              setNewNote={setNewNote}
              isSubmitting={isSubmitting}
              onAddNote={handleAddNote}
              videoRef={videoRef}
              notes={notes}
              onDeleteNote={handleDeleteNote}
              onSeek={seekTo}
            />
          </TabsContent>
        </Tabs>
      </Card>
    )
  }

  return (
    <div className="p-8 text-center border rounded-lg border-dashed">
      <p className="text-muted-foreground">
        Unsupported lesson type: {lesson.type}
      </p>
    </div>
  )
}
