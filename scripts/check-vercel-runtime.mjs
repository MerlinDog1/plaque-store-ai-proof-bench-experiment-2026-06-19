import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const config = JSON.parse(readFileSync(new URL("vercel.json", root), "utf8"));

// Vercel disables require(ESM) unless explicitly enabled. Exercise the actual
// API entry point with that default and our deployed Node options applied.
// https://vercel.com/docs/functions/runtimes/node-js/advanced-node-configuration
const result = spawnSync(process.execPath, [
  "--no-experimental-require-module",
  ...(config.env?.NODE_OPTIONS || "").split(/\s+/u).filter(Boolean),
  "--input-type=module",
  "-e",
  `
    import assert from 'node:assert/strict';
    import http from 'node:http';
    const { default: handler } = await import('./api/index.mjs');
    const { sanitizeSvgMarkup } = await import('./services/svgSanitizer.mjs');
    const clean = sanitizeSvgMarkup('<svg viewBox="0 0 150 50"><script>alert(1)</script><text x="75" y="25">Renée &amp; José</text></svg>');
    assert.ok(clean.includes('Renée &amp; José'));
    assert.ok(!clean.includes('<script'));
    const server = http.createServer(handler);
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    try {
      for (const path of ['/api/gemini/health', '/api/supabase/health', '/api/stripe/config']) {
        const response = await fetch('http://127.0.0.1:' + server.address().port + path);
        assert.equal(response.status, 200, path);
        await response.json();
      }
    } finally {
      server.closeAllConnections();
      await new Promise(resolve => server.close(resolve));
    }
  `,
], {
  cwd: fileURLToPath(root),
  env: { ...process.env, VERCEL: "1", NODE_ENV: "production" },
  encoding: "utf8",
  timeout: 30_000,
});

assert.equal(result.status, 0, result.error?.message || result.stderr || result.stdout);
console.log("Vercel runtime: API boots, SVG sanitization and all three health routes pass.");
