import { test, expect } from "@playwright/test"

test.describe("Login Sayfası E2E Testleri", () => {
  test("Giriş sayfası formunu yüklemeli ve menü önizleme butonu olmamalı", async ({ page }) => {
    await page.goto("/login")

    // Logo ve başlık
    await expect(page.getByText("YALI RESTAURANT")).toBeVisible({ timeout: 15000 })
    await expect(page.getByText("GÖREVLİ & YÖNETİM PANELİ")).toBeVisible()
    await expect(page.getByPlaceholder("Kullanıcı adınız")).toBeVisible()
    await expect(page.getByPlaceholder("••••••••")).toBeVisible()

    // Menü önizleme butonu bulunmamalı (kaldırılmıştı)
    await expect(page.getByText("Müşteri QR Menüsünü Aç / Önizle")).toBeHidden()
  })
})
