import { getCartAction } from "@/lib/actions"
import { CartClient } from "@/components/cart-client"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { NavBar } from "@/components/nav-bar"
import { SiteFooter } from "@/components/site-footer"

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
      return (
        <div className="min-h-screen flex flex-col">
          <NavBar />
          <main className="flex-1">
            <CartClient initialCart={null} />
          </main>
          <SiteFooter />
        </div>
      )
    }

    return (
      <div className="min-h-screen flex flex-col">
        <NavBar />
        <main className="flex-1">
          <CartClient initialCart={cart || null} />
        </main>
        <SiteFooter />
      </div>
    )
  } catch (e) {
    console.error("Unexpected error in CartPage:", e)
    return (
      <div className="min-h-screen flex flex-col">
        <NavBar />
        <main className="flex-1">
          <CartClient initialCart={null} />
        </main>
        <SiteFooter />
      </div>
    )
  }
}
