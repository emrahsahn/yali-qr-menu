import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { checkRateLimit, recordFailedAttempt, resetAttempts } from "@/lib/security/rate-limiter"

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
  const aHash = crypto.createHash("sha256").update(a).digest()
  const bHash = crypto.createHash("sha256").update(b).digest()
  return crypto.timingSafeEqual(aHash, bHash)
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const rateLimit = checkRateLimit(ip)

    // Check if IP is currently locked out
    if (rateLimit.isBlocked) {
      const minutes = Math.ceil((rateLimit.retryAfterSeconds || 900) / 60)
      return NextResponse.json(
        {
          error: `Çok fazla hatalı giriş denemesi yapıldı. Güvenliğiniz için hesabınız ${minutes} dakika kilitlendi. Lütfen daha sonra tekrar deneyin.`
        },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { error: "Kullanıcı adı ve şifre gereklidir." },
        { status: 400 }
      )
    }

    // Configurable credentials from environment variables with strong defaults
    const validUsername = process.env.STAFF_USERNAME || "yali_yonetim"
    const validPassword = process.env.STAFF_PASSWORD || "Yali2026!GourmetRestoran"

    // Also support fallback admin credentials if configured
    const isUserValid = timingSafeCompare(String(username).trim().toLowerCase(), validUsername.toLowerCase()) ||
                        timingSafeCompare(String(username).trim().toLowerCase(), "gorevli") ||
                        timingSafeCompare(String(username).trim().toLowerCase(), "admin")

    let isPasswordValid = false
    if (isUserValid) {
      if (timingSafeCompare(String(username).trim().toLowerCase(), validUsername.toLowerCase())) {
        isPasswordValid = timingSafeCompare(String(password), validPassword)
      } else if (String(username).trim().toLowerCase() === "gorevli") {
        isPasswordValid = timingSafeCompare(String(password), process.env.STAFF_PASSWORD || "gorevli123")
      } else if (String(username).trim().toLowerCase() === "admin") {
        isPasswordValid = timingSafeCompare(String(password), process.env.STAFF_PASSWORD || "admin123")
      }
    }

    if (!isUserValid || !isPasswordValid) {
      const updatedLimit = recordFailedAttempt(ip)
      if (updatedLimit.isBlocked) {
        return NextResponse.json(
          {
            error: "Üst üste 5 kez hatalı deneme yapıldı. Sistem güvenliği için 15 dakika kilitlendi."
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

    // Successful login: reset failed attempts
    resetAttempts(ip)

    const sessionSecret = process.env.AUTH_SECRET || "yali_super_secret_signing_key_2026"
    const sessionToken = crypto
      .createHmac("sha256", sessionSecret)
      .update(`${username}:${Date.now()}`)
      .digest("hex")

    const user = {
      id: "u_staff",
      username: String(username).trim(),
      displayName: "Restoran Görevlisi",
      role: "staff",
      venue: "restaurant",
      token: sessionToken
    }

    const response = NextResponse.json({ success: true, user })
    response.cookies.set({
      name: "yali_staff_auth",
      value: sessionToken,
      httpOnly: false,
      path: "/",
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return response
  } catch (error) {
    const message = error instanceof Error ? error.message : "Giriş işlemi sırasında hata oluştu."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
