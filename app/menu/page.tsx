import { QrMenuView } from "@/components/menu/qr-menu-view"
import { getCategories, getProducts } from "@/lib/data/menu-store"

export const dynamic = "force-dynamic"
export const revalidate = 0

export const metadata = {
  title: "Yalı Restaurant | Dijital QR Menü",
  description: "Yalı Restaurant seçkin lezzetler, başlangıçlar, ana yemekler ve tatlılar dijital menüsü."
}

export default async function MenuPage() {
  const categories = await getCategories()
  const products = await getProducts(true)

  return <QrMenuView initialCategories={categories} initialProducts={products} />
}
