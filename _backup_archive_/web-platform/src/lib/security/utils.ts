import sanitizeHtml from "sanitize-html";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
let lastCleanedAt = Date.now();
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // clean up every 5 minutes

type RateLimitConfig = {
  limit: number;
  windowMs: number;
};

export function rateLimit(
  key: string,
  config: RateLimitConfig = { limit: 60, windowMs: 60_000 }
): { success: boolean; remaining: number } {
  const now = Date.now();

  // Periodic cleanup of expired rate-limit records to prevent memory leak
  if (now - lastCleanedAt > CLEANUP_INTERVAL_MS) {
    for (const [k, v] of rateLimitMap.entries()) {
      if (now > v.resetAt) {
        rateLimitMap.delete(k);
      }
    }
    lastCleanedAt = now;
  }

  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + config.windowMs });
    return { success: true, remaining: config.limit - 1 };
  }

  if (entry.count >= config.limit) {
    return { success: false, remaining: 0 };
  }

  entry.count += 1;
  return { success: true, remaining: config.limit - entry.count };
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function sanitizeText(text: string): string {
  if (!text) return "";
  return sanitizeHtml(text, {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();
}

export function sanitizeRichText(html: string): string {
  if (!html) return "";
  return sanitizeHtml(html, {
    allowedTags: [
      "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "p", "a", "ul", "ol",
      "nl", "li", "ins", "del", "strong", "em", "code", "pre", "hr", "br", "div",
      "span", "table", "thead", "tbody", "tr", "th", "td"
    ],
    allowedAttributes: {
      a: ["href", "name", "target", "rel"],
      span: ["style"],
      div: ["style"],
      p: ["style"]
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
  });
}
