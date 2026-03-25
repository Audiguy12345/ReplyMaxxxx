import type { NextRequest } from "next/server";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
};

declare global {
  var __replymaxRateLimitStore: Map<string, RateLimitEntry> | undefined;
}

const rateLimitStore = globalThis.__replymaxRateLimitStore ?? new Map<string, RateLimitEntry>();

globalThis.__replymaxRateLimitStore = rateLimitStore;

const PROMPT_INJECTION_PATTERNS = [
  /ignore(?: all| any| the)?(?: previous| prior)? instructions/i,
  /system prompt/i,
  /developer message/i,
  /<\s*(system|assistant|developer)\s*>/i,
  /reveal (?:your|the) (?:prompt|instructions|policies)/i,
  /act as (?:a|an) /i,
  /you are chatgpt/i,
  /override (?:the )?(?:rules|instructions|policy)/i,
];

export function getClientIp(req: NextRequest) {
  const forwardedFor = req.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return req.headers.get("x-real-ip") || "unknown";
}

export function applyRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();

  for (const [entryKey, entry] of rateLimitStore.entries()) {
    if (entry.resetAt <= now) {
      rateLimitStore.delete(entryKey);
    }
  }

  const existing = rateLimitStore.get(key);

  if (!existing || existing.resetAt <= now) {
    const next: RateLimitEntry = {
      count: 1,
      resetAt: now + windowMs,
    };

    rateLimitStore.set(key, next);

    return {
      allowed: true,
      limit,
      remaining: Math.max(limit - 1, 0),
      resetAt: next.resetAt,
      retryAfterSeconds: Math.ceil(windowMs / 1000),
    };
  }

  existing.count += 1;
  rateLimitStore.set(key, existing);

  const remaining = Math.max(limit - existing.count, 0);

  return {
    allowed: existing.count <= limit,
    limit,
    remaining,
    resetAt: existing.resetAt,
    retryAfterSeconds: Math.max(
      1,
      Math.ceil((existing.resetAt - now) / 1000)
    ),
  };
}

export function getRateLimitHeaders(result: RateLimitResult) {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.floor(result.resetAt / 1000)),
    "Retry-After": String(result.retryAfterSeconds),
  };
}

export function isAllowedOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");

  if (!origin) {
    return true;
  }

  const allowedOrigins = new Set(
    [
      req.nextUrl.origin,
      process.env.ALLOWED_ORIGIN,
      process.env.NEXT_PUBLIC_SITE_URL,
    ].filter((value): value is string => Boolean(value))
  );

  return allowedOrigins.has(origin);
}

export function sanitizeUserText(value: string, maxLength: number) {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\r\n?/g, "\n")
    .trim()
    .slice(0, maxLength);
}

export function hasPromptInjectionSignals(values: Array<string | undefined>) {
  return values.some((value) => {
    if (!value) {
      return false;
    }

    return PROMPT_INJECTION_PATTERNS.some((pattern) => pattern.test(value));
  });
}