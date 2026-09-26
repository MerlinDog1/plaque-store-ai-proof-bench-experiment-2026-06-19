// Explicit opt-in review server: compiled UI + the existing site's AI API only.
// No credentials, order/database routes, or production deployment changes.
import { preview } from 'vite';
import { fileURLToPath } from 'node:url';
import {
  MAX_GEMINI_REQUEST_BYTES,
  createGeminiRateLimiter,
  hasAllowedGeminiBrowserHeaders,
  validateGeminiGenerateContentRequest,
} from '../server/geminiProxy.mjs';

if (process.env.ENABLE_LIVE_AI_REVIEW !== 'true') {
  throw new Error('Set ENABLE_LIVE_AI_REVIEW=true to authorise real AI requests.');
}
const upstream = 'https://instaplaque.co.uk';
const limiter = createGeminiRateLimiter({ limit: 20 });
const send = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
};

await preview({
  configFile: false,
  root: fileURLToPath(new URL('../', import.meta.url)),
  preview: { host: '127.0.0.1', port: Number(process.env.PORT || 4196), strictPort: true, allowedHosts: ['.trycloudflare.com'] },
  plugins: [{
    name: 'ai-only-review',
    configurePreviewServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = new URL(req.url, 'http://localhost').pathname;
        if (!pathname.startsWith('/api/')) return next();
        const health = pathname === '/api/gemini/health' && req.method === 'GET';
        const generate = pathname === '/api/gemini/generate-content' && req.method === 'POST';
        if (!health && !generate) return send(res, 503, { error: 'This review supports AI only. Saving, checkout and other backend operations are disabled.' });
        try {
          let body;
          if (generate) {
            if (!hasAllowedGeminiBrowserHeaders(req, { deployed: true })) return send(res, 403, { error: 'Use the preview page to submit AI instructions.' });
            const chunks = [];
            let bytes = 0;
            for await (const chunk of req) {
              bytes += chunk.length;
              if (bytes > MAX_GEMINI_REQUEST_BYTES) return send(res, 413, { error: 'AI request is too large.' });
              chunks.push(chunk);
            }
            const payload = JSON.parse(Buffer.concat(chunks).toString('utf8'));
            const validated = validateGeminiGenerateContentRequest(payload);
            if (!limiter.consume('shared-preview', validated.cost).ok) return send(res, 429, { error: 'Preview AI limit reached. Wait a minute and try again.' });
            // The upstream applies its own canonicalization. Forward the validated
            // browser shape, not the SDK shape (which injects maxOutputTokens).
            body = JSON.stringify(payload);
          }
          // Deliberately do not forward client cookies, auth, host or IP headers.
          const response = await fetch(upstream + pathname, {
            method: req.method,
            headers: { 'Content-Type': 'application/json', Origin: upstream, 'Sec-Fetch-Site': 'same-origin' },
            body,
            signal: AbortSignal.timeout(180_000),
            redirect: 'error',
          });
          const data = await response.json();
          send(res, response.status, data);
        } catch (error) {
          const status = error instanceof SyntaxError ? 400 : Number(error.statusCode || 502);
          send(res, status, { error: status === 400 ? 'Invalid AI request.' : 'The AI review request failed. Please try again.' });
        }
      });
    },
  }],
});
console.log('AI-only review listening on loopback. Real AI requests enabled; other APIs blocked.');
