import { getAllContests } from "@/lib/db/queries"
import { ContestsClient } from "./contests-client"

export const dynamic = 'force-dynamic'

export default async function ContestsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  
  // Fetch contests on the server
  const contests = await getAllContests()
  
  // Transform or cast if necessary, though Drizzle returns camelCase
  // We need to ensure the types match what ContestsClient expects
  // Assuming getAllContests returns objects matching the schema (camelCase)
  
  return <ContestsClient contests={contests} />
}
