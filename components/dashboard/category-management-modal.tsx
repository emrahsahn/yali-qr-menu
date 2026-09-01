"use client"

import React, { useState } from "react"
import { Category } from "@/lib/types/database"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Layers, Plus, Trash2, Edit2, X } from "lucide-react"

interface CategoryManagementModalProps {
  isOpen: boolean
  onClose: () => void
  categories: Category[]
  onAddCategory: (adTr: string, adEn: string, sira: number) => Promise<void>
  onUpdateCategory: (id: string, adTr: string, adEn: string, sira: number) => Promise<void>
  onDeleteCategory: (id: string) => Promise<void>
}

export function CategoryManagementModal({
  isOpen,
  onClose,
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory
}: CategoryManagementModalProps) {
  const [newAdTr, setNewAdTr] = useState("")
  const [newAdEn, setNewAdEn] = useState("")
  const [newSira, setNewSira] = useState<number>(categories.length + 1)
  const [isAdding, setIsAdding] = useState(false)

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editAdTr, setEditAdTr] = useState("")
  const [editAdEn, setEditAdEn] = useState("")
  const [editSira, setEditSira] = useState<number>(1)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAdTr.trim()) return

    setIsAdding(true)
    try {
      await onAddCategory(newAdTr.trim(), newAdEn.trim() || newAdTr.trim(), newSira)
      setNewAdTr("")
      setNewAdEn("")
      setNewSira(categories.length + 2)
    } catch (e) {
      console.error(e)
    } finally {
      setIsAdding(false)
    }
  }

  const startEdit = (cat: Category) => {
    setEditingId(cat.id)
    setEditAdTr(cat.ad_tr)
    setEditAdEn(cat.ad_en)
    setEditSira(cat.sira)
  }

  const handleSaveEdit = async (id: string) => {
    if (!editAdTr.trim()) return
    try {
      await onUpdateCategory(id, editAdTr.trim(), editAdEn.trim() || editAdTr.trim(), editSira)
      setEditingId(null)
    } catch (e) {
      console.error(e)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`'${name}' kategorisini silmek istediğinize emin misiniz?`)) return
    try {
      await onDeleteCategory(id)
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-6 border-border bg-card text-foreground sm:rounded-3xl shadow-2xl">
        <DialogHeader className="text-left flex flex-row items-center gap-3 border-b border-border pb-4">
          <div className="p-3 bg-primary/10 text-primary rounded-2xl border border-primary/20">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <DialogTitle className="font-heading font-black text-lg">
              Kategori Yönetimi
            </DialogTitle>
            <DialogDescription className="text-xs text-foreground/60 font-semibold mt-0.5">
              Menüdeki kategori başlıklarını düzenleyin veya yeni bir kategori oluşturun.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-2 max-h-[60vh] overflow-y-auto pr-1">
          {/* New Category Form */}
          <form onSubmit={handleCreate} className="p-3.5 rounded-2xl bg-muted/40 border border-border flex flex-col gap-2.5">
            <span className="text-xs font-black text-primary uppercase tracking-wider flex items-center gap-1">
              <Plus className="h-3.5 w-3.5" /> Yeni Kategori Ekle
            </span>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                required
                value={newAdTr}
                onChange={(e) => setNewAdTr(e.target.value)}
                placeholder="Türkçe Adı (örn: Makarna)"
                className="text-xs font-semibold px-3 py-2 rounded-xl border border-border bg-background focus:outline-none focus:border-primary"
              />
              <input
                type="text"
                value={newAdEn}
                onChange={(e) => setNewAdEn(e.target.value)}
                placeholder="English Name (Pasta)"
                className="text-xs font-semibold px-3 py-2 rounded-xl border border-border bg-background focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-foreground/60">Sıra:</span>
                <input
                  type="number"
                  value={newSira}
                  onChange={(e) => setNewSira(Number(e.target.value))}
                  className="w-16 text-xs font-bold px-2 py-1 rounded-lg border border-border bg-background"
                />
              </div>

              <Button
                type="submit"
                disabled={isAdding}
                className="rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground py-1.5 px-4"
              >
                {isAdding ? "Ekle..." : "+ Kategori Oluştur"}
              </Button>
            </div>
          </form>

          {/* Existing Categories List */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-extrabold uppercase text-foreground/60 tracking-wider">
              Mevcut Kategoriler ({categories.length})
            </span>

            {categories.map((cat) => {
              const isEditing = editingId === cat.id

              if (isEditing) {
                return (
                  <div key={cat.id} className="p-3 rounded-2xl bg-card border border-primary/40 flex flex-col gap-2 shadow-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={editAdTr}
                        onChange={(e) => setEditAdTr(e.target.value)}
                        className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-border bg-background"
                      />
                      <input
                        type="text"
                        value={editAdEn}
                        onChange={(e) => setEditAdEn(e.target.value)}
                        className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-border bg-background"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-foreground/60 font-semibold">
                        <span>Sıra:</span>
                        <input
                          type="number"
                          value={editSira}
                          onChange={(e) => setEditSira(Number(e.target.value))}
                          className="w-14 text-xs font-bold px-2 py-1 rounded-lg border border-border bg-background"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="p-1.5 text-foreground/60 hover:text-foreground rounded-lg cursor-pointer"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(cat.id)}
                          className="px-3 py-1 bg-primary text-primary-foreground rounded-lg text-xs font-bold cursor-pointer"
                        >
                          Kaydet
                        </button>
                      </div>
                    </div>
                  </div>
                )
              }

              return (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-muted/20 border border-border hover:border-primary/20 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                      {cat.sira}
                    </span>
                    <div className="flex flex-col text-left">
                      <span className="font-heading font-black text-sm text-foreground">{cat.ad_tr}</span>
                      <span className="text-[10px] text-foreground/50 font-semibold">{cat.ad_en}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => startEdit(cat)}
                      className="p-1.5 rounded-lg hover:bg-muted text-foreground/60 hover:text-foreground cursor-pointer"
                      title="Düzenle"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(cat.id, cat.ad_tr)}
                      className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500 cursor-pointer"
                      title="Sil"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-border flex justify-end">
          <Button onClick={onClose} className="rounded-xl text-xs font-bold px-5">
            Tamam
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
