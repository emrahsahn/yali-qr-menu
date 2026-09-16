import fs from "fs"
import path from "path"
import { Category, Product } from "@/lib/types/database"
import { Redis } from "@upstash/redis"
import { createClient } from "@/lib/supabase/server"

export interface MenuStoreData {
  categories: Category[];
  products: Product[];
}

const MENU_FILE_PATH = path.join(process.cwd(), "data", "menu.json")

// Global in-memory cache across requests & serverless hot-reloads
declare global {
  // eslint-disable-next-line no-var
  var __yaliMenuData: MenuStoreData | undefined;
  // eslint-disable-next-line no-var
  var __yaliMenuLastFetch: number | undefined;
}

const MEMORY_CACHE_TTL_MS = 15000 // 15 seconds memory cache protects Redis from rapid bursts

function getLocalFileDefaults(): MenuStoreData {
  try {
    if (fs.existsSync(MENU_FILE_PATH)) {
      const fileContent = fs.readFileSync(MENU_FILE_PATH, "utf-8")
      const parsed = JSON.parse(fileContent)
      if (parsed.categories && parsed.products) {
        return parsed
      }
    }
  } catch (error) {
    console.warn("Could not read menu.json from disk, using fallback:", error)
  }

  return {
    categories: [],
    products: []
  }
}

// Initialize Upstash Redis client with any Vercel/Upstash environment variable names
function getRedisClient(): Redis | null {
  const url =
    process.env.KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.STORAGE_REST_API_URL ||
    process.env.STORAGE_URL ||
    process.env.KV_URL
  const token =
    process.env.KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.STORAGE_REST_API_TOKEN ||
    process.env.STORAGE_TOKEN
  
  if (url && token) {
    try {
      return new Redis({ url, token })
    } catch (e) {
      console.warn("Notice: Upstash Redis client initialization skipped:", e)
    }
  }
  return null
}

export async function getMenuStore(): Promise<MenuStoreData> {
  const now = Date.now()

  // 0. Return from in-memory cache if fresh (avoids redundant Redis network calls)
  if (
    globalThis.__yaliMenuData &&
    globalThis.__yaliMenuLastFetch &&
    now - globalThis.__yaliMenuLastFetch < MEMORY_CACHE_TTL_MS &&
    globalThis.__yaliMenuData.products.length > 0
  ) {
    return globalThis.__yaliMenuData
  }

  const redis = getRedisClient()

  // 1. Upstash Redis (Vercel KV)
  if (redis) {
    try {
      const data = await redis.get<MenuStoreData | string>("yali_menu_data_v1")
      if (data) {
        const parsed = typeof data === "string" ? JSON.parse(data) : data
        if (parsed && Array.isArray(parsed.categories) && Array.isArray(parsed.products) && parsed.products.length > 0) {
          globalThis.__yaliMenuData = parsed
          globalThis.__yaliMenuLastFetch = now
          return parsed
        }
      }
      // If Redis is fresh and empty, auto-seed with local initial menu data
      const defaultData = getLocalFileDefaults()
      if (defaultData.products.length > 0) {
        await redis.set("yali_menu_data_v1", defaultData)
        globalThis.__yaliMenuData = defaultData
        globalThis.__yaliMenuLastFetch = now
        return defaultData
      }
    } catch (err) {
      console.warn("Notice: Upstash Redis get error, using fallback:", err)
    }
  }

  // 2. Supabase if configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const isSupabaseConfigured = supabaseUrl && supabaseUrl !== "your-supabase-url"
  if (isSupabaseConfigured) {
    try {
      const supabase = await createClient()
      if (supabase) {
        const [catRes, prodRes] = await Promise.all([
          supabase.from("categories").select("*").order("sira", { ascending: true }),
          supabase.from("products").select("*").order("created_at", { ascending: false })
        ])

        if (catRes.data && prodRes.data && catRes.data.length > 0) {
          const store: MenuStoreData = {
            categories: catRes.data as Category[],
            products: prodRes.data as Product[]
          }
          globalThis.__yaliMenuData = store
          return store
        }
      }
    } catch (e) {
      console.warn("Supabase fetch error, falling back to memory/file:", e)
    }
  }

  // 3. Local file / In-memory fallback
  if (!globalThis.__yaliMenuData) {
    globalThis.__yaliMenuData = getLocalFileDefaults()
  }
  return globalThis.__yaliMenuData
}

export async function persistMenuStore(data: MenuStoreData): Promise<boolean> {
  globalThis.__yaliMenuData = data
  globalThis.__yaliMenuLastFetch = Date.now()

  // 1. Save to Upstash Redis
  const redis = getRedisClient()
  if (redis) {
    try {
      await redis.set("yali_menu_data_v1", data)
    } catch (err) {
      console.warn("Notice: Upstash Redis set error:", err)
    }
  }

  // 2. Save to local disk (if file system is writable)
  try {
    const dir = path.dirname(MENU_FILE_PATH)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(MENU_FILE_PATH, JSON.stringify(data, null, 2), "utf-8")
  } catch (error) {
    // Expected on serverless / read-only filesystem
  }

  return true
}

export async function getProducts(includeInactive = true): Promise<Product[]> {
  const store = await getMenuStore()
  if (includeInactive) {
    return store.products
  }
  return store.products.filter((p) => p.aktif !== false)
}

export async function getCategories(): Promise<Category[]> {
  const store = await getMenuStore()
  return [...store.categories].sort((a, b) => a.sira - b.sira)
}

export async function saveProduct(productData: Partial<Product>): Promise<Product> {
  const store = await getMenuStore()
  let product: Product

  if (productData.id) {
    const index = store.products.findIndex((p) => p.id === productData.id)
    if (index !== -1) {
      product = {
        ...store.products[index],
        ...productData,
        fiyat: Number(productData.fiyat ?? store.products[index].fiyat)
      }
      store.products[index] = product
    } else {
      product = {
        id: productData.id,
        kategori_id: productData.kategori_id || store.categories[0]?.id || "cat-1",
        ad_tr: productData.ad_tr || "Yeni Ürün",
        ad_en: productData.ad_en || "New Product",
        aciklama_tr: productData.aciklama_tr || "",
        aciklama_en: productData.aciklama_en || "",
        fiyat: Number(productData.fiyat || 0),
        gorsel_url: productData.gorsel_url || "",
        ozellikler: productData.ozellikler || {},
        aktif: productData.aktif !== false,
        created_at: new Date().toISOString(),
        ...productData
      }
      store.products.push(product)
    }
  } else {
    product = {
      id: "prod-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
      kategori_id: productData.kategori_id || store.categories[0]?.id || "cat-1",
      ad_tr: productData.ad_tr || "Yeni Ürün",
      ad_en: productData.ad_en || "New Product",
      aciklama_tr: productData.aciklama_tr || "",
      aciklama_en: productData.aciklama_en || "",
      fiyat: Number(productData.fiyat || 0),
      porsiyonlar: productData.porsiyonlar,
      gorsel_url: productData.gorsel_url || "",
      ozellikler: productData.ozellikler || {},
      aktif: productData.aktif !== false,
      created_at: new Date().toISOString(),
      ...productData
    }
    store.products.push(product)
  }

  // Also sync to Supabase if configured
  try {
    const supabase = await createClient()
    if (supabase) {
      await supabase.from("products").upsert({
        id: product.id,
        kategori_id: product.kategori_id,
        ad_tr: product.ad_tr,
        ad_en: product.ad_en,
        aciklama_tr: product.aciklama_tr,
        aciklama_en: product.aciklama_en,
        fiyat: product.fiyat,
        gorsel_url: product.gorsel_url,
        ozellikler: product.ozellikler,
        aktif: product.aktif
      })
    }
  } catch {}

  await persistMenuStore(store)
  return product
}

export async function toggleProductActive(productId: string): Promise<Product | null> {
  const store = await getMenuStore()
  const product = store.products.find((p) => p.id === productId)
  if (!product) return null

  product.aktif = !product.aktif

  // Also sync to Supabase if configured
  try {
    const supabase = await createClient()
    if (supabase) {
      await supabase.from("products").update({ aktif: product.aktif }).eq("id", productId)
    }
  } catch {}

  await persistMenuStore(store)
  return product
}

export async function deleteProduct(productId: string): Promise<boolean> {
  const store = await getMenuStore()
  const initialLength = store.products.length
  store.products = store.products.filter((p) => p.id !== productId)

  if (store.products.length !== initialLength) {
    // Also sync to Supabase if configured
    try {
      const supabase = await createClient()
      if (supabase) {
        await supabase.from("products").delete().eq("id", productId)
      }
    } catch {}

    await persistMenuStore(store)
    return true
  }
  return false
}

export async function saveCategory(categoryData: Partial<Category>): Promise<Category> {
  const store = await getMenuStore()
  let category: Category

  if (categoryData.id) {
    const index = store.categories.findIndex((c) => c.id === categoryData.id)
    if (index !== -1) {
      category = {
        ...store.categories[index],
        ...categoryData
      }
      store.categories[index] = category
    } else {
      category = {
        id: categoryData.id,
        ad_tr: categoryData.ad_tr || "Yeni Kategori",
        ad_en: categoryData.ad_en || "New Category",
        sira: categoryData.sira ?? store.categories.length + 1,
        created_at: new Date().toISOString()
      }
      store.categories.push(category)
    }
  } else {
    category = {
      id: "cat-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
      ad_tr: categoryData.ad_tr || "Yeni Kategori",
      ad_en: categoryData.ad_en || "New Category",
      sira: categoryData.sira ?? store.categories.length + 1,
      created_at: new Date().toISOString()
    }
    store.categories.push(category)
  }

  // Also sync to Supabase if configured
  try {
    const supabase = await createClient()
    if (supabase) {
      await supabase.from("categories").upsert({
        id: category.id,
        ad_tr: category.ad_tr,
        ad_en: category.ad_en,
        sira: category.sira
      })
    }
  } catch {}

  await persistMenuStore(store)
  return category
}

export async function deleteCategory(categoryId: string): Promise<boolean> {
  const store = await getMenuStore()
  const initialLength = store.categories.length
  store.categories = store.categories.filter((c) => c.id !== categoryId)

  if (store.categories.length !== initialLength) {
    store.products = store.products.filter((p) => p.kategori_id !== categoryId)

    // Also sync to Supabase if configured
    try {
      const supabase = await createClient()
      if (supabase) {
        await supabase.from("categories").delete().eq("id", categoryId)
        await supabase.from("products").delete().eq("kategori_id", categoryId)
      }
    } catch {}

    await persistMenuStore(store)
    return true
  }
  return false
}

export interface MenuBackupPayload {
  version: string;
  system: string;
  exported_at: string;
  stats: {
    category_count: number;
    product_count: number;
  };
  categories: Category[];
  products: Product[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats?: {
    category_count: number;
    product_count: number;
  };
}

/**
 * Menü içeri aktarım verisini kapsamlı biçimde doğrular ve sanitize eder.
 */
export function validateMenuImportData(raw: unknown): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!raw || typeof raw !== "object") {
    return { valid: false, errors: ["Yüklenen dosya geçerli bir JSON objesi değil."], warnings }
  }

  const data = raw as Record<string, unknown>

  if (!Array.isArray(data.categories)) {
    errors.push("'categories' listesi bulunamadı veya bir dizi formatında değil.")
  }

  if (!Array.isArray(data.products)) {
    errors.push("'products' listesi bulunamadı veya bir dizi formatında değil.")
  }

  if (errors.length > 0) {
    return { valid: false, errors, warnings }
  }

  const categories = data.categories as Record<string, unknown>[]
  const products = data.products as Record<string, unknown>[]

  if (categories.length === 0) {
    errors.push("Menü yedeğinde en az 1 kategori bulunmalıdır.")
  }

  const categoryIds = new Set<string>()

  categories.forEach((cat, index) => {
    const idxStr = `Kategori #${index + 1}`
    if (!cat.ad_tr || typeof cat.ad_tr !== "string" || cat.ad_tr.trim() === "") {
      errors.push(`${idxStr}: Türkçe kategori adı ('ad_tr') zorunludur.`)
    }
    const catId = typeof cat.id === "string" && cat.id.trim() ? cat.id.trim() : `cat-${index + 1}`
    categoryIds.add(catId)
  })

  products.forEach((prod, index) => {
    const prodName = typeof prod.ad_tr === "string" && prod.ad_tr.trim() ? `"${prod.ad_tr}"` : `Ürün #${index + 1}`

    if (!prod.ad_tr || typeof prod.ad_tr !== "string" || prod.ad_tr.trim() === "") {
      errors.push(`${prodName}: Türkçe ürün adı ('ad_tr') zorunludur.`)
    }

    if (prod.fiyat === undefined || prod.fiyat === null || isNaN(Number(prod.fiyat)) || Number(prod.fiyat) < 0) {
      errors.push(`${prodName}: Geçerli bir fiyat ('fiyat') tanımlanmalıdır.`)
    }

    const catId = typeof prod.kategori_id === "string" ? prod.kategori_id : ""
    if (!catId || !categoryIds.has(catId)) {
      warnings.push(`${prodName}: Kategori ID ('${catId}') listedeki kategorilerle eşleşmiyor. Varsayılan ilk kategoriye atanacaktır.`)
    }
  })

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats: {
      category_count: categories.length,
      product_count: products.length
    }
  }
}

/**
 * Mevcut menüyü standart yedekleme paketi olarak dışa aktarır.
 */
export async function exportMenuData(): Promise<MenuBackupPayload> {
  const store = await getMenuStore()
  const sortedCategories = [...store.categories].sort((a, b) => (a.sira || 0) - (b.sira || 0))

  return {
    version: "1.0",
    system: "yali-qr-menu",
    exported_at: new Date().toISOString(),
    stats: {
      category_count: sortedCategories.length,
      product_count: store.products.length
    },
    categories: sortedCategories,
    products: store.products
  }
}

/**
 * Kullanıcıların sıfırdan menü oluşturabilmesi için örnek şablon verisi döndürür.
 */
export function getMenuTemplate(): MenuBackupPayload {
  return {
    version: "1.0",
    system: "yali-qr-menu",
    exported_at: new Date().toISOString(),
    stats: {
      category_count: 2,
      product_count: 3
    },
    categories: [
      {
        id: "cat-ornek-ana-yemekler",
        ad_tr: "Ana Yemekler",
        ad_en: "Main Dishes",
        sira: 1,
        created_at: new Date().toISOString()
      },
      {
        id: "cat-ornek-icecekler",
        ad_tr: "Soğuk İçecekler",
        ad_en: "Cold Drinks",
        sira: 2,
        created_at: new Date().toISOString()
      }
    ],
    products: [
      {
        id: "prod-ornek-kofte",
        kategori_id: "cat-ornek-ana-yemekler",
        ad_tr: "Izgara Kasap Köfte",
        ad_en: "Grilled Meatballs",
        aciklama_tr: "Günün taze garnitürleri ve pilav eşliğinde servis edilir.",
        aciklama_en: "Served with fresh daily side dishes and rice.",
        fiyat: 380,
        porsiyonlar: [
          { id: "opt-1", ad_tr: "1 Porsiyon (200g)", ad_en: "1 Portion (200g)", fiyat: 380 },
          { id: "opt-2", ad_tr: "1.5 Porsiyon (300g)", ad_en: "1.5 Portion (300g)", fiyat: 520 }
        ],
        gorsel_url: "https://images.unsplash.com/photo-1529042410759-befb1204b468?w=600&auto=format&fit=crop&q=60",
        ozellikler: {
          alerjenler: ["Gluten"],
          hazirlama_suresi: "15 dk",
          sef_onerisi: true
        },
        aktif: true,
        created_at: new Date().toISOString()
      },
      {
        id: "prod-ornek-ayran",
        kategori_id: "cat-ornek-icecekler",
        ad_tr: "Yayık Ayran",
        ad_en: "Traditional Ayran",
        aciklama_tr: "Taze nane yaprakları ile.",
        aciklama_en: "With fresh mint leaves.",
        fiyat: 60,
        porsiyonlar: [],
        gorsel_url: "https://images.unsplash.com/photo-1626803775151-61d756612f97?w=600&auto=format&fit=crop&q=60",
        ozellikler: {
          alerjenler: ["Laktoz"]
        },
        aktif: true,
        created_at: new Date().toISOString()
      }
    ]
  }
}

/**
 * Bir yedek dosyasından menüyü sisteme yükler (Restore / Migration).
 * @param rawData Yüklenen JSON verisi
 * @param mode 'replace' (tüm mevcut menüyü temizle ve yeni veriyle değiştir) | 'merge' (mevcudu koru, eşleşenleri güncelle, yenileri ekle)
 */
export async function importMenuData(
  rawData: unknown,
  mode: "replace" | "merge" = "replace"
): Promise<{ success: boolean; stats: { categories: number; products: number }; message: string }> {
  const validation = validateMenuImportData(rawData)
  if (!validation.valid) {
    throw new Error(`Menü doğrulama hatası:\n${validation.errors.join("\n")}`)
  }

  const payload = rawData as { categories: Partial<Category>[]; products: Partial<Product>[] }
  const store = await getMenuStore()

  // 1. Kategorileri Formatla ve Temizle
  const normalizedCategories: Category[] = payload.categories.map((c, idx) => ({
    id: String(c.id || `cat-${Date.now()}-${idx + 1}`),
    ad_tr: String(c.ad_tr || "Kategori").trim(),
    ad_en: String(c.ad_en || c.ad_tr || "Category").trim(),
    sira: Number(c.sira ?? idx + 1),
    created_at: c.created_at || new Date().toISOString()
  }))

  const validCategoryIds = new Set(normalizedCategories.map((c) => c.id))
  const fallbackCategoryId = normalizedCategories[0]?.id || "default-cat"

  // 2. Ürünleri Formatla ve Temizle
  const normalizedProducts: Product[] = payload.products.map((p, idx) => {
    let targetCatId = String(p.kategori_id || "")
    if (!validCategoryIds.has(targetCatId)) {
      targetCatId = fallbackCategoryId
    }

    return {
      id: String(p.id || `prod-${Date.now()}-${idx + 1}-${Math.random().toString(36).substring(2, 6)}`),
      kategori_id: targetCatId,
      ad_tr: String(p.ad_tr || "Yeni Ürün").trim(),
      ad_en: String(p.ad_en || p.ad_tr || "New Product").trim(),
      aciklama_tr: String(p.aciklama_tr || "").trim(),
      aciklama_en: String(p.aciklama_en || "").trim(),
      fiyat: Number(p.fiyat || 0),
      porsiyonlar: Array.isArray(p.porsiyonlar) ? p.porsiyonlar : [],
      gorsel_url: String(p.gorsel_url || ""),
      ozellikler: p.ozellikler && typeof p.ozellikler === "object" ? (p.ozellikler as Product["ozellikler"]) : {},
      aktif: p.aktif !== false,
      created_at: p.created_at || new Date().toISOString()
    }
  })

  let finalCategories: Category[]
  let finalProducts: Product[]

  if (mode === "replace") {
    // Tam yenileme (Sıfırdan veritabanı veya sunucu kurulumu)
    finalCategories = normalizedCategories
    finalProducts = normalizedProducts
  } else {
    // Birleştirme (Merge / Upsert)
    const catMap = new Map<string, Category>()
    store.categories.forEach((c) => catMap.set(c.id, c))
    normalizedCategories.forEach((c) => {
      catMap.set(c.id, { ...(catMap.get(c.id) || {}), ...c })
    })
    finalCategories = Array.from(catMap.values()).sort((a, b) => a.sira - b.sira)

    const prodMap = new Map<string, Product>()
    store.products.forEach((p) => prodMap.set(p.id, p))
    normalizedProducts.forEach((p) => {
      prodMap.set(p.id, { ...(prodMap.get(p.id) || {}), ...p })
    })
    finalProducts = Array.from(prodMap.values())
  }

  // 3. Kalıcı Hafızaya Kaydet (Redis & File)
  const newStore: MenuStoreData = {
    categories: finalCategories,
    products: finalProducts
  }
  await persistMenuStore(newStore)

  // 4. Supabase Bağlantısı Varsa Tablolara Toplu Senkronizasyon Yap
  try {
    const supabase = await createClient()
    if (supabase) {
      if (mode === "replace") {
        // İlgili tabloları temizle
        await supabase.from("products").delete().neq("id", "00000000-0000-0000-0000-000000000000")
        await supabase.from("categories").delete().neq("id", "00000000-0000-0000-0000-000000000000")
      }

      // Kategorileri upsert et
      if (finalCategories.length > 0) {
        await supabase.from("categories").upsert(
          finalCategories.map((c) => ({
            id: c.id,
            ad_tr: c.ad_tr,
            ad_en: c.ad_en,
            sira: c.sira
          }))
        )
      }

      // Ürünleri upsert et
      if (finalProducts.length > 0) {
        await supabase.from("products").upsert(
          finalProducts.map((p) => ({
            id: p.id,
            kategori_id: p.kategori_id,
            ad_tr: p.ad_tr,
            ad_en: p.ad_en,
            aciklama_tr: p.aciklama_tr,
            aciklama_en: p.aciklama_en,
            fiyat: p.fiyat,
            gorsel_url: p.gorsel_url,
            ozellikler: p.ozellikler,
            aktif: p.aktif
          }))
        )
      }
    }
  } catch (dbError) {
    console.warn("Supabase import sync notice (non-fatal, store persisted to Redis/File):", dbError)
  }

  return {
    success: true,
    stats: {
      categories: finalCategories.length,
      products: finalProducts.length
    },
    message:
      mode === "replace"
        ? `Menü başarıyla sıfırlandı ve yüklendi (${finalCategories.length} kategori, ${finalProducts.length} ürün).`
        : `Menü başarıyla birleştirildi (${finalCategories.length} kategori, ${finalProducts.length} ürün).`
  }
}
