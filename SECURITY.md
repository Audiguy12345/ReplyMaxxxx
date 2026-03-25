# ReplyMax Security Notes

## What Is Protected In Code Right Now

- Rate limiting is enforced on the generation endpoint to reduce abuse and cost spikes.
- Browser-origin checks reject requests from origins outside the configured allowlist.
- User input is sanitized and screened for prompt-injection style instructions before being sent to the model.
- Response headers include baseline browser security controls such as `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and HSTS.
- Environment files are gitignored by default, except for `.env.local.example`.
- The OpenAI API key stays server-side only and is not exposed to client code.

## Exposed Server Endpoints

Current public backend surface:
- `POST /api/generate`

Current risk posture:
- This endpoint is intentionally public because the app has no auth yet.
- Cost protection currently depends on server-side rate limits and origin checks.
- In-memory rate limiting works for a single process, but for production scale you should move this to Redis, Upstash, Vercel KV, Cloudflare, or another shared store.

## Secrets And API Keys

Findings in this workspace:
- Real API keys exist in the local `.env.local` file.
- `.env.local` is ignored by git, so it should not be committed under the current repo rules.
- No hardcoded production API key was found in tracked app source files.

Required next action:
- Rotate any OpenAI or Gemini key that has ever been pasted into logs, screenshots, chats, or committed history.
- Keep real secrets only in local env files and your deployment provider's encrypted secret store.

## Encryption Expectations

What this repo can and cannot do:
- Environment variables are server-side values. They should never be sent to the browser unless prefixed with `NEXT_PUBLIC_`.
- Encryption in transit for app traffic is provided by HTTPS/TLS at your hosting layer, not by application code.
- Encryption at rest for secrets is handled by your hosting provider or secret manager, not by this Next.js repo.

Current app scope:
- There is no user login flow yet.
- There is no password storage yet.
- There is no billing form or direct card collection yet.
- If you add auth later, passwords must be hashed with Argon2id or bcrypt before storage.
- If you add billing later, use Stripe Checkout or Elements so raw card data never touches your server.

## Webhook Protection

There is no webhook route in the app yet.

When you add one:
- Require the provider signature header, such as `Stripe-Signature`.
- Verify the signature with the raw request body and `STRIPE_WEBHOOK_SECRET`.
- Reject unsigned requests with `400`.
- Log webhook event IDs to prevent replay handling.
- Return success only after idempotent processing.

## DNS And Domain Protection

These controls must be done in your DNS or registrar, not in code:
- Enable DNSSEC if your DNS provider supports it.
- Turn on registrar lock for the domain.
- Add CAA records so only approved certificate authorities can issue TLS certs.
- If you send email from your domain, configure SPF, DKIM, and DMARC.
- Limit who can modify DNS records and require MFA on registrar and hosting accounts.

## Recommended Production Follow-Up

- Move rate limiting to a shared backing store.
- Add authentication before exposing higher-cost or higher-risk actions.
- Add webhook signature verification when Stripe webhooks are introduced.
- Keep deploying behind HTTPS only.
- Rotate the existing local API keys now because they were exposed in the local workspace and terminal session.