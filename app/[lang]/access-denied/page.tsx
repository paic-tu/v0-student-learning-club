import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ShieldAlert } from "lucide-react"

export default function AccessDeniedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center">
      <div className="bg-destructive/10 p-6 rounded-full mb-6">
        <ShieldAlert className="w-16 h-16 text-destructive" />
      </div>
      <h1 className="text-4xl font-bold mb-2 tracking-tight">Access Denied</h1>
      <p className="text-muted-foreground mb-8 max-w-md">
        You do not have permission to access this page. Please return to your dashboard or contact support if you believe this is an error.
      </p>
      <div className="flex gap-4">
        <Button asChild variant="default">
          <Link href="/">Return Home</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/auth/login">Login / Switch Account</Link>
        </Button>
      </div>
    </div>
  )
}
