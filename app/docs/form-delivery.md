# Form delivery configuration

The Contact V1–V3, Request a Quote, and Newsletter forms run on the
Astro Node SSR adapter. They **do not send email by default**.

Set server-side environment variables:

- \`FORM_WEBHOOK_URL\`: HTTPS endpoint that accepts a POST with JSON body
  \`{ "type": "contact" | "quote" | "subscribe", "fields": { ... } }\`.
- \`FORM_WEBHOOK_TOKEN\` (optional): secret sent as \`Authorization: Bearer ...\`.
  Keep it in deployment secrets, never in \`PUBLIC_\` variables.

The receiver must handle authentication, storage/email or CRM delivery,
privacy/consent and anti-spam policies appropriate for production. Test
delivery to a controlled recipient before launch. A 2xx receiver response
means receipt has been acknowledged, not necessarily that email was delivered
to a recipient's inbox.

If no webhook is configured, valid submissions return HTTP **503** and
display a failure message; invalid submissions return **400**. Webhook
errors/timeouts return **502**. The application no longer logs submitted
personal details or shows success for unconfigured delivery.

The original Webflow pages remain read-only references. Production deployment
requires an SSR-capable host; static-only GitHub Pages cannot run POST routes.

Run \`npm run test:forms\` to exercise invalid, configured, unconfigured
and receiver-failure scenarios using a local simulated receiver.

## Production safeguards

- Browser requests must send `Content-Type: application/json`. When an Origin header is present it must match the application origin. Request JSON bodies are capped at 16 KiB and validated against their endpoint schemas.
- Server delivery rejects receiver redirects, requires a successful receiver response, and uses an eight-second timeout. A positive response means *accepted*, not confirmed email inbox delivery.
- Use `npm run check:forms-production -- --strict` in the deployment pipeline to require a valid HTTPS URL and server-only token. CI exercises this check with dummy values; it does not claim a live receiver is configured.
- Configure spam/rate limiting and retention rules at the deployment edge and receiving service. Do not store secrets in the source or log visitor PII.
- Deployment verification must use a controlled address and record receiver-side acknowledgement separately from actual email/CRM processing.
