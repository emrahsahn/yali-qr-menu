/**
 * 2-Hour Virtual QR Session Manager
 * Controls physical QR access to the digital menu.
 */

export const QR_ACCESS_DURATION_MS = 2 * 60 * 60 * 1000 // 2 hours (120 minutes)
export const QR_STORAGE_KEY = "yali_qr_access_timestamp"
export const QR_COOKIE_NAME = "yali_qr_access"

/**
 * Checks if the user currently has an active 2-hour QR scan session.
 */
export function isQrSessionValid(): boolean {
  if (typeof window === "undefined") return false

  try {
    const rawTimestamp = localStorage.getItem(QR_STORAGE_KEY)
    if (!rawTimestamp) return false

    const timestamp = parseInt(rawTimestamp, 10)
    if (isNaN(timestamp)) return false

    const now = Date.now()
    const diff = now - timestamp

    // Check if session is within 2 hours
    if (diff >= 0 && diff < QR_ACCESS_DURATION_MS) {
      return true
    }

    // Expired: clean up
    clearQrSession()
    return false
  } catch {
    return false
  }
}

/**
 * Grants a new 2-hour access session (called immediately after scanning QR).
 */
export function grantQrSession(): void {
  if (typeof window === "undefined") return

  try {
    const now = Date.now()
    localStorage.setItem(QR_STORAGE_KEY, now.toString())

    // Also set 2-hour cookie (7200 seconds)
    document.cookie = `${QR_COOKIE_NAME}=true; path=/; max-age=7200; SameSite=Lax`
  } catch (e) {
    console.error("Failed to store QR session:", e)
  }
}

/**
 * Clears the QR access session.
 */
export function clearQrSession(): void {
  if (typeof window === "undefined") return

  try {
    localStorage.removeItem(QR_STORAGE_KEY)
    document.cookie = `${QR_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`
  } catch (e) {
    console.error("Failed to clear QR session:", e)
  }
}

/**
 * Calculates remaining session minutes.
 */
export function getRemainingQrSessionMinutes(): number {
  if (typeof window === "undefined") return 0

  try {
    const raw = localStorage.getItem(QR_STORAGE_KEY)
    if (!raw) return 0
    const timestamp = parseInt(raw, 10)
    if (isNaN(timestamp)) return 0

    const elapsed = Date.now() - timestamp
    const remainingMs = QR_ACCESS_DURATION_MS - elapsed
    if (remainingMs <= 0) return 0

    return Math.ceil(remainingMs / (60 * 1000))
  } catch {
    return 0
  }
}
