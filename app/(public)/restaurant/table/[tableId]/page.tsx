import { QrMenuView } from "@/components/menu/qr-menu-view"
import { getCategories, getProducts } from "@/lib/data/menu-store"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function TablePage() {
  const categories = await getCategories()
  // Public QR menü pasif (gizli/tükenmiş) ürünleri asla görmemeli
  const products = await getProducts(false)

  return <QrMenuView initialCategories={categories} initialProducts={products} />
}
