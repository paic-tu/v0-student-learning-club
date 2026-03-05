export default async function FAQPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold mb-6">Frequently Asked Questions</h1>
      <p>Find answers to common questions.</p>
    </div>
  )
}
