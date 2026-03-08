
import { requirePermission } from "@/lib/rbac/require-permission"
import { db } from "@/lib/db"
import { categories } from "@/lib/db/schema"
import { desc } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Filter, Edit, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import Image from "next/image"

async function getCategories() {
  const result = await db
    .select({
      id: categories.id,
      name_en: categories.nameEn,
      name_ar: categories.nameAr,
      slug: categories.slug,
      description_en: categories.descriptionEn,
      description_ar: categories.descriptionAr,
      icon_url: categories.iconUrl,
      created_at: categories.createdAt,
    })
    .from(categories)
    .orderBy(desc(categories.createdAt))
  
  return result
}

export default async function CategoriesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  await requirePermission("courses:write") // Assuming categories management requires course write permission or similar admin permission

  const categoriesData = await getCategories()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground">Manage course categories and taxonomy</p>
        </div>
        <Button asChild>
          <Link href={`/${lang}/admin/categories/new`}>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search categories..." className="pl-9" />
            </div>
            {/* <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button> */}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Categories ({categoriesData.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Icon</TableHead>
                <TableHead>Name (EN)</TableHead>
                <TableHead>Name (AR)</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoriesData.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    {category.icon_url ? (
                       <div className="relative h-8 w-8 overflow-hidden rounded">
                        <Image 
                          src={category.icon_url} 
                          alt={category.name_en}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-8 w-8 rounded bg-muted" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{category.name_en}</TableCell>
                  <TableCell className="font-medium">{category.name_ar}</TableCell>
                  <TableCell>{category.slug}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {category.description_en || category.description_ar}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/${lang}/admin/categories/${category.id}`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      {/* TODO: Add delete functionality */}
                      {/* <Button variant="ghost" size="icon" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button> */}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {categoriesData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No categories found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
