import { NextRequest, NextResponse } from "next/server"
import { exportMenuData } from "@/lib/data/menu-store"
import { verifyStaffSession } from "@/lib/security/auth-guard"

export async function GET(request: NextRequest) {
  try {
    const auth = verifyStaffSession(request)
    if (!auth.authenticated) {
      return NextResponse.json(
        { error: "Yetkisiz işlem. Menü yedeğini indirmek için görevli/yönetici girişi gereklidir." },
        { status: 401 }
      )
    }

    const backupData = await exportMenuData()

    // Dosya adı: yali_menu_backup_YYYY-MM-DD_HH-mm.json
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10)
    const timeStr = `${String(now.getHours()).padStart(2, "0")}-${String(now.getMinutes()).padStart(2, "0")}`
    const fileName = `yali_menu_backup_${dateStr}_${timeStr}.json`

    const jsonString = JSON.stringify(backupData, null, 2)

    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store, max-age=0"
      }
    })
  } catch (error) {
    console.error("Menu Backup Export Error:", error)
    const message = error instanceof Error ? error.message : "Menü yedeği oluşturulurken bir hata meydana geldi."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
