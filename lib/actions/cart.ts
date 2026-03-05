"use server"

import { db } from "@/lib/db"
import { 
  carts, 
  cartItems, 
  orders, 
  orderItems, 
  enrollments 
} from "@/lib/db/schema"
import { auth } from "@/lib/auth"
import { eq, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function getCartAction() {
  console.log("[Action] getCartAction started")
  try {
    const session = await auth()
    if (!session?.user?.id) {
        console.log("[Action] Unauthorized getCart")
        return { error: "Unauthorized" }
    }

    const userId = session.user.id

    let cart = await db.query.carts.findFirst({
      where: eq(carts.userId, userId),
      with: {
        items: {
          with: {
            course: true,
            product: true,
          }
        }
      }
    })

    if (!cart) {
      const [newCart] = await db.insert(carts).values({ userId }).returning()
      // Return the new cart structure, ensuring items is an empty array
      return { cart: { ...newCart, items: [] } }
    }

    return { cart }
  } catch (error) {
    console.error("[Action] getCartAction error:", error)
    return { error: "Failed to get cart" }
  }
}

export async function addToCartAction(courseId: string) {
  console.log("[Action] addToCartAction started", { courseId })
  try {
    const session = await auth()
    if (!session?.user?.id) {
        console.log("[Action] Unauthorized addToCart")
        return { error: "Unauthorized" }
    }

    const userId = session.user.id

    // Get or create cart
    let cart = await db.query.carts.findFirst({
      where: eq(carts.userId, userId)
    })

    if (!cart) {
      const [newCart] = await db.insert(carts).values({ userId }).returning()
      cart = newCart
    }

    // Check if item exists
    const existingItem = await db.query.cartItems.findFirst({
      where: and(
        eq(cartItems.cartId, cart.id),
        eq(cartItems.courseId, courseId)
      )
    })

    if (existingItem) {
      return { success: true, message: "Already in cart" }
    }

    await db.insert(cartItems).values({
      cartId: cart.id,
      courseId,
      quantity: 1
    })

    revalidatePath("/cart")
    return { success: true, message: "Added to cart" }
  } catch (error) {
    console.error("[Action] addToCartAction error:", error)
    return { error: "Failed to add to cart" }
  }
}

export async function removeFromCartAction(itemId: string) {
  console.log("[Action] removeFromCartAction started", { itemId })
  try {
    const session = await auth()
    if (!session?.user?.id) {
        console.log("[Action] Unauthorized removeFromCart")
        return { error: "Unauthorized" }
    }

    await db.delete(cartItems).where(eq(cartItems.id, itemId))
    revalidatePath("/cart")
    return { success: true }
  } catch (error) {
    console.error("[Action] removeFromCartAction error:", error)
    return { error: "Failed to remove from cart" }
  }
}

export async function checkoutAction() {
    console.log("[Action] checkoutAction started")
    try {
        const session = await auth()
        if (!session?.user?.id) {
            console.log("[Action] Unauthorized checkout attempt")
            return { error: "Unauthorized" }
        }
        const userId = session.user.id

        // Get cart with items and prices
        const cart = await db.query.carts.findFirst({
            where: eq(carts.userId, userId),
            with: {
                items: {
                    with: {
                        course: true,
                        product: true
                    }
                }
            }
        })

        if (!cart || cart.items.length === 0) {
            console.log("[Action] Checkout failed: Cart is empty")
            return { error: "Cart is empty" }
        }

        // Calculate total
        let total = 0
        const validItems: any[] = []

        for (const item of cart.items) {
            let price = 0
            if (item.course) {
                price = parseFloat(item.course.price || "0")
                validItems.push({ type: 'course', id: item.course.id, price, title: item.course.titleEn })
            } else if (item.product) {
                 price = parseFloat(item.product.price || "0")
                 validItems.push({ type: 'product', id: item.product.id, price, title: item.product.nameEn })
            }
            total += price
        }

        // Create Order
        const [order] = await db.insert(orders).values({
            userId,
            status: "paid", // Auto-pay for now
            totalAmount: total.toString(),
        }).returning()

        // Create Order Items and Enrollments
        for (const item of validItems) {
            await db.insert(orderItems).values({
                orderId: order.id,
                courseId: item.type === 'course' ? item.id : null,
                productId: item.type === 'product' ? item.id : null,
                price: item.price.toString(),
                quantity: 1
            })

            if (item.type === 'course') {
                 // Check enrollment
                 const existing = await db.query.enrollments.findFirst({
                     where: and(
                         eq(enrollments.userId, userId),
                         eq(enrollments.courseId, item.id)
                     )
                 })

                 if (!existing) {
                     await db.insert(enrollments).values({
                         userId,
                         courseId: item.id,
                         status: 'active'
                     })
                 }
            }
        }

        // Clear Cart
        await db.delete(cartItems).where(eq(cartItems.cartId, cart.id))

        revalidatePath("/cart")
        revalidatePath("/library")
        return { success: true, orderId: order.id }
    } catch (error) {
        console.error("[Action] checkoutAction error:", error)
        return { error: "Checkout failed" }
    }
}
