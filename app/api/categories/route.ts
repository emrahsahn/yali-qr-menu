import { NextRequest, NextResponse } from "next/server"
import {
  getCategories,
  saveCategory,
  deleteCategory
} from "@/lib/data/menu-store"
import { verifyStaffSession } from "@/lib/security/auth-guard"

// GET: Tüm kategorileri sıralı getir (HERKESE AÇIK - Müşteriler kategorileri okuyabilmelidir)
export async function GET() {
  try {
    const categories = await getCategories()
    return NextResponse.json(
      { categories },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0, must-revalidate"
        }
      }
    )
  } catch (error) {
    console.error("Categories GET error:", error)
    return NextResponse.json({ categories: [] }, { status: 500 })
  }
}

// POST: Yeni kategori ekle (SADECE GÖREVLİ / AUTH GEREKLİDİR)
export async function POST(request: NextRequest) {
  try {
    const auth = verifyStaffSession(request)
    if (!auth.authenticated) {
      return NextResponse.json(
        { error: "Yetkisiz işlem. Lütfen önce görevli girişi yapınız." },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { ad_tr, ad_en, sira } = body

    if (!ad_tr) {
      return NextResponse.json({ error: "Türkçe kategori adı gereklidir." }, { status: 400 })
    }

    const newCategory = await saveCategory({
      ad_tr: String(ad_tr).trim(),
      ad_en: ad_en ? String(ad_en).trim() : String(ad_tr).trim(),
      sira: sira !== undefined ? Number(sira) : 99
    })

    return NextResponse.json({ success: true, category: newCategory })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kategori eklenirken hata oluştu."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// PUT: Kategori güncelle (SADECE GÖREVLİ / AUTH GEREKLİDİR)
export async function PUT(request: NextRequest) {
  try {
    const auth = verifyStaffSession(request)
    if (!auth.authenticated) {
      return NextResponse.json(
        { error: "Yetkisiz işlem. Lütfen önce görevli girişi yapınız." },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: "Kategori ID gereklidir." }, { status: 400 })
    }

    const updated = await saveCategory({
      id,
      ...updates
    })

    return NextResponse.json({ success: true, category: updated })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kategori güncellenirken hata oluştu."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE: Kategori sil (SADECE GÖREVLİ / AUTH GEREKLİDİR)
export async function DELETE(request: NextRequest) {
  try {
    const auth = verifyStaffSession(request)
    if (!auth.authenticated) {
      return NextResponse.json(
        { error: "Yetkisiz işlem. Lütfen önce görevli girişi yapınız." },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    let id = searchParams.get("id")

    if (!id) {
      try {
        const body = await request.json()
        id = body.id
      } catch {}
    }

    if (!id) {
      return NextResponse.json({ error: "Kategori ID gereklidir." }, { status: 400 })
    }

    const deleted = await deleteCategory(id)
    if (!deleted) {
      return NextResponse.json({ error: "Kategori bulunamadı." }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kategori silinirken hata oluştu."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
