/**
 * POST /api/quote — landing-pages/request-a-quote (QuoteForm island).
 * Contact fields + project-type radio + budget checkboxes, as in the raw
 * form. Validates the required identity fields and acknowledges; wire a
 * real mail/CRM integration at deploy time (guide 2.6).
 */
import type { APIRoute } from "astro";
import { z } from "astro:content";

import { EMAIL_RE, badRequest, methodNotAllowed, ok, parseJson } from "@/lib/forms";

const quoteSchema = z.object({
  Name: z.string().trim().min(1, "Name is required"),
  Email: z.string().trim().regex(EMAIL_RE, "A valid email is required"),
});

/**
 * Server-rendered: prerendered (static) endpoints cannot receive POST —
 * Astro's router answers 400 before the handler runs. Requires an SSR
 * adapter at build time (or swap the fetch URL for a form backend).
 */
export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const body = await parseJson(request, quoteSchema);

  if (!body) return badRequest("Name and a valid email are required");

  console.info(`[api/quote] ${body.Name} <${body.Email}>`);

  return ok();
};

export const GET: APIRoute = () => methodNotAllowed();
