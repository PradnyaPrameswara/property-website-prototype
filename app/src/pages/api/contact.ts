/**
 * POST /api/contact — contact pages v1–v3 (ContactForm island).
 * Fields mirror the raw Webflow form: First/Last Name, Email, Phone,
 * Service, Message. Validates and acknowledges; wire a real mail/CRM
 * integration at deploy time (guide 2.6).
 */
import type { APIRoute } from "astro";
import { z } from "astro:content";

import { EMAIL_RE, badRequest, methodNotAllowed, ok, parseJson } from "@/lib/forms";

const contactSchema = z.object({
  "First Name": z.string().trim().min(1, "First name is required"),
  "Last Name": z.string().trim().default(""),
  Email: z.string().trim().regex(EMAIL_RE, "A valid email is required"),
  Phone: z.string().trim().default(""),
  Service: z.string().trim().default(""),
  Message: z.string().trim().min(1, "Message is required"),
});

/**
 * Server-rendered: prerendered (static) endpoints cannot receive POST —
 * Astro's router answers 400 before the handler runs. Requires an SSR
 * adapter at build time (or swap the fetch URL for a form backend).
 */
export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const body = await parseJson(request, contactSchema);

  if (!body) return badRequest("First name, a valid email, and a message are required");

  console.info(
    `[api/contact] ${body["First Name"]} ${body["Last Name"]} <${body.Email}> phone=${body.Phone} service=${body.Service} message=${body.Message.length} chars`,
  );

  return ok();
};

export const GET: APIRoute = () => methodNotAllowed();
