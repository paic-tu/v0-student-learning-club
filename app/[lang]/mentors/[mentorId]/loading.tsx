export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="h-24 w-24 bg-muted rounded-full mb-4 animate-pulse"></div>
        <div className="h-10 bg-muted rounded w-1/3 mb-8 animate-pulse"></div>
      </div>
    </div>
  )
}
