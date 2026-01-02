export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="h-8 bg-muted rounded w-1/3 mb-8 animate-pulse"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg p-6 animate-pulse">
              <div className="h-20 bg-muted rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
