import { redirect } from "next/navigation"

export default async function AdminPathRedirect(props: { params: Promise<{ path?: string[] }> }) {
  const { path } = await props.params
  const rest = Array.isArray(path) && path.length > 0 ? `/${path.map(encodeURIComponent).join("/")}` : ""
  redirect(`/ar/admin${rest}`)
}

