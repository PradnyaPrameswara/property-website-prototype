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
    headers: { "Content-Type": "application/json" },
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
export async function parseJson<T>(request: Request, schema: z.ZodType<T>): Promise<T | null> {
  // Limit streaming reads even if Content-Length is missing or incorrect.
  const maxBytes = 32 * 1024;
  const contentLength = Number(request.headers.get("content-length") ?? 0);

  if (!Number.isFinite(contentLength) || contentLength > maxBytes) return null;

  const reader = request.body?.getReader();

  if (!reader) return null;

  try {
    const chunks: Uint8Array[] = [];
    let byteLength = 0;

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      byteLength += value.byteLength;

      if (byteLength > maxBytes) {
        await reader.cancel();

        return null;
      }

      chunks.push(value);
    }

    const bytes = new Uint8Array(byteLength);
    let offset = 0;

    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }

    const parsed = schema.safeParse(JSON.parse(new TextDecoder().decode(bytes)));

    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

