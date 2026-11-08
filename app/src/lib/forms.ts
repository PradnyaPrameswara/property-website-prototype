/**
 * Shared helpers for the /api/* form endpoints (guide 2.6, Phase 5).
 * Endpoints work under `astro dev` and any SSR deployment; on a pure static
 * host the POST is not servable and the islands fall back to their error
 * state — swap the fetch URL for a form backend (Formspree etc.) at deploy.
 * Bodies are parsed with zod schemas at the I/O boundary (see endpoints).
 */
import type { z } from "astro:content";

/** Concrete JSON payload shape for endpoint responses. */
type JsonPayload = Record<string, string | number | boolean>;

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function json(payload: JsonPayload, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

export function ok(): Response {
  return json({ ok: true });
}

export function badRequest(error: string): Response {
  return json({ ok: false, error }, 400);
}

/** Lets static builds prerender the route; POST stays the runtime handler. */
export function methodNotAllowed(): Response {
  return json({ ok: false, error: "Method not allowed" }, 405);
}

/**
 * Parses the request body against a zod schema at the I/O boundary.
 * Returns null when the body is not valid JSON or fails validation.
 */
const MAX_FORM_BYTES = 16 * 1024;

export async function parseJson<T>(request: Request, schema: z.ZodType<T>): Promise<T | null> {
  try {
    if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") return null;

    const origin = request.headers.get("origin");

    if (origin && new URL(origin).origin !== new URL(request.url).origin) return null;

    const contentLength = request.headers.get("content-length");

    if (contentLength && (!/^\\d+$/.test(contentLength) || Number(contentLength) > MAX_FORM_BYTES)) return null;

    const reader = request.body?.getReader();

    if (!reader) return null;

    const decoder = new TextDecoder("utf-8", { fatal: true });

    let total = 0;

    let body = "";

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      total += value.byteLength;

      if (total > MAX_FORM_BYTES) {
        await reader.cancel();

        return null;
      }

      body += decoder.decode(value, { stream: true });
    }

    body += decoder.decode();

    const parsed = schema.safeParse(JSON.parse(body));

    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

