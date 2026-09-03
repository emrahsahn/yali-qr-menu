interface AttemptRecord {
  count: number;
  firstAttemptTime: number;
  blockedUntil: number | null;
  tier: number; // 0 = 2 min, 1 = 15 min, 2 = 60 min
}

// In-memory tracking stores for both IP and normalized Username
const ipAttempts = new Map<string, AttemptRecord>();
const userAttempts = new Map<string, AttemptRecord>();

const MAX_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes window for attempts

// Kademeli Kilitleme Süreleri (Progressive Lockout Durations):
// 1. Kilit: 2 dakika (Şifresini unutan yetkiliyi uzun süre mağdur etmez)
// 2. Kilit: 15 dakika (Israrlı denemelerde caydırıcı kilit)
// 3. Kilit ve sonrası: 60 dakika (1 saat - brute-force botlarını tamamen devre dışı bırakır)
const LOCKOUT_DURATIONS_MS = [
  2 * 60 * 1000,   // Tier 0: 2 dakika
  15 * 60 * 1000,  // Tier 1: 15 dakika
  60 * 60 * 1000   // Tier 2: 60 dakika
];

// Gecikmeli Yanıt (Tarpitting / Exponential Delay):
// Her hatalı şifrede sunucu cevabı yapay olarak geciktirerek botların hızını keser
const PROGRESSIVE_DELAYS_MS = [
  0,     // 0. deneme: gecikme yok
  500,   // 1. hatalı deneme: 0.5 saniye
  1500,  // 2. hatalı deneme: 1.5 saniye
  3000,  // 3. hatalı deneme: 3 saniye
  5000,  // 4. hatalı deneme: 5 saniye
  8000   // 5. hatalı deneme: 8 saniye
];

export interface RateLimitStatus {
  isBlocked: boolean;
  remainingAttempts: number;
  retryAfterSeconds?: number;
  blockedTarget?: "ip" | "user";
  attemptCount: number;
}

function checkSingleTarget(map: Map<string, AttemptRecord>, key: string): {
  isBlocked: boolean;
  remaining: number;
  retryAfterSeconds: number;
  attemptCount: number;
} {
  const now = Date.now();
  const record = map.get(key);

  if (!record) {
    return { isBlocked: false, remaining: MAX_ATTEMPTS, retryAfterSeconds: 0, attemptCount: 0 };
  }

  // Check if currently locked out
  if (record.blockedUntil && record.blockedUntil > now) {
    const retryAfterSeconds = Math.ceil((record.blockedUntil - now) / 1000);
    return {
      isBlocked: true,
      remaining: 0,
      retryAfterSeconds,
      attemptCount: record.count
    };
  }

  // Reset window if expired (and not currently blocked)
  if (now - record.firstAttemptTime > ATTEMPT_WINDOW_MS && !record.blockedUntil) {
    map.delete(key);
    return { isBlocked: false, remaining: MAX_ATTEMPTS, retryAfterSeconds: 0, attemptCount: 0 };
  }

  const remaining = Math.max(0, MAX_ATTEMPTS - record.count);
  return {
    isBlocked: remaining <= 0,
    remaining,
    retryAfterSeconds: 0,
    attemptCount: record.count
  };
}

export function checkRateLimit(ip: string, username?: string): RateLimitStatus {
  // 1. Check IP
  const ipStatus = checkSingleTarget(ipAttempts, ip);
  if (ipStatus.isBlocked) {
    return {
      isBlocked: true,
      remainingAttempts: 0,
      retryAfterSeconds: ipStatus.retryAfterSeconds,
      blockedTarget: "ip",
      attemptCount: ipStatus.attemptCount
    };
  }

  // 2. Check Username if provided
  if (username) {
    const cleanUser = username.trim().toLowerCase();
    const userStatus = checkSingleTarget(userAttempts, cleanUser);
    if (userStatus.isBlocked) {
      return {
        isBlocked: true,
        remainingAttempts: 0,
        retryAfterSeconds: userStatus.retryAfterSeconds,
        blockedTarget: "user",
        attemptCount: userStatus.attemptCount
      };
    }

    const minRemaining = Math.min(ipStatus.remaining, userStatus.remaining);
    const maxCount = Math.max(ipStatus.attemptCount, userStatus.attemptCount);
    return {
      isBlocked: minRemaining <= 0,
      remainingAttempts: minRemaining,
      attemptCount: maxCount
    };
  }

  return {
    isBlocked: false,
    remainingAttempts: ipStatus.remaining,
    attemptCount: ipStatus.attemptCount
  };
}

function recordSingleTarget(map: Map<string, AttemptRecord>, key: string): {
  isBlocked: boolean;
  remaining: number;
  retryAfterSeconds: number;
  attemptCount: number;
} {
  const now = Date.now();
  let record = map.get(key);

  if (!record || (now - record.firstAttemptTime > ATTEMPT_WINDOW_MS && !record.blockedUntil)) {
    record = {
      count: 1,
      firstAttemptTime: now,
      blockedUntil: null,
      tier: record ? record.tier : 0
    };
  } else {
    record.count += 1;
  }

  if (record.count >= MAX_ATTEMPTS) {
    const durationMs = LOCKOUT_DURATIONS_MS[Math.min(record.tier, LOCKOUT_DURATIONS_MS.length - 1)];
    record.blockedUntil = now + durationMs;
    // Next time this entity gets blocked, advance to next tier (longer lockout)
    record.tier = Math.min(record.tier + 1, LOCKOUT_DURATIONS_MS.length - 1);
    map.set(key, record);

    return {
      isBlocked: true,
      remaining: 0,
      retryAfterSeconds: Math.ceil(durationMs / 1000),
      attemptCount: record.count
    };
  }

  map.set(key, record);
  return {
    isBlocked: false,
    remaining: MAX_ATTEMPTS - record.count,
    retryAfterSeconds: 0,
    attemptCount: record.count
  };
}

export function recordFailedAttempt(ip: string, username?: string): RateLimitStatus {
  const ipResult = recordSingleTarget(ipAttempts, ip);
  let userResult = { isBlocked: false, remaining: MAX_ATTEMPTS, retryAfterSeconds: 0, attemptCount: 0 };

  if (username) {
    const cleanUser = username.trim().toLowerCase();
    userResult = recordSingleTarget(userAttempts, cleanUser);
  }

  const isBlocked = ipResult.isBlocked || userResult.isBlocked;
  const retryAfterSeconds = Math.max(ipResult.retryAfterSeconds, userResult.retryAfterSeconds);
  const remainingAttempts = Math.max(0, Math.min(ipResult.remaining, userResult.remaining));
  const attemptCount = Math.max(ipResult.attemptCount, userResult.attemptCount);

  return {
    isBlocked,
    remainingAttempts,
    retryAfterSeconds,
    blockedTarget: userResult.isBlocked ? "user" : "ip",
    attemptCount
  };
}

// Applies artificial progressive delay (tarpitting) to slow down brute force scripts
export async function applyProgressiveDelay(failedAttemptCount: number): Promise<number> {
  const delayMs = PROGRESSIVE_DELAYS_MS[Math.min(failedAttemptCount, PROGRESSIVE_DELAYS_MS.length - 1)] || 0;
  if (delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  return delayMs;
}

export function resetAttempts(ip: string, username?: string): void {
  ipAttempts.delete(ip);
  if (username) {
    const cleanUser = username.trim().toLowerCase();
    userAttempts.delete(cleanUser);
  }
}
