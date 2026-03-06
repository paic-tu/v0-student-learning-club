"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/admin/confirm-dialog"
import { useToast } from "@/hooks/use-toast"
import { Pencil, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react"

type ModuleRow = {
  id: string
  title_en?: string
  title_ar?: string
  titleEn?: string
  titleAr?: string
  order_index?: number
  orderIndex?: number
}

export function ModulesList({ modules, courseId }: { modules: ModuleRow[]; courseId: string }) {
  const router = useRouter()
  const { toast } = useToast()

  const sorted = useMemo(() => {
    return [...modules].sort((a, b) => {
      const ao = a.order_index ?? a.orderIndex ?? 0
      const bo = b.order_index ?? b.orderIndex ?? 0
      return ao - bo
    })
  }, [modules])

  const [createOpen, setCreateOpen] = useState(false)
  const [createTitleEn, setCreateTitleEn] = useState("")
  const [createTitleAr, setCreateTitleAr] = useState("")
  const [saving, setSaving] = useState(false)
  const [reordering, setReordering] = useState(false)

  const [editOpen, setEditOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editTitleEn, setEditTitleEn] = useState("")
  const [editTitleAr, setEditTitleAr] = useState("")
  const [editOrderIndex, setEditOrderIndex] = useState<string>("0")

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  async function handleReorder(index: number, direction: "up" | "down") {
    if (reordering) return
    if (direction === "up" && index === 0) return
    if (direction === "down" && index === sorted.length - 1) return

    setReordering(true)
    const newModules = [...sorted]
    const targetIndex = direction === "up" ? index - 1 : index + 1
    
    // Swap order indices
    const currentModule = newModules[index]
    const targetModule = newModules[targetIndex]

    const currentOrder = currentModule.order_index ?? currentModule.orderIndex ?? 0
    const targetOrder = targetModule.order_index ?? targetModule.orderIndex ?? 0

    // Swap visually for optimistic update (optional, but good)
    // Actually, we'll just swap the order values and send to server
    
    const updates = [
      { id: currentModule.id, orderIndex: targetOrder },
      { id: targetModule.id, orderIndex: currentOrder },
    ]

    try {
      const res = await fetch("/api/admin/modules/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: updates }),
      })

      if (!res.ok) throw new Error("Failed to reorder")
      
      router.refresh()
      toast({ title: "Order updated" })
    } catch (e) {
      toast({ title: "Error", description: "Failed to reorder modules", variant: "destructive" })
    } finally {
      setReordering(false)
    }
  }

  async function handleCreate() {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, titleEn: createTitleEn, titleAr: createTitleAr }),
      })
      const payload = await res.json().catch(() => null)
      if (!res.ok) throw new Error(payload?.error || "Failed to create module")

      setCreateTitleEn("")
      setCreateTitleAr("")
      setCreateOpen(false)
      toast({ title: "Module created" })
      router.refresh()
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Failed to create module", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  function openEdit(m: ModuleRow) {
    setEditId(m.id)
    setEditTitleEn((m.title_en ?? m.titleEn ?? "").toString())
    setEditTitleAr((m.title_ar ?? m.titleAr ?? "").toString())
    setEditOrderIndex(String(m.order_index ?? m.orderIndex ?? 0))
    setEditOpen(true)
  }

  async function handleEditSave() {
    if (!editId) return
    setSaving(true)
    try {
      const orderIndex = editOrderIndex.trim() === "" ? undefined : Number.parseInt(editOrderIndex, 10)
      const res = await fetch(`/api/admin/modules/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titleEn: editTitleEn,
          titleAr: editTitleAr,
          orderIndex: Number.isFinite(orderIndex) ? orderIndex : undefined,
        }),
      })
      const payload = await res.json().catch(() => null)
      if (!res.ok) throw new Error(payload?.error || "Failed to update module")

      setEditOpen(false)
      toast({ title: "Module updated" })
      router.refresh()
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Failed to update module", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  function openDelete(id: string) {
    setDeleteId(id)
    setDeleteOpen(true)
  }

  async function handleDelete() {
    if (!deleteId) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/modules/${deleteId}`, { method: "DELETE" })
      const payload = await res.json().catch(() => null)
      if (!res.ok) throw new Error(payload?.error || "Failed to delete module")

      setDeleteOpen(false)
      setDeleteId(null)
      toast({ title: "Module deleted" })
      router.refresh()
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Failed to delete module", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Module
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Module</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Title (EN)</div>
                <Input value={createTitleEn} onChange={(e) => setCreateTitleEn(e.target.value)} />
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Title (AR)</div>
                <Input value={createTitleAr} onChange={(e) => setCreateTitleAr(e.target.value)} dir="rtl" />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={saving || !createTitleEn.trim() || !createTitleAr.trim()}>
                  Create
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {sorted.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No modules yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Title (EN)</TableHead>
              <TableHead>Title (AR)</TableHead>
              <TableHead className="w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((m, index) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">
                   <div className="flex items-center gap-2">
                     {m.order_index ?? m.orderIndex ?? 0}
                     <div className="flex flex-col">
                       <Button 
                         variant="ghost" 
                         size="icon" 
                         className="h-4 w-4" 
                         disabled={index === 0 || reordering}
                         onClick={() => handleReorder(index, "up")}
                       >
                         <ArrowUp className="h-3 w-3" />
                       </Button>
                       <Button 
                         variant="ghost" 
                         size="icon" 
                         className="h-4 w-4"
                         disabled={index === sorted.length - 1 || reordering}
                         onClick={() => handleReorder(index, "down")}
                       >
                         <ArrowDown className="h-3 w-3" />
                       </Button>
                     </div>
                   </div>
                </TableCell>
                <TableCell>{m.title_en ?? m.titleEn ?? ""}</TableCell>
                <TableCell dir="rtl">{m.title_ar ?? m.titleAr ?? ""}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(m)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openDelete(m.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Module</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Order</div>
              <Input value={editOrderIndex} onChange={(e) => setEditOrderIndex(e.target.value)} inputMode="numeric" />
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Title (EN)</div>
              <Input value={editTitleEn} onChange={(e) => setEditTitleEn(e.target.value)} />
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Title (AR)</div>
              <Input value={editTitleAr} onChange={(e) => setEditTitleAr(e.target.value)} dir="rtl" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleEditSave} disabled={saving || !editTitleEn.trim() || !editTitleAr.trim()}>
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        title="Delete module?"
        description="This cannot be undone. If the module has lessons, deletion will be blocked."
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  )
}

