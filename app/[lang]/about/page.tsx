export default async function AboutPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold mb-6">About Us</h1>
      <p>Learn more about our mission and vision.</p>
    </div>
  )
}
