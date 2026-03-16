## إعداد Cloudflare R2 (للرفع حتى 1TB وتشغيل mp4 بدون 0:00)

هذا المشروع يدعم رفع الملفات الكبيرة مباشرة إلى R2 عبر Multipart Upload.

### 1) إنشاء Bucket
- Cloudflare Dashboard → R2 → Create bucket

### 2) إنشاء مفاتيح S3 API
- R2 → Manage R2 API tokens → Create API token
- Permissions: Read + Write على الـ bucket
- خزّن:
  - Access Key ID
  - Secret Access Key

### 3) إعداد CORS (مهم جدًا)
في إعدادات الـ bucket → CORS، استخدم إعداد مثل:

```json
[
  {
    "AllowedOrigins": ["https://neonedu.org"],
    "AllowedMethods": ["GET", "HEAD", "PUT"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

إذا تستخدم Vercel Preview أضف دومين preview ضمن AllowedOrigins.

### 4) إضافة Environment Variables في Vercel
Project Settings → Environment Variables:

- STORAGE_BUCKET = اسم الـ bucket
- STORAGE_ACCESS_KEY = Access Key ID
- STORAGE_SECRET_KEY = Secret Access Key
- STORAGE_ENDPOINT = https://<account_id>.r2.cloudflarestorage.com
- STORAGE_REGION = auto
- STORAGE_FORCE_PATH_STYLE = 1
- UPLOAD_EXTERNAL_REQUIRED_MB = 200

بعدها Redeploy.

### 5) التحقق
بعد الرفع، رابط `/api/files/<id>` لازم يعمل Redirect 307 إلى Signed URL من R2.
