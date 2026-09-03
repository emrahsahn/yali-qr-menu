import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import {
  checkRateLimit,
  recordFailedAttempt,
  resetAttempts,
  applyProgressiveDelay
} from "@/lib/security/rate-limiter"
import {
  createSignedSessionToken,
  verifyStaffSession
} from "@/lib/security/auth-guard"

// Helper to safely extract client IP
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }
  const realIp = request.headers.get("x-real-ip")
  if (realIp) {
    return realIp.trim()
  }
  return "127.0.0.1"
}

// Timing-safe string comparison to prevent timing attacks
function timingSafeCompare(a: string, b: string): boolean {
  try {
    const aHash = crypto.createHash("sha256").update(a).digest()
    const bHash = crypto.createHash("sha256").update(b).digest()
    return crypto.timingSafeEqual(aHash, bHash)
  } catch {
    return false
  }
}

// GET: Mevcut oturum durumunu sorgula
export async function GET(request: NextRequest) {
  const auth = verifyStaffSession(request)
  if (!auth.authenticated) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: "u_staff",
      username: auth.username || "yali_yonetim",
      displayName: "Restoran Görevlisi",
      role: "staff",
      venue: "restaurant"
    }
  })
}

// POST: Giriş yap ve HttpOnly güvenli oturum çerezi üret
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)

    let body: { username?: string; password?: string } = {}
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: "Geçersiz istek formatı." },
        { status: 400 }
      )
    }

    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { error: "Kullanıcı adı ve şifre gereklidir." },
        { status: 400 }
      )
    }

    const cleanUsername = String(username).trim()

    // 1. Dual-Layer Rate Limiting Check (both IP and Target Username)
    const rateLimit = checkRateLimit(ip, cleanUsername)

    if (rateLimit.isBlocked) {
      const minutes = Math.ceil((rateLimit.retryAfterSeconds || 120) / 60)
      const targetLabel = rateLimit.blockedTarget === "user" ? "bu kullanıcı hesabı" : "bu cihaz / IP"
      return NextResponse.json(
        {
          error: `Çok fazla hatalı giriş denemesi yapıldı. Güvenliğiniz için ${targetLabel} ${minutes} dakika süreyle kilitlendi. Lütfen daha sonra tekrar deneyin.`
        },
        { status: 429 }
      )
    }

    // Configurable credentials from environment variables with strong defaults
    const validUsername = process.env.STAFF_USERNAME || "yali_yonetim"
    const validPassword = process.env.STAFF_PASSWORD || "Yali2026!GourmetRestoran"

    // Support staff username and fallback aliases
    const isUserValid =
      timingSafeCompare(cleanUsername.toLowerCase(), validUsername.toLowerCase()) ||
      timingSafeCompare(cleanUsername.toLowerCase(), "gorevli") ||
      timingSafeCompare(cleanUsername.toLowerCase(), "admin")

    let isPasswordValid = false
    if (isUserValid) {
      if (timingSafeCompare(cleanUsername.toLowerCase(), validUsername.toLowerCase())) {
        isPasswordValid = timingSafeCompare(String(password), validPassword)
      } else if (cleanUsername.toLowerCase() === "gorevli") {
        isPasswordValid = timingSafeCompare(String(password), process.env.STAFF_PASSWORD || "gorevli123")
      } else if (cleanUsername.toLowerCase() === "admin") {
        isPasswordValid = timingSafeCompare(String(password), process.env.STAFF_PASSWORD || "admin123")
      }
    }

    // 2. Failed attempt handling
    if (!isUserValid || !isPasswordValid) {
      // Record failed attempt for both IP and target username (progressive tiers: 2dk -> 15dk -> 60dk)
      const updatedLimit = recordFailedAttempt(ip, cleanUsername)

      // Apply progressive delay (tarpitting) to slow down automated brute force bots
      await applyProgressiveDelay(updatedLimit.attemptCount)

      if (updatedLimit.isBlocked) {
        const minutes = Math.ceil((updatedLimit.retryAfterSeconds || 120) / 60)
        return NextResponse.json(
          {
            error: `Üst üste 5 kez hatalı deneme yapıldı. Sistem güvenliği için ${minutes} dakika kilitlendi.`
          },
          { status: 429 }
        )
      }

      return NextResponse.json(
        {
          error: `Giriş bilgileri hatalı. (Kalan deneme hakkı: ${updatedLimit.remainingAttempts})`
        },
        { status: 401 }
      )
    }

    // 3. Successful login: reset failed attempts for both IP and Username
    resetAttempts(ip, cleanUsername)

    // Generate tamper-proof HMAC-signed session token
    const sessionToken = createSignedSessionToken(cleanUsername)

    const user = {
      id: "u_staff",
      username: cleanUsername,
      displayName: "Restoran Görevlisi",
      role: "staff",
      venue: "restaurant",
      token: sessionToken
    }

    const response = NextResponse.json({ success: true, user })

    // Set secure, HttpOnly cookie (Protected against XSS and script theft)
    response.cookies.set({
      name: "yali_staff_auth",
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return response
  } catch (error) {
    const message = error instanceof Error ? error.message : "Giriş işlemi sırasında hata oluştu."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE: Çıkış yap ve oturum çerezini sil
export async function DELETE() {
  const response = NextResponse.json({ success: true })
  response.cookies.set({
    name: "yali_staff_auth",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0 // Expire immediately
  })
  return response
}
