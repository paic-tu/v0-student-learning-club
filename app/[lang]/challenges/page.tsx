import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Hammer } from "lucide-react"

export default async function ChallengesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  
  const isAr = lang === "ar"

  return (
    <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="bg-muted/30 p-8 rounded-full mb-6">
        <Hammer className="w-16 h-16 text-primary" />
      </div>
      
      <h1 className="text-4xl font-bold mb-4">
        {isAr ? "قريباً" : "Coming Soon"}
      </h1>
      
      <p className="text-xl text-muted-foreground max-w-md mb-8">
        {isAr 
          ? "نحن نعمل بجد لإطلاق منصة التحديات والاختبارات. ترقبوا شيئاً مميزاً!" 
          : "We are working hard to launch our Challenges & Quizzes platform. Stay tuned for something special!"}
      </p>
      
      <div className="flex gap-4">
        <Button asChild>
          <Link href={`/${lang}`}>
            {isAr ? "العودة للرئيسية" : "Back to Home"}
          </Link>
        </Button>
      </div>
    </div>
  )
}
