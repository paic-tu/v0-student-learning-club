export default async function PricingPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold mb-6">Pricing Plans</h1>
      <p>Choose the plan that fits your needs.</p>
    </div>
  )
}
