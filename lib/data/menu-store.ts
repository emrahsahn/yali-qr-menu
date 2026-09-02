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
}

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
  const redis = getRedisClient()

  // 1. Upstash Redis (Vercel KV)
  if (redis) {
    try {
      const data = await redis.get<MenuStoreData | string>("yali_menu_data_v1")
      if (data) {
        const parsed = typeof data === "string" ? JSON.parse(data) : data
        if (parsed && Array.isArray(parsed.categories) && Array.isArray(parsed.products) && parsed.products.length > 0) {
          globalThis.__yaliMenuData = parsed
          return parsed
        }
      }
      // If Redis is fresh and empty, auto-seed with local initial menu data
      const defaultData = getLocalFileDefaults()
      if (defaultData.products.length > 0) {
        await redis.set("yali_menu_data_v1", defaultData)
        globalThis.__yaliMenuData = defaultData
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
