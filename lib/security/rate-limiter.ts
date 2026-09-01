interface AttemptRecord {
  count: number;
  firstAttemptTime: number;
  blockedUntil: number | null;
}

// In-memory IP tracking store across server requests
const ipAttempts = new Map<string, AttemptRecord>();

const MAX_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export interface RateLimitStatus {
  isBlocked: boolean;
  remainingAttempts: number;
  retryAfterSeconds?: number;
}

export function checkRateLimit(ip: string): RateLimitStatus {
  const now = Date.now();
  const record = ipAttempts.get(ip);

  if (!record) {
    return { isBlocked: false, remainingAttempts: MAX_ATTEMPTS };
  }

  // Check if currently blocked
  if (record.blockedUntil && record.blockedUntil > now) {
    const retryAfterSeconds = Math.ceil((record.blockedUntil - now) / 1000);
    return {
      isBlocked: true,
      remainingAttempts: 0,
      retryAfterSeconds
    };
  }

  // If window has passed, reset record
  if (now - record.firstAttemptTime > ATTEMPT_WINDOW_MS) {
    ipAttempts.delete(ip);
    return { isBlocked: false, remainingAttempts: MAX_ATTEMPTS };
  }

  const remaining = Math.max(0, MAX_ATTEMPTS - record.count);
  return {
    isBlocked: remaining <= 0,
    remainingAttempts: remaining
  };
}

export function recordFailedAttempt(ip: string): RateLimitStatus {
  const now = Date.now();
  let record = ipAttempts.get(ip);

  if (!record || now - record.firstAttemptTime > ATTEMPT_WINDOW_MS) {
    record = {
      count: 1,
      firstAttemptTime: now,
      blockedUntil: null
    };
  } else {
    record.count += 1;
  }

  if (record.count >= MAX_ATTEMPTS) {
    record.blockedUntil = now + BLOCK_DURATION_MS;
    ipAttempts.set(ip, record);
    return {
      isBlocked: true,
      remainingAttempts: 0,
      retryAfterSeconds: Math.ceil(BLOCK_DURATION_MS / 1000)
    };
  }

  ipAttempts.set(ip, record);
  return {
    isBlocked: false,
    remainingAttempts: MAX_ATTEMPTS - record.count
  };
}

export function resetAttempts(ip: string): void {
  ipAttempts.delete(ip);
}
