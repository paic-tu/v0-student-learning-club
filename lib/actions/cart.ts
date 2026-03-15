"use server"

import { db } from "@/lib/db"
import { 
  carts, 
  cartItems, 
  orders, 
  orderItems, 
  enrollments,
  users
} from "@/lib/db/schema"
import { auth } from "@/lib/auth"
import { eq, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { createStreamConsumer, createStreamPaymentLink, findStreamConsumerByEmail, findStreamConsumerByPhone, getAppBaseUrl, normalizeSaudiPhone } from "@/lib/payments/stream"

export async function getCartAction() {
  console.log("[Action] getCartAction started")
  try {
    const session = await auth()
    if (!session?.user?.id) {
        console.log("[Action] Unauthorized getCart")
        return { error: "Unauthorized" }
    }

    const userId = session.user.id

    // Use a simpler query first to debug
    // Ensure carts table exists and userId is valid
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
      console.log("[Action] Cart not found, creating new one for user:", userId)
      const [newCart] = await db.insert(carts).values({ userId }).returning()
      if (!newCart) {
         throw new Error("Failed to create new cart")
      }
      return { cart: { ...newCart, items: [] } }
    }

    return { cart }
  } catch (error) {
    console.error("[Action] getCartAction error:", error)
    // Don't expose internal errors to client, but log them
    return { error: "Failed to get cart" }
  }
}

export async function getCartCountAction() {
  console.log("[Action] getCartCountAction started")
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { count: 0 }
    }

    const userId = session.user.id

    const cart = await db.query.carts.findFirst({
      where: eq(carts.userId, userId),
      columns: { id: true },
      with: {
        items: { columns: { id: true } },
      },
    })

    return { count: cart?.items?.length ?? 0 }
  } catch (error) {
    console.error("[Action] getCartCountAction error:", error)
    return { count: 0 }
  }
}

export async function addToCartAction(itemId: string, type: "course" | "product" = "course") {
  console.log("[Action] addToCartAction started", { itemId, type })
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
    const whereClause = type === "course" 
      ? and(eq(cartItems.cartId, cart.id), eq(cartItems.courseId, itemId))
      : and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, itemId))

    const existingItem = await db.query.cartItems.findFirst({
      where: whereClause
    })

    if (existingItem) {
      return { success: true, message: "Already in cart" }
    }

    await db.insert(cartItems).values({
      cartId: cart.id,
      courseId: type === "course" ? itemId : null,
      productId: type === "product" ? itemId : null,
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

export async function checkoutAction(shippingAddress?: string, notes?: string, lang: string = "ar") {
    console.log("[Action] checkoutAction started")
    try {
        const session = await auth()
        if (!session?.user?.id) {
            console.log("[Action] Unauthorized checkout attempt")
            return { error: "Unauthorized" }
        }
        const userId = session.user.id

        const user = await db.query.users.findFirst({
          where: eq(users.id, userId),
          columns: { id: true, name: true, email: true, phoneNumber: true, phone: true, preferences: true, streamConsumerId: true },
        })
        if (!user) return { error: "User not found" }

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

        const shouldUseStream = Boolean(process.env.STREAM_API_KEY_BASE64 || (process.env.STREAM_API_KEY && process.env.STREAM_API_SECRET))

        if (!shouldUseStream) {
            const [order] = await db.insert(orders).values({
                userId,
                status: "paid",
                totalAmount: total.toString(),
                shippingAddress: shippingAddress || null,
                notes: notes || null,
                paymentProvider: "manual",
                paidAt: new Date(),
            }).returning()

            for (const item of validItems) {
                await db.insert(orderItems).values({
                    orderId: order.id,
                    courseId: item.type === 'course' ? item.id : null,
                    productId: item.type === 'product' ? item.id : null,
                    price: item.price.toString(),
                    quantity: 1
                })

                if (item.type === 'course') {
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

            await db.delete(cartItems).where(eq(cartItems.cartId, cart.id))

            revalidatePath("/cart")
            revalidatePath("/student/dashboard")
            revalidatePath("/ar/student/dashboard")
            revalidatePath("/en/student/dashboard")
            revalidatePath("/ar/student/my-courses")
            revalidatePath("/en/student/my-courses")
            return { success: true, orderId: order.id }
        }

        const itemsForStream: Array<{ productId: string; quantity: number }> = []
        for (const ci of cart.items) {
            if (ci.course) {
                const pid = (ci.course as any).streamProductId as string | null | undefined
                if (!pid) return { error: `Stream product_id is missing for course: ${ci.course.titleEn}` }
                itemsForStream.push({ productId: pid, quantity: ci.quantity || 1 })
            } else if (ci.product) {
                const pid = (ci.product as any).streamProductId as string | null | undefined
                if (!pid) return { error: `Stream product_id is missing for product: ${ci.product.nameEn}` }
                itemsForStream.push({ productId: pid, quantity: ci.quantity || 1 })
            }
        }

        let streamConsumerId = user.streamConsumerId as string | null | undefined
        const phoneRaw = user.phoneNumber || user.phone || ""
        const phoneE164 = phoneRaw ? normalizeSaudiPhone(phoneRaw) : ""
        const email = (user.email || "").trim().toLowerCase()
        const preferredLanguage = typeof user.preferences?.preferred_language === "string" ? user.preferences.preferred_language : lang

        if (!streamConsumerId) {
          try {
            const consumer = await createStreamConsumer({
              name: user.name,
              phone_number: phoneE164 || undefined,
              email: email || undefined,
              external_id: `neon_user_${user.id}`,
              communication_methods: phoneE164 ? ["WHATSAPP"] : ["EMAIL"],
              preferred_language: preferredLanguage || undefined,
              alias: user.name,
              comment: "Created via Store Checkout",
            })
            streamConsumerId = consumer.id
          } catch (e) {
            const msg = e instanceof Error ? e.message : "Failed"
            const isDuplicate = msg.includes("DUPLICATE_CONSUMER") || msg.includes("Consumer already exist") || msg.includes("PHONE_ALREADY_REGISTERED")
            if (isDuplicate) {
              const existing = phoneE164 ? await findStreamConsumerByPhone(phoneE164) : email ? await findStreamConsumerByEmail(email) : null
              if (existing?.id) {
                streamConsumerId = String(existing.id)
              } else {
                throw e
              }
            } else {
              throw e
            }
          }

          if (streamConsumerId) {
            await db.update(users).set({ streamConsumerId, updatedAt: new Date() }).where(eq(users.id, user.id))
          }
        }

        const [order] = await db
            .insert(orders)
            .values({
                userId,
                status: "pending",
                totalAmount: total.toString(),
                shippingAddress: shippingAddress || null,
                notes: notes || null,
                paymentProvider: "stream",
                gatewayStatus: "CREATED",
            })
            .returning()

        for (const item of validItems) {
            await db.insert(orderItems).values({
                orderId: order.id,
                courseId: item.type === 'course' ? item.id : null,
                productId: item.type === 'product' ? item.id : null,
                price: item.price.toString(),
                quantity: 1
            })
        }
        const baseUrl = getAppBaseUrl()
        const successRedirectUrl = `${baseUrl}/${lang}/checkout/stream/success?order_id=${order.id}`
        const failureRedirectUrl = `${baseUrl}/${lang}/checkout/stream/failure?order_id=${order.id}`

        let paymentLink: any
        try {
            paymentLink = await createStreamPaymentLink({
                name: `Neon Order ${order.id}`,
                currency: "SAR",
                maxNumberOfPayments: 1,
                organizationConsumerId: streamConsumerId || undefined,
                contactInformationType: phoneE164 ? "PHONE" : "EMAIL",
                successRedirectUrl,
                failureRedirectUrl,
                items: itemsForStream,
                customMetadata: {
                    order_id: order.id,
                    user_id: userId,
                    source: "neon_store",
                    user_name: user.name,
                    user_email: email || null,
                    user_phone: phoneE164 || null,
                    preferred_language: preferredLanguage || null,
                },
            })
        } catch (e) {
            await db.delete(orderItems).where(eq(orderItems.orderId, order.id))
            await db.delete(orders).where(eq(orders.id, order.id))
            return { error: e instanceof Error ? e.message : "Failed to create payment link" }
        }

        await db.update(orders).set({
            paymentLinkId: paymentLink.id,
            paymentLinkUrl: paymentLink.url,
            gatewayStatus: paymentLink.status || "ACTIVE",
            branchId: process.env.STREAM_BRANCH_ID || null,
            gatewayPayload: paymentLink as any,
            updatedAt: new Date(),
        }).where(eq(orders.id, order.id))

        await db.delete(cartItems).where(eq(cartItems.cartId, cart.id))

        revalidatePath("/cart")
        return { success: true, orderId: order.id, checkoutUrl: paymentLink.url }
    } catch (error) {
        console.error("[Action] checkoutAction error:", error)
        return { error: "Checkout failed" }
    }
}
