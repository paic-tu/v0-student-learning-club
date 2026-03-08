"use server"

import { auth } from "@/lib/auth"
import { getUserOrders } from "@/lib/db/queries"

export async function getUserOrdersAction() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return []
    }
    return await getUserOrders(session.user.id)
  } catch (error) {
    console.error("Error fetching user orders:", error)
    return []
  }
}
