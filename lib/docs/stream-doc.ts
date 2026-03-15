export const STREAM_DOCS_MD_EN = `# Stream Payment Gateway (Private Docs)

These docs are intended for internal use only.

## Goal (Neon Store)

- Sell paid courses as products in the store.
- Redirect users to Stream secure checkout.
- Confirm payment on the server before granting access.

## Base URL

\`https://stream-app-service.streampay.sa/api/v2\`

## Authentication

All API calls to Stream require authentication using your API Key Pair.

### Getting Your API Keys

- Log in to your Stream dashboard
- Navigate to API Settings
- Click Create Key Pair
- Store your \`api-key\` and \`api-secret\` securely

### HTTP Header

Stream uses HTTP Basic Authentication with Base64 encoding of your API credentials.

\`\`\`bash
echo -n 'api-key:api-secret' | base64
\`\`\`

Use the Base64 token in the \`x-api-key\` header:

\`\`\`bash
curl -X GET https://stream-app-service.streampay.sa/api/v2/user \\
  -H "x-api-key: <YOUR_BASE64_TOKEN>"
\`\`\`

## Stream API Errors

All handled errors return a response body using the StreamBaseResponse envelope:

\`\`\`json
{
  "error": {
    "code": "STREAM_ERROR",
    "message": "Something wrong happened, please contact support.",
    "additional_info": "Optional human-readable details"
  }
}
\`\`\`

### Common error classes and HTTP status codes

- 400 BadRequestError
- 401 UnauthorizedError
- 403 ForbiddenError / PermissionForbiddenError
- 404 NotFoundError
- 410 GoneError
- 422 UnprocessableEntityError / DuplicateValueError

### Stream error codes

- STREAM_ERROR — Something wrong happened, please contact support.
- STREAM_UNKNOWN_ERROR — Unknown exception happened.
- PHONE_ALREADY_REGISTERED — Phone is already registered.
- INVALID_PARAMETERS — Request input is not valid.
- INVOICE_FINALISED — Invoice is finalised and cannot undergo this action.
- PAYMENT_REFUNDED_ALREADY — Duplicate action; payment has already been refunded.
- PAYMENT_REFUNDED_FAILED — Could not refund payment; processor failed.
- DUPLICATE_CONSUMER — Consumer already exists.
- DUPLICATE_PAYMENT — A payment with the given information already exists.
- PERMISSION_FORBIDDEN — Permission forbidden.
- PRODUCT_USED_IN_FINALIZED_INVOICE — Product cannot be updated; used by a finalized invoice.
- COUPON_USED_IN_FINALIZED_INVOICE — Coupon cannot be updated; used by a finalized invoice.

## Branches in the API

API requests are scoped to a single branch.

Use \`x-branch-id\` to choose the target branch:

\`\`\`bash
curl -X GET https://stream-app-service.streampay.sa/api/v2/user \\
  -H "x-api-key: <YOUR_BASE64_TOKEN>" \\
  -H "x-branch-id: <BRANCH_UUID>"
\`\`\`

If \`x-branch-id\` is omitted, Stream uses the API key's default branch.

## Pagination & Filtering

List endpoints support:

- \`page\` (starts from 1)
- \`limit\` (max 100)
- \`sort_field\` (default \`created_at\`)
- \`sort_direction\` (\`asc\` or \`desc\`, default \`desc\`)
- \`search_term\`
- resource-specific filters (example: \`invoice_id\`, \`statuses\`)

Example:

\`\`\`
GET /api/v2/payments?page=1&limit=20&invoice_id=<UUID>&statuses=PENDING&statuses=PROCESSING
\`\`\`

Response includes:

\`\`\`json
{
  "data": [],
  "pagination": {
    "total_count": 20,
    "max_page": 12,
    "current_page": 1,
    "limit": 20,
    "has_next_page": true,
    "has_previous_page": false
  }
}
\`\`\`

## SDKs & Framework Adapters

### TypeScript SDK

\`\`\`bash
npm install @streamsdk/typescript
\`\`\`

\`\`\`ts
import StreamSDK from "@streamsdk/typescript"

const client = StreamSDK.init(process.env.STREAM_API_KEY_BASE64!)
\`\`\`

### Express SDK

\`\`\`bash
npm install @streamsdk/express
\`\`\`

\`\`\`ts
import express from "express"
import { Checkout, Webhooks } from "@streamsdk/express"

const app = express()
app.use(express.json())

app.get(
  "/checkout",
  Checkout({
    apiKey: process.env.STREAM_API_KEY_BASE64!,
    successUrl: "https://yourapp.com/success",
    returnUrl: "https://yourapp.com/cancel"
  })
)
\`\`\`

## Webhooks

Webhooks send real-time event notifications.

### Webhook flow logic

- Single payment succeeds:
  - PAYMENT_SUCCEEDED (one per payment)
  - If the invoice completes: INVOICE_COMPLETED
- Multiple payments succeed (installments):
  - PAYMENT_SUCCEEDED for each payment
  - If all payments complete the invoice: INVOICE_COMPLETED
- Payment fails:
  - PAYMENT_FAILED
- Payment refunded:
  - PAYMENT_REFUNDED
- Payment marked as paid:
  - PAYMENT_MARKED_AS_PAID
  - If this completes the invoice: INVOICE_COMPLETED
- Payment link attempt fails before entities are created:
  - PAYMENT_LINK_PAY_ATTEMPT_FAILED

Common event types:

- PAYMENT_SUCCEEDED
- PAYMENT_FAILED
- PAYMENT_CANCELED
- PAYMENT_REFUNDED
- PAYMENT_MARKED_AS_PAID
- INVOICE_CREATED
- INVOICE_COMPLETED
- SUBSCRIPTION_CREATED
- SUBSCRIPTION_ACTIVATED
- SUBSCRIPTION_CANCELED
- PAYMENT_LINK_PAY_ATTEMPT_FAILED

Payload envelope example:

\`\`\`json
{
  "event_type": "PAYMENT_SUCCEEDED",
  "entity_type": "PAYMENT",
  "entity_id": "<UUID>",
  "entity_url": "https://stream-app-service.streampay.sa/api/v2/payments/<UUID>",
  "status": "SUCCEEDED",
  "data": {},
  "timestamp": "2025-07-15T14:41:21.705Z"
}
\`\`\`

### Webhook request headers

- Content-Type: application/json
- X-Webhook-Event: Event type (e.g., PAYMENT_SUCCEEDED)
- X-Webhook-Entity-Type: Entity type (e.g., PAYMENT)
- X-Webhook-Entity-ID: Entity UUID
- X-Webhook-Signature: Format: t={timestamp},v1={signature}
- X-Webhook-Timestamp: The timestamp used in the signature

### Signature verification

- Parse X-Webhook-Signature and extract \`t\` and \`v1\`
- Compute HMAC-SHA256 of \`{timestamp}.{raw_request_body}\` using your webhook \`secret_key\`
- Compare the computed signature with \`v1\` using a timing-safe comparison

### Delivery & retry logic

- If your endpoint does not respond with a 2xx status, Stream retries delivery up to 5 times.
- Default retry delays (minutes): 5, 30, 120, 360, 720.

## Installments

Installments may create multiple payments per invoice.

Webhook behavior:

- PAYMENT_SUCCEEDED is sent once per payment
- INVOICE_COMPLETED is sent only when all payments are completed
`

export const STREAM_DOCS_MD_AR = `# بوابة الدفع Stream (توثيق داخلي)

هذا التوثيق للاستخدام الداخلي فقط.

## الهدف (متجر نيون)

- إضافة كورسات مدفوعة كمنتجات في المتجر.
- تحويل المستخدم إلى صفحة الدفع الآمنة في Stream.
- التحقق من الدفع في السيرفر قبل منح صلاحية الوصول للكورس.

## رابط الـ API

\`https://stream-app-service.streampay.sa/api/v2\`

## Authentication

جميع طلبات Stream تحتاج مصادقة عبر API Key Pair.

\`\`\`bash
echo -n 'api-key:api-secret' | base64
\`\`\`

ثم تمريرها في الهيدر:

\`\`\`bash
curl -X GET https://stream-app-service.streampay.sa/api/v2/user \\
  -H "x-api-key: <YOUR_BASE64_TOKEN>"
\`\`\`

## Errors

\`\`\`json
{
  "error": {
    "code": "STREAM_ERROR",
    "message": "Something wrong happened, please contact support.",
    "additional_info": "Optional human-readable details"
  }
}
\`\`\`

## Branches

تحديد الفرع عبر:

\`\`\`bash
curl -X GET https://stream-app-service.streampay.sa/api/v2/user \\
  -H "x-api-key: <YOUR_BASE64_TOKEN>" \\
  -H "x-branch-id: <BRANCH_UUID>"
\`\`\`

## Pagination & Filtering

يدعم:

- page / limit (حد أقصى 100)
- sort_field / sort_direction
- search_term
- فلاتر خاصة لكل مورد (مثل statuses)

## SDKs

- TypeScript: \`@streamsdk/typescript\`
- Express: \`@streamsdk/express\`

## Webhooks

أحداث شائعة:

- PAYMENT_SUCCEEDED
- PAYMENT_FAILED
- INVOICE_COMPLETED

### التحقق من التوقيع

- X-Webhook-Signature بصيغة: t={timestamp},v1={signature}
- يتم حساب HMAC-SHA256 لقيمة \`{timestamp}.{raw_request_body}\` باستخدام \`secret_key\`
- يجب مقارنة التوقيع مقارنة آمنة (timing-safe)

### إعادة المحاولة

- إذا لم ترجع endpoint بكود 2xx، تتم إعادة المحاولة حتى 5 مرات
- الفواصل بالدقائق: 5 ثم 30 ثم 120 ثم 360 ثم 720

## Installments

في التقسيط قد يكون هناك عدة دفعات لنفس الفاتورة، و \`INVOICE_COMPLETED\` يأتي فقط بعد اكتمال جميع الدفعات.
`
