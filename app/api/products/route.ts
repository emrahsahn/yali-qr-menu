import { NextRequest, NextResponse } from "next/server"
import {
  getProducts,
  saveProduct,
  toggleProductActive,
  deleteProduct
} from "@/lib/data/menu-store"
import { verifyStaffSession } from "@/lib/security/auth-guard"

// GET: Ürünleri getir (HERKESE AÇIK - Müşteriler menüyü okuyabilmelidir)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get("kategori_id")
    const includeInactive = searchParams.get("include_inactive") !== "false" // Default to true so status badges show

    let products = await getProducts(includeInactive)

    if (categoryId && categoryId !== "all") {
      products = products.filter((p) => p.kategori_id === categoryId)
    }

    return NextResponse.json(
      { products },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0, must-revalidate"
        }
      }
    )
  } catch (error) {
    console.error("Products GET error:", error)
    return NextResponse.json({ products: [] }, { status: 500 })
  }
}

// POST: Yeni ürün ekle (SADECE GÖREVLİ / AUTH GEREKLİDİR)
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
    const {
      kategori_id,
      ad_tr,
      ad_en,
      aciklama_tr,
      aciklama_en,
      fiyat,
      porsiyonlar,
      gorsel_url,
      ozellikler,
      aktif
    } = body

    if (!ad_tr || !kategori_id || fiyat === undefined) {
      return NextResponse.json(
        { error: "Gerekli alanlar eksik (ad_tr, kategori_id, fiyat)" },
        { status: 400 }
      )
    }

    const newProduct = await saveProduct({
      kategori_id,
      ad_tr: String(ad_tr).trim(),
      ad_en: ad_en ? String(ad_en).trim() : String(ad_tr).trim(),
      aciklama_tr: aciklama_tr ? String(aciklama_tr).trim() : "",
      aciklama_en: aciklama_en ? String(aciklama_en).trim() : "",
      fiyat: Number(fiyat),
      porsiyonlar: Array.isArray(porsiyonlar) ? porsiyonlar : undefined,
      gorsel_url: gorsel_url || "",
      ozellikler: ozellikler || {},
      aktif: aktif !== undefined ? Boolean(aktif) : true
    })

    return NextResponse.json({ success: true, product: newProduct })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ürün eklenirken hata oluştu."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// PUT: Ürün güncelle (SADECE GÖREVLİ / AUTH GEREKLİDİR)
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
      return NextResponse.json({ error: "Ürün ID gereklidir." }, { status: 400 })
    }

    const updated = await saveProduct({
      id,
      ...updates
    })

    return NextResponse.json({ success: true, product: updated })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ürün güncellenirken hata oluştu."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// PATCH: Hızlı Tükendi / Aktiflik Değişimi (SADECE GÖREVLİ / AUTH GEREKLİDİR)
export async function PATCH(request: NextRequest) {
  try {
    const auth = verifyStaffSession(request)
    if (!auth.authenticated) {
      return NextResponse.json(
        { error: "Yetkisiz işlem. Lütfen önce görevli girişi yapınız." },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: "Ürün ID gereklidir." }, { status: 400 })
    }

    const updated = await toggleProductActive(id)
    if (!updated) {
      return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 404 })
    }

    return NextResponse.json({ success: true, product: updated })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ürün durumu güncellenirken hata oluştu."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE: Ürün sil (SADECE GÖREVLİ / AUTH GEREKLİDİR)
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
      return NextResponse.json({ error: "Ürün ID gereklidir." }, { status: 400 })
    }

    const deleted = await deleteProduct(id)
    if (!deleted) {
      return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ürün silinirken hata oluştu."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
