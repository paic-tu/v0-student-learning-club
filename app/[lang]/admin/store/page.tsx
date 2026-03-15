import { requirePermission } from "@/lib/rbac/require-permission"
import { db } from "@/lib/db"
import { products, categories, orders, courses } from "@/lib/db/schema"
import { eq, desc, sum, count, inArray } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Filter, DollarSign } from "lucide-react"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { StoreCourseControls } from "@/components/admin/store-course-controls"
import { StoreCourseProductLinker } from "@/components/admin/store-course-product-linker"

export default async function StoreManagementPage(props: { params: Promise<{ lang: string }> }) {
  const params = await props.params
  const { lang } = params
  const isAr = lang === "ar"
  await requirePermission("store:read")

  const [items, stats, courseItems] = await Promise.all([
    db.query.products.findMany({
      with: {
        category: true
      },
      orderBy: [desc(products.createdAt)]
    }),
    db.select({
      totalRevenue: sum(orders.totalAmount),
      totalOrders: count()
    })
    .from(orders)
    .where(inArray(orders.status, ['paid', 'shipped', 'delivered'])),
    db.query.courses.findMany({
      orderBy: [desc(courses.updatedAt)],
      with: { category: true }
    }),
  ])


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{isAr ? "إدارة المتجر" : "Store Management"}</h1>
          <p className="text-muted-foreground">{isAr ? "إدارة المنتجات والدورات" : "Manage products and courses"}</p>
        </div>
        <Button asChild>
          <Link href={`/${lang}/admin/store/new`}>
            <Plus className="mr-2 h-4 w-4" />
            {isAr ? "إضافة منتج" : "Add Product"}
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{isAr ? "إجمالي الإيرادات" : "Total Revenue"}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats[0]?.totalRevenue || 0} SAR</div>
            <p className="text-xs text-muted-foreground">{isAr ? "من الطلبات المكتملة" : "From completed orders"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{isAr ? "إجمالي الطلبات" : "Total Orders"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats[0]?.totalOrders || 0}</div>
            <p className="text-xs text-muted-foreground">{isAr ? "منذ البداية" : "All time"}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder={isAr ? "بحث..." : "Search..."} className="pl-9" />
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              {isAr ? "فلتر" : "Filter"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{isAr ? `المنتجات (${items.length})` : `Products (${items.length})`}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>{isAr ? "الاسم" : "Name"}</TableHead>
                <TableHead>{isAr ? "الفئة" : "Category"}</TableHead>
                <TableHead>{isAr ? "السعر" : "Price"}</TableHead>
                <TableHead>{isAr ? "المخزون" : "Stock"}</TableHead>
                <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                <TableHead>{isAr ? "إجراءات" : "Actions"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-xs font-mono">{item.id.substring(0, 8)}...</TableCell>
                  <TableCell>{isAr ? item.nameAr : item.nameEn}</TableCell>
                  <TableCell>{(isAr ? item.category?.nameAr : item.category?.nameEn) || (isAr ? "بدون" : "None")}</TableCell>
                  <TableCell>{item.price} SAR</TableCell>
                  <TableCell>{item.stockQuantity}</TableCell>
                  <TableCell>
                    <Badge variant={item.isActive ? "default" : "secondary"}>
                      {item.isActive ? (isAr ? "نشط" : "Active") : isAr ? "غير نشط" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/${lang}/admin/store/${item.id}`}>{isAr ? "تعديل" : "Edit"}</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{isAr ? `الدورات (${courseItems.length})` : `Courses (${courseItems.length})`}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>{isAr ? "العنوان" : "Title"}</TableHead>
                <TableHead>{isAr ? "الفئة" : "Category"}</TableHead>
                <TableHead>{isAr ? "السعر" : "Price"}</TableHead>
                <TableHead>{isAr ? "النشر" : "Published"}</TableHead>
                <TableHead>{isAr ? "ربط المنتج بالدورة" : "Link Store Product"}</TableHead>
                <TableHead>{isAr ? "تحديث سريع" : "Quick Update"}</TableHead>
                <TableHead>{isAr ? "إجراءات" : "Actions"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courseItems.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium text-xs font-mono">{c.id.substring(0, 8)}...</TableCell>
                  <TableCell>{isAr ? c.titleAr : c.titleEn}</TableCell>
                  <TableCell>{(isAr ? c.category?.nameAr : c.category?.nameEn) || (isAr ? "بدون" : "None")}</TableCell>
                  <TableCell>{c.price} SAR</TableCell>
                  <TableCell>
                    <Badge variant={c.isPublished ? "default" : "secondary"}>
                      {c.isPublished ? (isAr ? "منشور" : "Published") : isAr ? "مسودة" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <StoreCourseProductLinker
                      lang={lang}
                      courseId={c.id}
                      products={items.map((p) => ({
                        id: p.id,
                        nameEn: p.nameEn,
                        nameAr: p.nameAr,
                        price: p.price,
                        streamProductId: p.streamProductId,
                      }))}
                    />
                  </TableCell>
                  <TableCell>
                    <StoreCourseControls
                      courseId={c.id}
                      initialPrice={c.price}
                      initialPublished={c.isPublished}
                      initialStreamProductId={c.streamProductId}
                    />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/${lang}/admin/courses/${c.id}`}>{isAr ? "تعديل" : "Edit"}</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
