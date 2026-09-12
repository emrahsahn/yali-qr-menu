import { test, expect } from "@playwright/test"

test.describe("Müşteri QR Menüsü E2E Testleri", () => {
  test("1. Yetkisiz doğrudan erişimde QR Kilit Ekranı görünmeli", async ({ page, context }) => {
    // Yeni temiz tarayıcı oturumu
    await context.clearCookies()
    await page.goto("/menu")
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
    await page.reload()

    // Kilit ekranı başlığı ve mesajı kontrolü
    await expect(page.getByText("MASA DOĞRULAMASI GEREKLİDİR")).toBeVisible({ timeout: 15000 })
    await expect(page.getByText(/menümüz sadece masalarımızdaki QR kod ile/i)).toBeVisible()
  })

  test("2. ?qr=yali parametresi ile oturum açılmalı ve menü yüklenmeli", async ({ page }) => {
    await page.goto("/menu?qr=yali")

    // Menü ana başlığı YALI görünmeli
    await expect(page.getByText("YALI", { exact: true })).toBeVisible({ timeout: 15000 })
  })

  test("3. Yalı logosuna tıklandığında yuvarlak büyütme modalı açılıp kapanmalı", async ({ page }) => {
    // Preloader'ı geçmek için session storage ayarla
    await page.addInitScript(() => {
      sessionStorage.setItem("yali_preloader_shown", "true")
    })
    await page.goto("/menu?qr=yali")

    // YALI logosu butonunu bul ve tıkla
    const logoButton = page.locator('button[title*="Yalı"]').first()
    await expect(logoButton).toBeVisible({ timeout: 15000 })
    await logoButton.click()

    // Dialog içinde büyük logo görseli açılmalı
    const zoomedLogo = page.getByAltText("Yalı Logo")
    await expect(zoomedLogo).toBeVisible({ timeout: 5000 })

    // Modala tıklayarak kapat
    await page.locator('[data-slot="dialog-content"]').click()
    await expect(zoomedLogo).toBeHidden({ timeout: 5000 })
  })

  test("4. Sayfa altındaki Geliştirici İmzası (LinkedIn ve Instagram) doğrulanmalı", async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem("yali_preloader_shown", "true")
    })
    await page.goto("/menu?qr=yali")
    await expect(page.getByText("YALI", { exact: true })).toBeVisible({ timeout: 15000 })

    // Sayfanın en altına kaydır
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))

    // Geliştirici bilgileri
    await expect(page.getByText("Yazılım & Tasarım")).toBeVisible({ timeout: 10000 })
    await expect(page.getByText("Emrah SAHIN")).toBeVisible()

    // LinkedIn Linki kontrolü
    const linkedinLink = page.locator('a[href*="linkedin.com/in/emrah"]')
    await expect(linkedinLink).toBeVisible()

    // Instagram Linki kontrolü
    const instagramLink = page.locator('a[href*="instagram.com/shn__emrah"]')
    await expect(instagramLink).toBeVisible()
  })
})
