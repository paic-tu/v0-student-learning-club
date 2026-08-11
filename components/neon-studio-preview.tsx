"use client"

import {
  FileText,
  FileCode,
  StickyNote,
  Globe,
  Plus,
  Settings,
  Search,
  ChevronDown,
  Send,
  Sparkles,
  MoreVertical,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Copy {
  isAr: boolean
}

const sources = [
  { title: { ar: "ملاحظات الفيزياء", en: "Physics Notes" }, Icon: FileText, color: "text-rose-400" },
  { title: { ar: "مواصفات المشروع", en: "Project Specs" }, Icon: FileCode, color: "text-blue-400" },
  { title: { ar: "الأدب.pdf", en: "Literature.pdf" }, Icon: FileText, color: "text-rose-400" },
  { title: { ar: "ملاحظات", en: "Notes" }, Icon: StickyNote, color: "text-amber-400" },
]

const analysisPanels = (isAr: boolean) => [
  {
    title: isAr ? "ملخص ذكي" : "AI Summary",
    content: isAr
      ? "تجميع تلقائي وتحليل ذكي للمصادر المرفوعة، يبرز أهم الأفكار والروابط بينها بشكل مباشر."
      : "An automatic compilation and AI analysis of your uploaded sources, surfacing the key ideas and how they connect.",
  },
  {
    title: isAr ? "المفاهيم الرئيسية" : "Key Concepts",
    bullets: isAr
      ? ["أساسيات الموضوع", "الروابط بين المصادر", "نقاط تحتاج مراجعة"]
      : ["Core fundamentals", "Cross-source connections", "Points worth revisiting"],
  },
  {
    title: isAr ? "أسئلة مقترحة" : "Suggested Questions",
    numbered: isAr
      ? ["ما أهم فكرة في هذا المصدر؟", "كيف ترتبط هذه المصادر ببعضها؟"]
      : ["What's the key idea in this source?", "How do these sources connect?"],
  },
]

export function NeonStudioPreview({ isAr }: Copy) {
  return (
    <div className="relative mx-auto w-full max-w-6xl" dir={isAr ? "rtl" : "ltr"}>
      {/* Decorative floating neon shapes — pure CSS, no images */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-8 left-8 h-16 w-16 rotate-12 rounded-xl border-2 border-accent/40 opacity-60 blur-[0.3px] sm:h-20 sm:w-20" />
        <div className="absolute -bottom-10 right-10 h-20 w-20 -rotate-12 rounded-2xl border-2 border-primary/40 opacity-50 blur-[0.3px] sm:h-24 sm:w-24" />
        <div className="absolute top-1/3 -right-6 h-10 w-10 rotate-45 rounded-lg border-2 border-accent/30 opacity-40" />
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none select-none overflow-hidden rounded-2xl border border-primary/15 bg-background/30 shadow-2xl shadow-primary/10 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/20"
      >
        {/* Mock title bar */}
        <div className="flex items-center justify-between border-b border-primary/10 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-xs font-bold text-primary-foreground">
              N
            </span>
            <span className="text-sm font-bold tracking-wide">Neon Studio</span>
          </div>
          <Settings className="h-4 w-4 text-muted-foreground" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[0.85fr_1.3fr_0.95fr]">
          {/* Sources column */}
          <div className="hidden border-primary/10 p-4 md:block md:border-e">
            <div className="mb-3 text-xs font-bold text-muted-foreground">{isAr ? "المصادر" : "Sources"}</div>
            <div className="space-y-1.5">
              {sources.map((s, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs",
                    i === 0 ? "bg-primary/10" : "",
                  )}
                >
                  <s.Icon className={cn("h-4 w-4 shrink-0", s.color)} />
                  <span className="truncate font-medium">{s.title[isAr ? "ar" : "en"]}</span>
                  <MoreVertical className="ms-auto h-3 w-3 shrink-0 text-muted-foreground/60" />
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2 border-t border-primary/10 pt-3 text-muted-foreground/70">
              {[Globe, FileText, StickyNote].map((Ic, i) => (
                <Ic key={i} className="h-3.5 w-3.5" />
              ))}
            </div>
            <div className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-primary/15 px-3 py-2 text-xs font-semibold text-primary">
              <Plus className="h-3.5 w-3.5" />
              {isAr ? "إضافة مصدر" : "Add Source"}
            </div>
          </div>

          {/* Chat column */}
          <div className="relative border-primary/10 p-4 md:border-e sm:p-6">
            <div className="mb-4 text-xs font-bold text-muted-foreground">{isAr ? "المحادثة" : "Chat"}</div>

            <div className="space-y-3">
              <div className="flex items-start gap-2.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
                  <Sparkles className="h-3 w-3 text-primary-foreground" />
                </span>
                <div className="rounded-xl rounded-ss-sm bg-muted/20 px-3 py-2 text-xs leading-relaxed text-foreground/80 backdrop-blur-sm">
                  {isAr
                    ? "تم تحليل مصادرك بنجاح. جاهز أساعدك تستخرج أهم الأفكار وتربطها ببعض."
                    : "Your sources are analyzed and ready. I can help you pull out the key ideas and connect them."}
                </div>
              </div>
            </div>

            {/* Centered teaser */}
            <div className="relative flex flex-col items-center justify-center gap-3 py-10 text-center sm:py-14">
              <span className="bg-gradient-to-b from-accent via-accent to-accent/40 bg-clip-text text-4xl font-black leading-none text-transparent drop-shadow-[0_0_25px_hsl(var(--accent)/0.45)] sm:text-6xl">
                {isAr ? "قريبًا" : "Soon"}
              </span>
              <p className="max-w-xs text-sm font-semibold text-foreground/90 sm:text-base">
                {isAr ? "تجربة تعليمية جديدة كليًا في الطريق" : "A whole new learning experience is on its way"}
              </p>
            </div>

            <div className="mb-3 flex flex-wrap gap-2">
              {(isAr
                ? ["الملخصات", "المفاهيم الرئيسية", "الأسئلة المقترحة"]
                : ["Summaries", "Key Concepts", "Suggested Questions"]
              ).map((chip, i) => (
                <span
                  key={i}
                  className={cn(
                    "rounded-full border px-3 py-1 text-[11px] font-medium",
                    i === 0 ? "border-primary/40 bg-primary/10 text-primary" : "border-primary/10 text-muted-foreground",
                  )}
                >
                  {chip}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-primary/15 bg-background/35 px-3 py-2.5 backdrop-blur-sm">
              <span className="flex-1 text-xs text-muted-foreground">
                {isAr ? "اكتب رسالة..." : "Send a message..."}
              </span>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/90">
                <Send className="h-3.5 w-3.5 text-primary-foreground" />
              </span>
            </div>
          </div>

          {/* Analysis column */}
          <div className="hidden p-4 lg:block">
            <div className="mb-3 text-xs font-bold text-muted-foreground">{isAr ? "التحليل" : "Analysis"}</div>
            <div className="space-y-2.5">
              {analysisPanels(isAr).map((panel, i) => (
                <div key={i} className="rounded-lg border border-primary/10 bg-background/20 p-3 backdrop-blur-sm">
                  <div className="flex items-center justify-between text-xs font-bold">
                    {panel.title}
                    <ChevronDown className="h-3.5 w-3.5 rotate-180 text-muted-foreground" />
                  </div>
                  <div className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                    {panel.content}
                    {panel.bullets && (
                      <ul className="mt-1 list-inside list-disc space-y-0.5">
                        {panel.bullets.map((b, bi) => (
                          <li key={bi}>{b}</li>
                        ))}
                      </ul>
                    )}
                    {panel.numbered && (
                      <ol className="mt-1 list-inside list-decimal space-y-0.5">
                        {panel.numbered.map((q, qi) => (
                          <li key={qi}>{q}</li>
                        ))}
                      </ol>
                    )}
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-2 rounded-lg border border-primary/10 bg-background/20 px-3 py-2 text-[11px] text-muted-foreground backdrop-blur-sm">
                <Search className="h-3.5 w-3.5" />
                {isAr ? "بحث بالتحليل" : "Search analysis"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
