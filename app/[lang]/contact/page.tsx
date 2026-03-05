export default async function ContactPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold mb-6">Contact Us</h1>
      <p>Get in touch with our support team.</p>
    </div>
  )
}
