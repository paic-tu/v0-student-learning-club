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
import { and, desc, eq, isNotNull } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { createStreamConsumer, createStreamPaymentLink, findStreamConsumerByEmail, findStreamConsumerByPhone, getAppBaseUrl, normalizeSaudiPhone, streamRequest } from "@/lib/payments/stream"

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
    revalidatePath("/ar/cart")
    revalidatePath("/en/cart")
    return { success: true }
  } catch (error) {
    console.error("[Action] removeFromCartAction error:", error)
    return { error: "Failed to remove from cart" }
  }
}

export async function updateCartItemQuantityAction(cartItemId: string, quantity: number) {
  console.log("[Action] updateCartItemQuantityAction started", { cartItemId, quantity })
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { error: "Unauthorized" }
    }
    const userId = session.user.id

    const q = Number(quantity)
    if (!Number.isFinite(q) || q < 1 || q > 99) {
      return { error: "Invalid quantity" }
    }

    const item = await db.query.cartItems.findFirst({
      where: eq(cartItems.id, cartItemId),
      columns: { id: true, cartId: true },
    })
    if (!item) return { error: "Cart item not found" }

    const cart = await db.query.carts.findFirst({
      where: and(eq(carts.id, item.cartId), eq(carts.userId, userId)),
      columns: { id: true },
    })
    if (!cart) return { error: "Unauthorized" }

    await db.update(cartItems).set({ quantity: q }).where(eq(cartItems.id, item.id))

    revalidatePath("/cart")
    revalidatePath("/ar/cart")
    revalidatePath("/en/cart")
    return { success: true }
  } catch (error) {
    console.error("[Action] updateCartItemQuantityAction error:", error)
    return { error: "Failed to update quantity" }
  }
}

export async function validateCouponAction(code: string) {
  console.log("[Action] validateCouponAction started")
  try {
    const session = await auth()
    if (!session?.user?.id) return { error: "Unauthorized" }

    const shouldUseStream = Boolean(process.env.STREAM_API_KEY_BASE64 || (process.env.STREAM_API_KEY && process.env.STREAM_API_SECRET))
    if (!shouldUseStream) return { error: "Stream is not configured" }

    const raw = String(code || "").trim()
    if (!raw) return { error: "Invalid coupon" }

    const res = await streamRequest<any>(`/coupons?search_term=${encodeURIComponent(raw)}&active=true&limit=10`, { method: "GET" })
    const list: any[] = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []
    const found =
      list.find((c) => String(c?.name || "").trim().toLowerCase() === raw.toLowerCase()) ||
      list.find((c) => String(c?.name || "").trim().toLowerCase().includes(raw.toLowerCase())) ||
      null

    if (!found?.id) return { error: "Coupon not found" }
    if (found?.is_active === false) return { error: "Coupon is inactive" }

    const discountValue = Number.parseFloat(String(found?.discount_value))
    const isPercentage = Boolean(found?.is_percentage)
    if (!Number.isFinite(discountValue) || discountValue <= 0) return { error: "Invalid coupon" }

    return {
      success: true,
      coupon: {
        id: String(found.id),
        name: String(found.name || raw),
        isPercentage,
        discountValue,
        currency: String(found?.currency || "SAR"),
      },
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to validate coupon" }
  }
}

export async function checkoutAction(shippingAddress?: string, notes?: string, lang: string = "ar", couponIds?: string[] | null) {
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
            const qty = item.quantity || 1
            if (item.course) {
                price = parseFloat(item.course.price || "0")
                validItems.push({ type: 'course', id: item.course.id, price, title: item.course.titleEn, quantity: qty })
            } else if (item.product) {
                price = parseFloat(item.product.price || "0")
                validItems.push({ type: 'product', id: item.product.id, price, title: item.product.nameEn, quantity: qty })
            }
            total += price * qty
        }

        const shouldUseStream = Boolean(process.env.STREAM_API_KEY_BASE64 || (process.env.STREAM_API_KEY && process.env.STREAM_API_SECRET))

        if (!shouldUseStream) {
            const allowManual = process.env.ALLOW_MANUAL_CHECKOUT === "true"
            if (!allowManual) {
              return { error: "Payment is not configured (Stream keys missing)" }
            }

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
                    quantity: item.quantity || 1
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

        const existingOrder = await db.query.orders.findFirst({
          where: and(eq(orders.userId, userId), eq(orders.status, "pending"), eq(orders.paymentProvider, "stream"), isNotNull(orders.paymentLinkUrl)),
          orderBy: [desc(orders.createdAt)],
          with: { items: { columns: { courseId: true, productId: true, quantity: true } } },
          columns: { id: true, paymentLinkUrl: true },
        })

        if (existingOrder?.paymentLinkUrl && Array.isArray(existingOrder.items) && existingOrder.items.length > 0) {
          const cartKey = cart.items
            .map((it) => `${it.courseId || it.productId}:${it.quantity || 1}`)
            .slice()
            .sort()
            .join("|")
          const orderKey = existingOrder.items
            .map((it) => `${it.courseId || it.productId}:${it.quantity || 1}`)
            .slice()
            .sort()
            .join("|")
          if (cartKey && cartKey === orderKey) {
            return { success: true, orderId: existingOrder.id, checkoutUrl: existingOrder.paymentLinkUrl }
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
                quantity: item.quantity || 1
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
                couponIds: Array.isArray(couponIds) && couponIds.length > 0 ? couponIds : undefined,
                customMetadata: {
                    order_id: order.id,
                    user_id: userId,
                    source: "neon_store",
                    user_name: user.name,
                    user_email: email || null,
                    user_phone: phoneE164 || null,
                    preferred_language: preferredLanguage || null,
                    coupon_ids: Array.isArray(couponIds) && couponIds.length > 0 ? couponIds : null,
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

        revalidatePath("/cart")
        revalidatePath("/ar/cart")
        revalidatePath("/en/cart")
        return { success: true, orderId: order.id, checkoutUrl: paymentLink.url }
    } catch (error) {
        console.error("[Action] checkoutAction error:", error)
        return { error: "Checkout failed" }
    }
}
