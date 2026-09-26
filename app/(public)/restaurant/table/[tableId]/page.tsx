import { QrMenuView } from "@/components/menu/qr-menu-view"
import { getCategories, getProducts } from "@/lib/data/menu-store"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function TablePage() {
  const categories = await getCategories()
  // Müşterinin menüde tükenmiş (pasif) ürünleri de 'Tükendi' olarak görmesi istendiği için true gönderilir
  const products = await getProducts(true)

  return <QrMenuView initialCategories={categories} initialProducts={products} />
}
