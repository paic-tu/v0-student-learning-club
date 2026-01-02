"use server"

import { neon } from "@neondatabase/serverless"
import { cookies } from "next/headers"

const sql = neon(process.env.DATABASE_URL!)

// Cart stored in cookies for simplicity (can be moved to database if needed)
type CartItem = {
  itemId: number
  quantity: number
}

export async function getCart(): Promise<CartItem[]> {
  const cookieStore = await cookies()
  const cartCookie = cookieStore.get("cart")?.value

  if (!cartCookie) {
    return []
  }

  try {
    return JSON.parse(cartCookie)
  } catch {
    return []
  }
}

export async function addToCart(itemId: number, quantity = 1) {
  const cart = await getCart()
  const existingItem = cart.find((item) => item.itemId === itemId)

  if (existingItem) {
    existingItem.quantity += quantity
  } else {
    cart.push({ itemId, quantity })
  }

  const cookieStore = await cookies()
  cookieStore.set("cart", JSON.stringify(cart), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  })

  return cart
}

export async function removeFromCart(itemId: number) {
  const cart = await getCart()
  const filtered = cart.filter((item) => item.itemId !== itemId)

  const cookieStore = await cookies()
  cookieStore.set("cart", JSON.stringify(filtered), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  })

  return filtered
}

export async function updateCartQuantity(itemId: number, quantity: number) {
  const cart = await getCart()
  const item = cart.find((i) => i.itemId === itemId)

  if (item) {
    item.quantity = quantity
  }

  const cookieStore = await cookies()
  cookieStore.set("cart", JSON.stringify(cart), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  })

  return cart
}

export async function clearCart() {
  const cookieStore = await cookies()
  cookieStore.delete("cart")
}

export async function getCartWithItems() {
  const cart = await getCart()

  if (cart.length === 0) {
    return []
  }

  const itemIds = cart.map((item) => item.itemId)

  try {
    const items = await sql`
      SELECT * FROM store_items
      WHERE id = ANY(${itemIds})
      AND is_active = true
    `

    return cart
      .map((cartItem) => {
        const item = items.find((i: any) => i.id === cartItem.itemId)
        return item ? { ...item, quantity: cartItem.quantity } : null
      })
      .filter(Boolean)
  } catch (error) {
    console.error("[v0] Error fetching cart items:", error)
    return []
  }
}
