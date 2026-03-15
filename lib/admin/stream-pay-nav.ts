export type StreamPayNavGroupId =
  | "payment-links"
  | "consumers"
  | "coupons"
  | "invoices"
  | "payments"
  | "products"

export type StreamPayNavItemId =
  | "checkout-payment-links"
  | "create-payment-link"
  | "get-payment-link"
  | "list-payment-links"
  | "update-payment-link-status"
  | "create-consumer"
  | "delete-consumer"
  | "get-all-consumers"
  | "get-consumer"
  | "update-consumer"
  | "create-coupon"
  | "delete-coupon"
  | "get-coupon"
  | "list-coupons"
  | "update-coupon"
  | "create-invoice"
  | "get-invoice"
  | "list-invoices"
  | "update-invoice-in-place"
  | "auto-charge-on-demand"
  | "get-payment"
  | "list-payments"
  | "mark-payment-as-paid"
  | "refund-payment"
  | "create-product"
  | "delete-product"
  | "get-product"
  | "list-products"
  | "update-product"

export type StreamPayNavItem = {
  id: StreamPayNavItemId
  labelAr: string
  labelEn: string
  href: string
}

export type StreamPayNavGroup = {
  id: StreamPayNavGroupId
  titleAr: string
  titleEn: string
  items: StreamPayNavItem[]
}

export const streamPayNavGroups: StreamPayNavGroup[] = [
  {
    id: "payment-links",
    titleAr: "Checkout/Payment Links",
    titleEn: "Checkout/Payment Links",
    items: [
      { id: "create-payment-link", labelAr: "Create Payment Link", labelEn: "Create Payment Link", href: "/admin/stream-pay/payment-links/create" },
      { id: "get-payment-link", labelAr: "Get Payment Link", labelEn: "Get Payment Link", href: "/admin/stream-pay/payment-links/get" },
      { id: "list-payment-links", labelAr: "List Payment Links", labelEn: "List Payment Links", href: "/admin/stream-pay/payment-links/list" },
      { id: "update-payment-link-status", labelAr: "Update Payment Link Status", labelEn: "Update Payment Link Status", href: "/admin/stream-pay/payment-links/update-status" },
    ],
  },
  {
    id: "consumers",
    titleAr: "Consumers",
    titleEn: "Consumers",
    items: [
      { id: "create-consumer", labelAr: "Create Consumer", labelEn: "Create Consumer", href: "/admin/stream-pay/consumers/create" },
      { id: "delete-consumer", labelAr: "Delete Consumer", labelEn: "Delete Consumer", href: "/admin/stream-pay/consumers/delete" },
      { id: "get-all-consumers", labelAr: "Get All Consumers", labelEn: "Get All Consumers", href: "/admin/stream-pay/consumers/list" },
      { id: "get-consumer", labelAr: "Get Consumer", labelEn: "Get Consumer", href: "/admin/stream-pay/consumers/get" },
      { id: "update-consumer", labelAr: "Update Consumer", labelEn: "Update Consumer", href: "/admin/stream-pay/consumers/update" },
    ],
  },
  {
    id: "coupons",
    titleAr: "Coupons",
    titleEn: "Coupons",
    items: [
      { id: "create-coupon", labelAr: "Create Coupon", labelEn: "Create Coupon", href: "/admin/stream-pay/coupons/create" },
      { id: "delete-coupon", labelAr: "Delete Coupon", labelEn: "Delete Coupon", href: "/admin/stream-pay/coupons/delete" },
      { id: "get-coupon", labelAr: "Get Coupon", labelEn: "Get Coupon", href: "/admin/stream-pay/coupons/get" },
      { id: "list-coupons", labelAr: "List Coupons", labelEn: "List Coupons", href: "/admin/stream-pay/coupons/list" },
      { id: "update-coupon", labelAr: "Update Coupon", labelEn: "Update Coupon", href: "/admin/stream-pay/coupons/update" },
    ],
  },
  {
    id: "invoices",
    titleAr: "Invoices",
    titleEn: "Invoices",
    items: [
      { id: "create-invoice", labelAr: "Create Invoice", labelEn: "Create Invoice", href: "/admin/stream-pay/invoices/create" },
      { id: "get-invoice", labelAr: "Get Invoice", labelEn: "Get Invoice", href: "/admin/stream-pay/invoices/get" },
      { id: "list-invoices", labelAr: "List Invoices", labelEn: "List Invoices", href: "/admin/stream-pay/invoices/list" },
      { id: "update-invoice-in-place", labelAr: "Update Invoice In Place", labelEn: "Update Invoice In Place", href: "/admin/stream-pay/invoices/update" },
    ],
  },
  {
    id: "payments",
    titleAr: "Payments",
    titleEn: "Payments",
    items: [
      { id: "auto-charge-on-demand", labelAr: "Auto Charge On Demand", labelEn: "Auto Charge On Demand", href: "/admin/stream-pay/payments/auto-charge" },
      { id: "get-payment", labelAr: "Get Payment", labelEn: "Get Payment", href: "/admin/stream-pay/payments/get" },
      { id: "list-payments", labelAr: "List Payments", labelEn: "List Payments", href: "/admin/stream-pay/payments/list" },
      { id: "mark-payment-as-paid", labelAr: "Mark Payment As Paid", labelEn: "Mark Payment As Paid", href: "/admin/stream-pay/payments/mark-paid" },
      { id: "refund-payment", labelAr: "Refund Payment", labelEn: "Refund Payment", href: "/admin/stream-pay/payments/refund" },
    ],
  },
  {
    id: "products",
    titleAr: "Products",
    titleEn: "Products",
    items: [
      { id: "create-product", labelAr: "Create Product", labelEn: "Create Product", href: "/admin/stream-pay/products/create" },
      { id: "delete-product", labelAr: "Delete Product", labelEn: "Delete Product", href: "/admin/stream-pay/products/delete" },
      { id: "get-product", labelAr: "Get Product", labelEn: "Get Product", href: "/admin/stream-pay/products/get" },
      { id: "list-products", labelAr: "List Products", labelEn: "List Products", href: "/admin/stream-pay/products/list" },
      { id: "update-product", labelAr: "Update Product", labelEn: "Update Product", href: "/admin/stream-pay/products/update" },
    ],
  },
]
