# Form delivery configuration

Contact V1–V3, Request a Quote, and Newsletter use the Astro Node SSR adapter.
They **do not send email by default**. GitHub Pages is static-only and
cannot host the form POST endpoints.

Configure these server-side environment variables on an SSR-capable host:

- `FORM_WEBHOOK_URL`: HTTPS endpoint accepting a JSON POST in the form
  `{ "type": "contact" | "quote" | "subscribe", "fields": { ... } }`.
- `FORM_WEBHOOK_TOKEN` (optional): a bearer token sent in the
  `Authorization` header. Keep it in deployment secrets, never in a
  `PUBLIC_` variable or the repository.

The receiver must authenticate requests, process or persist enquiries,
enforce newsletter consent/unsubscribe rules, and manage delivery or CRM
retries. A 2xx response means only that the receiver accepted the
request; the API replies with `{ "ok": true, "accepted": true }`.
This is **not** proof of inbox delivery or contact creation.

If no webhook is configured, valid submissions receive 503. Invalid or
oversized requests receive 400. Receiver errors and timeouts receive 502.
The UI keeps user input on error; no submitted personal details are logged.

Baseline anti-spam controls:

- A visually hidden `website` honeypot field is validated on the server.
  Filled traps are acknowledged without forwarding data to the receiver.
- JSON request reads are capped at 32 KiB, including chunked requests,
  and server-side field limits match the visible form restrictions.
- Production still requires distributed rate limiting or appropriate bot
  protection at the edge, provider-side abuse controls, and a clear
  newsletter consent policy. A honeypot is not sufficient protection alone.

## Verification and launch gate

Run `npm run test:forms` to test input validation, form traps,
receiver acknowledgement, receiver failure and missing configuration against
a simulated local webhook. This test makes no external delivery claim.

**Production form readiness remains blocked** until the operator provisions
an actual HTTPS receiver, configures its secret in the SSR deployment,
and verifies Contact, Quote and Newsletter submissions end-to-end at
controlled downstream recipients (including subscription consent and
unsubscribe behavior). Record the provider, hosting environment, date
and test results without committing credentials or personal information.

The original Webflow HTML/CSS is immutable until visual parity is separately
reviewed and certified.
