/**
 * Server-only form delivery. The webhook must be provisioned at deployment.
 * A 2xx acknowledgement from the receiver is required before showing success.
 * No personal form details are logged by this application.
 */
import { json } from "@/lib/forms";

type FormKind = "contact" | "quote" | "subscribe";

export async function deliverForm(kind: FormKind, payload: Record<string, string>): Promise<Response> {
  const endpoint = process.env.FORM_WEBHOOK_URL;

  if (!endpoint) {
    return json({ ok: false, error: "Form delivery is not configured" }, 503);
  }

  let url: URL;

  try {
    url = new URL(endpoint);
  } catch {
    return json({ ok: false, error: "Form delivery is not configured" }, 503);
  }

  const local = url.hostname === "127.0.0.1" || url.hostname === "localhost";

  if (url.protocol !== "https:" && !(local && url.protocol === "http:")) {
    return json({ ok: false, error: "Form delivery is not configured" }, 503);
  }

  const token = process.env.FORM_WEBHOOK_TOKEN;

  const headers = new Headers({ "Content-Type": "application/json" });

  if (token) headers.set("Authorization", "Bearer " + token);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ type: kind, fields: payload }),
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      return json({ ok: false, error: "Form delivery failed" }, 502);
    }

    return json({ ok: true, delivered: true });
  } catch {
    return json({ ok: false, error: "Form delivery failed" }, 502);
  }
}
