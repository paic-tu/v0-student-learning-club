export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="h-10 bg-muted rounded w-1/2 mb-8 animate-pulse"></div>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border rounded-lg p-6 animate-pulse">
                <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-5/6"></div>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-6">
            <div className="border rounded-lg p-6 animate-pulse">
              <div className="h-6 bg-muted rounded w-1/2 mb-4"></div>
              <div className="space-y-4">
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-4/5"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
