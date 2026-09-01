import { QrMenuView } from "@/components/menu/qr-menu-view"
import { getCategories, getProducts } from "@/lib/data/menu-store"

export const dynamic = "force-dynamic"
export const revalidate = 0

export const metadata = {
  title: "Yalı Restaurant | Dijital QR Menü",
  description: "Yalı Restaurant seçkin lezzetler ve dijital menü."
}

export default function RestaurantPage() {
  const categories = getCategories()
  const products = getProducts(true)

  return <QrMenuView initialCategories={categories} initialProducts={products} />
}
