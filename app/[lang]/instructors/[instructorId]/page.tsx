export default function InstructorProfilePage({ params }: { params: { lang: string; instructorId: string } }) {
  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold mb-6">Instructor Profile</h1>
      <p>Instructor ID: {params.instructorId}</p>
    </div>
  )
}
