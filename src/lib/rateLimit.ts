interface Entry {
  count: number;
  resetAt: number;
}

const store = new Map<string, Entry>();

/**
 * Cek apakah key sudah melebihi limit dalam window tertentu.
 * @param key      - identifier (misal: IP address)
 * @param limit    - maksimal request per window (default 5)
 * @param windowMs - durasi window dalam ms (default 60 detik)
 * @returns true jika rate limit terlampaui
 */
export function isRateLimited(
  key: string,
  limit = 5,
  windowMs = 60_000
): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  entry.count += 1;
  return entry.count > limit;
}

/** Ambil IP dari Next.js request headers */
export function getIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}
