/**
 * POST /api/subscribe — footer newsletter form (SubscribeForm island).
 * Validates the email and acknowledges; wire a real ESP (Mailchimp, …)
 * at deploy time (guide 2.6).
 */
import type { APIRoute } from "astro";
import { z } from "astro:content";

import { EMAIL_RE, badRequest, methodNotAllowed, ok, parseJson } from "@/lib/forms";

const subscribeSchema = z.object({
  email: z.string().trim().regex(EMAIL_RE, "A valid email is required"),
});

/**
 * Server-rendered: prerendered (static) endpoints cannot receive POST —
 * Astro's router answers 400 before the handler runs. Requires an SSR
 * adapter at build time (or swap the fetch URL for a form backend).
 */
export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const body = await parseJson(request, subscribeSchema);

  if (!body) return badRequest("A valid email is required");

  console.info(`[api/subscribe] new subscriber: ${body.email}`);

  return ok();
};

export const GET: APIRoute = () => methodNotAllowed();
