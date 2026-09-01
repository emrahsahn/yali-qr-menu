import fs from "fs"
import path from "path"
import { Category, Product } from "@/lib/types/database"

interface MenuStoreData {
  categories: Category[];
  products: Product[];
}

const MENU_FILE_PATH = path.join(process.cwd(), "data", "menu.json")

// Global in-memory cache across requests & serverless hot-reloads
declare global {
  // eslint-disable-next-line no-var
  var __yaliMenuData: MenuStoreData | undefined;
}

function loadInitialData(): MenuStoreData {
  try {
    if (fs.existsSync(MENU_FILE_PATH)) {
      const fileContent = fs.readFileSync(MENU_FILE_PATH, "utf-8")
      const parsed = JSON.parse(fileContent)
      if (parsed.categories && parsed.products) {
        return parsed
      }
    }
  } catch (error) {
    console.warn("Could not read menu.json from disk, using defaults:", error)
  }

  // Fallback defaults
  return {
    categories: [],
    products: []
  }
}

export function getMenuStore(): MenuStoreData {
  if (!globalThis.__yaliMenuData) {
    globalThis.__yaliMenuData = loadInitialData()
  }
  return globalThis.__yaliMenuData
}

export function persistMenuStore(data: MenuStoreData): boolean {
  globalThis.__yaliMenuData = data
  try {
    const dir = path.dirname(MENU_FILE_PATH)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(MENU_FILE_PATH, JSON.stringify(data, null, 2), "utf-8")
    return true
  } catch (error) {
    console.warn("Notice: File write skipped or failed (common in serverless/Vercel read-only runtime):", error)
    return true // In-memory state remains updated
  }
}

export function getProducts(includeInactive = false): Product[] {
  const store = getMenuStore()
  if (includeInactive) {
    return store.products
  }
  return store.products.filter((p) => p.aktif !== false)
}

export function getCategories(): Category[] {
  const store = getMenuStore()
  return store.categories.sort((a, b) => a.sira - b.sira)
}

export function saveProduct(productData: Partial<Product>): Product {
  const store = getMenuStore()
  let product: Product

  if (productData.id) {
    // Update existing
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
    // Create new
    product = {
      id: "prod-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
      kategori_id: productData.kategori_id || store.categories[0]?.id || "cat-1",
      ad_tr: productData.ad_tr || "Yeni Ürün",
      ad_en: productData.ad_en || "New Product",
      aciklama_tr: productData.aciklama_tr || "",
      aciklama_en: productData.aciklama_en || "",
      fiyat: Number(productData.fiyat || 0),
      gorsel_url: productData.gorsel_url || "",
      ozellikler: productData.ozellikler || {},
      aktif: productData.aktif !== false,
      created_at: new Date().toISOString()
    }
    store.products.push(product)
  }

  persistMenuStore(store)
  return product
}

export function toggleProductActive(productId: string): Product | null {
  const store = getMenuStore()
  const product = store.products.find((p) => p.id === productId)
  if (!product) return null

  product.aktif = !product.aktif
  persistMenuStore(store)
  return product
}

export function deleteProduct(productId: string): boolean {
  const store = getMenuStore()
  const initialLength = store.products.length
  store.products = store.products.filter((p) => p.id !== productId)
  if (store.products.length !== initialLength) {
    persistMenuStore(store)
    return true
  }
  return false
}

export function saveCategory(categoryData: Partial<Category>): Category {
  const store = getMenuStore()
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

  persistMenuStore(store)
  return category
}

export function deleteCategory(categoryId: string): boolean {
  const store = getMenuStore()
  const initialLength = store.categories.length
  store.categories = store.categories.filter((c) => c.id !== categoryId)
  if (store.categories.length !== initialLength) {
    // Also remove products under this category
    store.products = store.products.filter((p) => p.kategori_id !== categoryId)
    persistMenuStore(store)
    return true
  }
  return false
}
