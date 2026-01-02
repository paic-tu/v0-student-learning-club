# Neon Admin Panel - Complete Documentation

## Overview

The Neon Admin Panel is a production-ready administrative system for managing all aspects of the educational platform. It features role-based access control (RBAC), comprehensive audit logging, and full CRUD operations for all resources.

## Features

### 1. Role-Based Access Control (RBAC)

**Supported Roles:**
- **Admin**: Full access to all features
- **Manager**: Content and store management, no system settings
- **Instructor**: Own courses and lessons only
- **Support**: Users, orders, and refunds, read-only settings
- **Student**: No admin access

**Permission System:**
- Granular permissions like `users:read`, `courses:write`, `orders:refund`
- Server-side enforcement in all API routes
- Client-side permission checks for UI elements

### 2. Audit Logging

All admin actions are automatically logged with:
- User who performed the action
- Action type (create, update, delete, publish, etc.)
- Resource type and ID
- Before/after state for updates
- IP address and user agent
- Timestamp

View logs at `/admin/audit-logs`

### 3. Admin Modules

#### Users & Roles (`/admin/users`)
- View all users with filtering and search
- Edit user profiles and roles
- Assign permissions
- View user statistics (enrollments, orders, certificates)
- Ban/unban users

#### Courses (`/admin/courses`)
- Full CRUD for courses
- Publish/unpublish courses
- Manage lessons (create, edit, reorder, delete)
- Set pricing and difficulty
- Track enrollments per course

#### Store & Products (`/admin/store`)
- Manage store items
- Set prices and points costs
- Inventory management
- Product categories

#### Orders (`/admin/orders`)
- View all orders
- Update order status
- Process refunds
- Track revenue

#### Challenges (`/admin/challenges`)
- Create coding challenges
- Set difficulty and points
- Manage test cases
- Track submissions

#### Contests (`/admin/contests`)
- Create competitions
- Set start/end dates
- Manage participants
- View leaderboards

#### Certificates (`/admin/certificates`)
- View all issued certificates
- Revoke certificates
- Verify certificate numbers
- Auto-issue on course completion

#### Settings (`/admin/settings`)
- General platform settings
- Email configuration
- Payment settings
- Maintenance mode

### 4. API Routes

All admin APIs follow this pattern:

**Base Path:** `/api/admin/{resource}`

**Endpoints:**
- `GET /api/admin/{resource}` - List all
- `POST /api/admin/{resource}` - Create new
- `GET /api/admin/{resource}/{id}` - Get one
- `PATCH /api/admin/{resource}/{id}` - Update
- `DELETE /api/admin/{resource}/{id}` - Delete

**Security:**
- All routes require authentication
- Permission checks on every request
- Zod schema validation for inputs
- Audit logging for all mutations

## Setup

### 1. Database Schema

The admin panel adds these tables:
- `audit_logs` - Track all admin actions
- `permissions` - Granular permission definitions
- `role_permissions` - Map roles to permissions

Run the migration:
```sql
-- Schema is in lib/db/schema.ts
-- Tables are automatically created
```

### 2. Create First Admin

Update an existing user to admin:
```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

### 3. Access Admin Panel

Navigate to `/admin` - you'll be redirected to login if not authenticated.

## Development

### Adding a New Admin Module

1. **Create the page**: `app/admin/your-module/page.tsx`
2. **Add permission check**: `await requirePermission('your-module:read')`
3. **Create API routes**: `app/api/admin/your-module/route.ts`
4. **Add to sidebar**: Update `components/admin/admin-sidebar.tsx`
5. **Add audit logging**: Use `logAudit()` in mutations

### Example API Route

```typescript
import { requirePermission } from '@/lib/rbac/require-permission'
import { logAudit } from '@/lib/audit/audit-logger'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1)
})

export async function POST(request: NextRequest) {
  try {
    await requirePermission('resource:write')
    
    const body = await request.json()
    const data = schema.parse(body)
    
    // Create resource
    const result = await sql`INSERT INTO resources (name) VALUES (${data.name}) RETURNING *`
    
    // Log audit
    await logAudit({
      action: 'create',
      resource: 'resource',
      resourceId: result[0].id,
      changes: { after: result[0] }
    })
    
    return NextResponse.json(result[0])
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 })
  }
}
```

## Security Best Practices

1. **Always check permissions server-side** - Never trust client checks
2. **Validate all inputs with Zod** - Prevent injection attacks
3. **Log all admin actions** - Maintain audit trail
4. **Use soft deletes for critical data** - Allow recovery
5. **Rate limit admin APIs** - Prevent abuse

## Testing

Test checklist:
- [ ] Permission enforcement works (try accessing as student)
- [ ] CRUD operations work for all modules
- [ ] Audit logs are created for mutations
- [ ] Search and filters work
- [ ] Bulk actions work
- [ ] Error handling displays properly
- [ ] Mobile responsive

## Deployment

The admin panel is deployed with the main application. No additional configuration needed.

**Environment Variables:**
- `DATABASE_URL` or `DATABASE_URL_POOLED` - Required for database access
- All other env vars from main app

## Troubleshooting

**Can't access admin panel:**
- Check your user role: `SELECT role FROM users WHERE email = 'your@email.com'`
- Verify middleware is running
- Check browser console for errors

**Permissions not working:**
- Verify role in `lib/rbac/permissions.ts`
- Check `requirePermission()` calls in API routes
- Restart dev server after permission changes

**Audit logs not appearing:**
- Check `logAudit()` is called after mutations
- Verify audit_logs table exists
- Check database connection

## Future Enhancements

- [ ] Bulk operations (select multiple items)
- [ ] Export data (CSV, Excel)
- [ ] Advanced filtering and sorting
- [ ] Dashboard analytics charts
- [ ] Email notifications for admin actions
- [ ] Two-factor authentication for admins
- [ ] API rate limiting
- [ ] Soft delete with trash/restore
- [ ] Version history for content
- [ ] Scheduled publishing
