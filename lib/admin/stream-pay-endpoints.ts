export type StreamPayEndpoint = {
  title: string
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE"
  path: string
  defaultBody?: any
}

export function getStreamPayEndpoint(group: string, action: string): StreamPayEndpoint | null {
  const key = `${group}/${action}`
  const map: Record<string, StreamPayEndpoint> = {
    "payment-links/create": {
      title: "Create Payment Link",
      method: "POST",
      path: "/payment_links",
      defaultBody: {
        name: "Test Payment Link",
        currency: "SAR",
        items: [{ product_id: "<product_uuid>", quantity: 1 }],
        max_number_of_payments: 1,
        success_redirect_url: "https://example.com/success",
        failure_redirect_url: "https://example.com/failure",
        custom_metadata: {},
        contact_information_type: "PHONE",
      },
    },
    "payment-links/get": { title: "Get Payment Link", method: "GET", path: "/payment_links/{id}" },
    "payment-links/list": { title: "List Payment Links", method: "GET", path: "/payment_links" },
    "payment-links/update-status": { title: "Update Payment Link Status", method: "PATCH", path: "/payment_links/{id}/status" },

    "consumers/create": { title: "Create Consumer", method: "POST", path: "/consumers", defaultBody: { name: "Test Consumer", phone_number: "+9665XXXXXXXX", email: null } },
    "consumers/delete": { title: "Delete Consumer", method: "DELETE", path: "/consumers/{id}" },
    "consumers/list": { title: "Get All Consumers", method: "GET", path: "/consumers" },
    "consumers/get": { title: "Get Consumer", method: "GET", path: "/consumers/{id}" },
    "consumers/update": { title: "Update Consumer", method: "PATCH", path: "/consumers/{id}", defaultBody: { name: "Updated Consumer" } },

    "coupons/create": { title: "Create Coupon", method: "POST", path: "/coupons", defaultBody: { code: "TEST10", type: "PERCENTAGE", value: 10 } },
    "coupons/delete": { title: "Delete Coupon", method: "DELETE", path: "/coupons/{id}" },
    "coupons/get": { title: "Get Coupon", method: "GET", path: "/coupons/{id}" },
    "coupons/list": { title: "List Coupons", method: "GET", path: "/coupons" },
    "coupons/update": { title: "Update Coupon", method: "PATCH", path: "/coupons/{id}", defaultBody: { active: false } },

    "invoices/create": { title: "Create Invoice", method: "POST", path: "/invoices", defaultBody: { consumer_id: "<consumer_uuid>", currency: "SAR", items: [{ product_id: "<product_uuid>", quantity: 1 }] } },
    "invoices/get": { title: "Get Invoice", method: "GET", path: "/invoices/{id}" },
    "invoices/list": { title: "List Invoices", method: "GET", path: "/invoices" },
    "invoices/update": { title: "Update Invoice In Place", method: "PATCH", path: "/invoices/{id}", defaultBody: { metadata: {} } },

    "payments/auto-charge": { title: "Auto Charge On Demand", method: "POST", path: "/payments/auto_charge", defaultBody: { invoice_id: "<invoice_uuid>" } },
    "payments/get": { title: "Get Payment", method: "GET", path: "/payments/{id}" },
    "payments/list": { title: "List Payments", method: "GET", path: "/payments" },
    "payments/mark-paid": { title: "Mark Payment As Paid", method: "POST", path: "/payments/{id}/mark_as_paid", defaultBody: {} },
    "payments/refund": { title: "Refund Payment", method: "POST", path: "/payments/{id}/refund", defaultBody: { amount: null } },

    "products/create": { title: "Create Product", method: "POST", path: "/products", defaultBody: { name: "Test Product", type: "ONE_OFF", currency: "SAR", price: "10.00" } },
    "products/delete": { title: "Delete Product", method: "DELETE", path: "/products/{id}" },
    "products/get": { title: "Get Product", method: "GET", path: "/products/{id}" },
    "products/list": { title: "List Products", method: "GET", path: "/products" },
    "products/update": { title: "Update Product", method: "PATCH", path: "/products/{id}", defaultBody: { active: false } },
  }

  return map[key] || null
}
