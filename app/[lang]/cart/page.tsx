import { getCartAction } from "@/lib/actions"
import { CartClient } from "@/components/cart-client"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function CartPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const session = await auth()
  
  if (!session?.user) {
    redirect(`/${lang}/auth/login`)
  }

  const { cart } = await getCartAction()

  return <CartClient initialCart={cart || null} />
}
