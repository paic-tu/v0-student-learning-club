export default function CategoryPage({ params }: { params: { lang: string; categoryId: string } }) {
  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold mb-6">Category: {params.categoryId}</h1>
      <p>Courses in this category will be listed here.</p>
    </div>
  )
}
