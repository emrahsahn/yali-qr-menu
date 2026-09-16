import { NextRequest, NextResponse } from "next/server"
import { importMenuData, validateMenuImportData } from "@/lib/data/menu-store"
import { verifyStaffSession } from "@/lib/security/auth-guard"

export async function POST(request: NextRequest) {
  try {
    const auth = verifyStaffSession(request)
    if (!auth.authenticated) {
      return NextResponse.json(
        { error: "Yetkisiz işlem. Menü yüklemek için görevli/yönetici girişi gereklidir." },
        { status: 401 }
      )
    }

    const contentType = request.headers.get("content-type") || ""
    let payload: unknown
    let mode: "replace" | "merge" = "replace"
    let dryRun = false

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData()
      const file = formData.get("file") as File | null
      const requestedMode = formData.get("mode") as string | null
      const requestedDryRun = formData.get("dryRun") as string | null

      if (requestedMode === "merge") mode = "merge"
      if (requestedDryRun === "true") dryRun = true

      if (!file) {
        return NextResponse.json({ error: "Lütfen bir JSON menü dosyası seçiniz." }, { status: 400 })
      }

      const fileText = await file.text()
      try {
        payload = JSON.parse(fileText)
      } catch {
        return NextResponse.json(
          { error: "Yüklenen dosya geçerli bir JSON formatında değil." },
          { status: 400 }
        )
      }
    } else {
      const body = await request.json()
      payload = body.data || body
      if (body.mode === "merge") mode = "merge"
      if (body.dryRun === true) dryRun = true
    }

    // 1. Şema Doğrulaması (Validation)
    const validation = validateMenuImportData(payload)
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          errors: validation.errors,
          warnings: validation.warnings,
          stats: validation.stats
        },
        { status: 422 }
      )
    }

    // 2. Sadece Ön-izleme / Dry Run ise kaydetmeden istatistik dön
    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        stats: validation.stats,
        warnings: validation.warnings,
        message: "Dosya formatı geçerli. Yüklemeye hazır."
      })
    }

    // 3. Gerçek Yükleme ve Senkronizasyon (Execute Import)
    const result = await importMenuData(payload, mode)

    return NextResponse.json({
      success: true,
      stats: result.stats,
      warnings: validation.warnings,
      message: result.message
    })
  } catch (error) {
    console.error("Menu Import Error:", error)
    const message = error instanceof Error ? error.message : "Menü yüklenirken beklenmedik bir hata oluştu."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
