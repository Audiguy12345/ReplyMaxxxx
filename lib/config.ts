export const FREE_GENERATIONS = 3;
export const STORAGE_KEY = "replymax_free_generations_used";
export const CHECKOUT_URL =
  process.env.NEXT_PUBLIC_STRIPE_CHECKOUT_URL || "";
export const RATE_LIMIT_WINDOW_MS = Number(
  process.env.RATE_LIMIT_WINDOW_MS || 60_000
);
export const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX || 5);