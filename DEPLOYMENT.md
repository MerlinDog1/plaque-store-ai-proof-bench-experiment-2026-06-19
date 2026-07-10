# Deployment Preview

## Managed Preview Services

The current local/public preview is managed by user systemd services:

- `plaque-store-ai.service` runs `node server.mjs` on `http://127.0.0.1:4179/`, serving the production build in `dist/` and proxying Gemini requests through `/api/gemini/*`.
- `plaque-store-ai-tunnel.service` exposes that local server through Cloudflare Tunnel.

Useful commands:

```bash
systemctl --user status plaque-store-ai.service plaque-store-ai-tunnel.service
journalctl --user -u plaque-store-ai-tunnel.service -n 80 --no-pager
```

## Current Public Preview

`https://polo-vic-consumer-nomination.trycloudflare.com`

## Gemini Runtime

The Gemini key lives in ignored local env files such as `.env.local`.

Do not reintroduce Vite build-time key injection. The browser must call the same-origin Node proxy so `GEMINI_API_KEY` is never embedded in the static assets.

Cloudflare quick tunnels are suitable for prototype review only and do not carry an uptime guarantee.

## Checkout Storage and Origins

Production and Vercel checkout require `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and a working Supabase order table (or the durable legacy `proof_sessions` table). Checkout fails closed when a durable Supabase write is unavailable; it never writes orders to `/tmp` as a production fallback.

For isolated local development only, JSON order storage can be enabled explicitly with `ALLOW_LOCAL_ORDER_JSON_STORE=true`. Local Stripe return URLs likewise require `ALLOW_LOCAL_CHECKOUT_ORIGIN=true`. Both switches are ignored when `NODE_ENV=production` or `VERCEL` is set, and must remain unset in deployed environments.
