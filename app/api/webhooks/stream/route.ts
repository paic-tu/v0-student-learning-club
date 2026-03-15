import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { cartItems, carts, enrollments, orderItems, orders } from "@/lib/db/schema"
import { and, eq, isNotNull } from "drizzle-orm"
import { streamRequest, verifyStreamWebhookSignature } from "@/lib/payments/stream"

export async function POST(req: Request) {
  const secret = process.env.STREAM_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ error: "STREAM_WEBHOOK_SECRET is not set" }, { status: 500 })
  }

  const signatureHeader = req.headers.get("x-webhook-signature")
  const rawBody = await req.text()

  const ok = verifyStreamWebhookSignature({
    secret,
    rawBody,
    signatureHeader,
  })

  if (!ok) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  let payload: any
  try {
    payload = rawBody ? JSON.parse(rawBody) : null
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const eventType = String(payload?.event_type || "")
  const allowed = new Set([
    "PAYMENT_SUCCEEDED",
    "PAYMENT_FAILED",
    "PAYMENT_CANCELED",
    "PAYMENT_REFUNDED",
    "PAYMENT_MARKED_AS_PAID",
    "INVOICE_CREATED",
    "INVOICE_SENT",
    "INVOICE_ACCEPTED",
    "INVOICE_REJECTED",
    "INVOICE_COMPLETED",
    "INVOICE_CANCELED",
    "INVOICE_UPDATED",
    "SUBSCRIPTION_CREATED",
    "SUBSCRIPTION_ACTIVATED",
    "SUBSCRIPTION_INACTIVATED",
    "SUBSCRIPTION_CANCELED",
    "SUBSCRIPTION_FROZEN",
    "SUBSCRIPTION_CYCLE_RENEWAL_FAILED",
    "SUBSCRIPTION_CANCEL_AT_PERIOD_END",
    "SUBSCRIPTION_FREEZE_NOW",
    "SUBSCRIPTION_UNFREEZE_NOW",
    "SUBSCRIPTION_UNFREEZE_FUTURE",
    "SUBSCRIPTION_FREEZE_CANCEL",
    "PAYMENT_LINK_PAY_ATTEMPT_FAILED",
  ])
  if (!allowed.has(eventType)) {
    return NextResponse.json({ success: true })
  }
  const data = payload?.data || {}
  const metadata = (data?.metadata || data?.custom_metadata || {}) as any

  const orderIdFromMetadata = metadata?.order_id ? String(metadata.order_id) : null
  const paymentLinkId = data?.payment_link?.id ? String(data.payment_link.id) : (payload?.payment_link_id ? String(payload.payment_link_id) : null)
  const invoiceId =
    data?.invoice?.id
      ? String(data.invoice.id)
      : payload?.invoice_id
        ? String(payload.invoice_id)
        : payload?.entity_type === "INVOICE" && payload?.entity_id
          ? String(payload.entity_id)
          : null
  const paymentId = data?.payment?.id ? String(data.payment.id) : (payload?.payment_id ? String(payload.payment_id) : null)

  let order = null as any
  if (orderIdFromMetadata) {
    order = await db.query.orders.findFirst({ where: eq(orders.id, orderIdFromMetadata) })
  }

  if (!order && paymentLinkId) {
    order = await db.query.orders.findFirst({ where: eq(orders.paymentLinkId, paymentLinkId) })
  }

  if (!order) {
    return NextResponse.json({ success: true })
  }

  await db
    .update(orders)
    .set({
      invoiceId: invoiceId || order.invoiceId,
      paymentId: paymentId || order.paymentId,
      gatewayStatus: eventType || order.gatewayStatus,
      gatewayPayload: payload,
      lastWebhookAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(orders.id, order.id))

  if (order.status !== "paid") {
    const shouldCancel =
      eventType === "PAYMENT_CANCELED" || eventType === "INVOICE_CANCELED" || eventType === "PAYMENT_LINK_PAY_ATTEMPT_FAILED"
    if (shouldCancel) {
      await db
        .update(orders)
        .set({
          status: "cancelled",
          updatedAt: new Date(),
        })
        .where(eq(orders.id, order.id))
      return NextResponse.json({ success: true })
    }
  }

  const shouldTryFulfill = eventType === "INVOICE_COMPLETED" || eventType === "PAYMENT_SUCCEEDED" || eventType === "PAYMENT_MARKED_AS_PAID"

  if (!shouldTryFulfill) {
    return NextResponse.json({ success: true })
  }

  if (order.status === "paid") {
    return NextResponse.json({ success: true })
  }

  if (eventType === "PAYMENT_SUCCEEDED" || eventType === "PAYMENT_MARKED_AS_PAID") {
    await db
      .update(orders)
      .set({
        status: "paid",
        paidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, order.id))

    const items = await db.query.orderItems.findMany({
      where: and(eq(orderItems.orderId, order.id), isNotNull(orderItems.courseId)),
      columns: { courseId: true },
    })

    for (const it of items) {
      if (!it.courseId) continue
      const existing = await db.query.enrollments.findFirst({
        where: and(eq(enrollments.userId, order.userId), eq(enrollments.courseId, it.courseId)),
        columns: { id: true },
      })
      if (!existing) {
        await db.insert(enrollments).values({
          userId: order.userId,
          courseId: it.courseId,
          status: "active",
        })
      }
    }

    const cart = await db.query.carts.findFirst({
      where: eq(carts.userId, order.userId),
      columns: { id: true },
    })
    if (cart?.id) {
      await db.delete(cartItems).where(eq(cartItems.cartId, cart.id))
    }

    return NextResponse.json({ success: true })
  }

  if (!invoiceId) {
    return NextResponse.json({ success: true })
  }

  let invoice: any = null
  try {
    invoice = await streamRequest<any>(`/invoices/${invoiceId}`, { method: "GET" })
  } catch {
    invoice = null
  }

  const invoiceStatus = String(invoice?.status || invoice?.data?.status || "")
  const isInvoiceCompleted =
    invoiceStatus.toUpperCase() === "COMPLETED" || invoiceStatus.toUpperCase() === "PAID" || eventType === "INVOICE_COMPLETED"

  if (!isInvoiceCompleted) {
    return NextResponse.json({ success: true })
  }

  await db
    .update(orders)
    .set({
      status: "paid",
      paidAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(orders.id, order.id))

  const items = await db.query.orderItems.findMany({
    where: and(eq(orderItems.orderId, order.id), isNotNull(orderItems.courseId)),
    columns: { courseId: true },
  })

  for (const it of items) {
    if (!it.courseId) continue
    const existing = await db.query.enrollments.findFirst({
      where: and(eq(enrollments.userId, order.userId), eq(enrollments.courseId, it.courseId)),
      columns: { id: true },
    })
    if (!existing) {
      await db.insert(enrollments).values({
        userId: order.userId,
        courseId: it.courseId,
        status: "active",
      })
    }
  }

  return NextResponse.json({ success: true })
}
