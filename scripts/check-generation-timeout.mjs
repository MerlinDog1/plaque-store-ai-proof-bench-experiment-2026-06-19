import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import http from 'node:http';
import { setTimeout as delay } from 'node:timers/promises';
import {
  generateGeminiContent, GeminiGenerationTimeoutError, formatGeminiProxyError,
  validateGeminiGenerateContentRequest,
} from '../server/geminiProxy.mjs';
import { TEXT_GENERATION_TIMEOUT_MS, TEXT_PROXY_TIMEOUT_MS } from '../services/geminiTiming.mjs';
import { PLAQUE_TEXT_MODEL } from '../services/aiModels.mjs';

const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url)));
const platformMs = config.functions['api/index.mjs'].maxDuration * 1000;
assert.ok(TEXT_GENERATION_TIMEOUT_MS > 30_000);
assert.ok(TEXT_GENERATION_TIMEOUT_MS + 5_000 <= platformMs, 'Room to send a safe error before platform termination');
assert.ok(TEXT_PROXY_TIMEOUT_MS > platformMs, 'Browser leaves time for the platform response');

const payload = {
  model: PLAQUE_TEXT_MODEL,
  contents: 'Return the synthetic QA wording unchanged: TEST PLAQUE',
  config: {
    responseMimeType: 'application/json',
    responseSchema: { type: 'OBJECT', properties: { refinedText: { type: 'STRING' } }, required: ['refinedText'] },
  },
};
const validated = validateGeminiGenerateContentRequest(payload);
const expected = { text: '{"refinedText":"TEST PLAQUE"}' };
let signal;
const immediate = { models: { generateContent: async request => {
  signal = request.config.abortSignal;
  assert.equal(request.model, PLAQUE_TEXT_MODEL);
  assert.equal(request.config.thinkingConfig.thinkingLevel, 'MEDIUM');
  assert.equal(request.config.maxOutputTokens, 16_384);
  return expected;
} } };
assert.equal(await generateGeminiContent(immediate, validated, { timeoutMs: 30 }), expected);
await delay(40);
assert.equal(signal.aborted, false, 'Successful requests have no leftover deadline');

let upstreamCancelled = false;
const hanging = { models: { generateContent: request => new Promise((resolve, reject) => {
  request.config.abortSignal.addEventListener('abort', () => {
    upstreamCancelled = true;
    reject(new DOMException('Aborted', 'AbortError'));
  }, { once: true });
}) } };
await assert.rejects(generateGeminiContent(hanging, validated, { timeoutMs: 20 }), GeminiGenerationTimeoutError);
assert.equal(upstreamCancelled, true);
const ignoringAbort = { models: { generateContent: () => new Promise(() => {}) } };
await assert.rejects(generateGeminiContent(ignoringAbort, validated, { timeoutMs: 20 }), GeminiGenerationTimeoutError);
const formatted = formatGeminiProxyError(new GeminiGenerationTimeoutError(), 'synthetic-timeout');
assert.equal(formatted.statusCode, 504);
assert.equal(formatted.payload.code, 'generation_timeout');
assert.equal(formatted.payload.retryable, false);

const upstreamError = new Error('Synthetic provider failure');
await assert.rejects(generateGeminiContent({ models: { generateContent: async () => { throw upstreamError; } } }, validated), error => error === upstreamError);
const imageRequest = { model: 'synthetic-image', config: {} };
assert.equal(await generateGeminiContent({ models: { generateContent: request => {
  assert.equal(request, imageRequest, 'Image configuration is untouched');
  return expected;
} } }, { operation: 'image-generation', request: imageRequest }), expected);
assert.throws(() => validateGeminiGenerateContentRequest({ ...payload, config: { ...payload.config, abortSignal: {} } }), /unsupported field/);
assert.throws(() => validateGeminiGenerateContentRequest({ ...payload, config: { ...payload.config, httpOptions: { timeout: 999999 } } }), /unsupported field/);
console.log('Deadline ordering, cancellation, timer cleanup, no hidden retry, input ownership and unchanged quality/image settings passed.');

// Real API handler and real installed SDK, with only the upstream network mocked.
// Takes 31s: reproduces the original boundary without any API charge or user data.
const fetchOriginal = globalThis.fetch;
let upstreamCalls = 0;
let server;
process.env.VERCEL = '1';
process.env.NODE_ENV = 'production';
process.env.GEMINI_PUBLIC_PROXY_ENABLED = 'true';
process.env.GEMINI_API_KEY = 'synthetic-not-a-real-key';
process.env.API_KEY = '';
process.env.GOOGLE_API_KEY = '';
globalThis.fetch = async (url, options) => {
  assert.match(String(url), /^https:\/\/generativelanguage\.googleapis\.com\//, 'No unexpected external network');
  upstreamCalls++;
  assert.ok(options.signal, 'Installed SDK receives the abort signal');
  const request = JSON.parse(options.body);
  assert.equal(request.generationConfig.thinkingConfig.thinkingLevel, 'MEDIUM');
  assert.equal(request.generationConfig.maxOutputTokens, 16_384);
  await delay(31_000, undefined, { signal: options.signal });
  return new Response(JSON.stringify({ candidates: [{ content: { role: 'model', parts: [{ text: expected.text }] } }] }), { headers: { 'content-type': 'application/json' } });
};
try {
  const { default: handler } = await import('../api/index.mjs');
  server = http.createServer(handler);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = `127.0.0.1:${server.address().port}`;
  const started = Date.now();
  const response = await fetchOriginal(`http://${address}/api/gemini/generate-content`, {
    method: 'POST',
    headers: { origin: `https://${address}`, 'sec-fetch-site': 'same-origin', 'x-vercel-forwarded-for': '192.0.2.50', 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await response.json();
  assert.equal(response.status, 200, JSON.stringify(body));
  assert.equal(body.text, expected.text);
  assert.equal(upstreamCalls, 1);
  const elapsed = Date.now() - started;
  assert.ok(elapsed > 30_000);
  console.log(`Actual API + SDK: delayed response accepted after ${elapsed}ms with exactly one upstream call (mocked, not a hosted release).`);
} finally {
  globalThis.fetch = fetchOriginal;
  if (server) {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
}
