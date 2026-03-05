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

  try {
    const { cart, error } = await getCartAction()

    if (error) {
      console.error("Error fetching cart:", error)
      // Return empty cart state or error UI instead of crashing
      return <CartClient initialCart={null} />
    }

    return <CartClient initialCart={cart || null} />
  } catch (e) {
    console.error("Unexpected error in CartPage:", e)
    return <CartClient initialCart={null} />
  }
}
