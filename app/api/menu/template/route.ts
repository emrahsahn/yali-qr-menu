import { NextResponse } from "next/server"
import { getMenuTemplate } from "@/lib/data/menu-store"

export async function GET() {
  try {
    const templateData = getMenuTemplate()
    const fileName = "yali_menu_sablon.json"
    const jsonString = JSON.stringify(templateData, null, 2)

    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store, max-age=0"
      }
    })
  } catch (error) {
    console.error("Menu Template Export Error:", error)
    return NextResponse.json({ error: "Şablon dosyası oluşturulamadı." }, { status: 500 })
  }
}
