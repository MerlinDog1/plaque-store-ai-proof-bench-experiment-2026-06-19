import { GoogleGenAI } from "@google/genai";
import { PLAQUE_TEXT_MODEL, LEGACY_PLAQUE_TEXT_MODEL } from './aiModels.mjs';
import { TEXT_PROXY_TIMEOUT_MS, GENERATION_TIMEOUT_MESSAGE } from './geminiTiming.mjs';

type GenerateContentArgs = Parameters<GoogleGenAI["models"]["generateContent"]>[0];

const callGeminiProxy = async <T,>(path: string, payload: unknown): Promise<T> => {
  const model = (payload as GenerateContentArgs)?.model;
  const isText = model === PLAQUE_TEXT_MODEL || model === LEGACY_PLAQUE_TEXT_MODEL;
  const controller = new AbortController();
  const timer = isText ? setTimeout(() => controller.abort(), TEXT_PROXY_TIMEOUT_MS) : undefined;
  try {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const body = await response.json().catch(() => ({}));
    if (controller.signal.aborted) throw new Error(GENERATION_TIMEOUT_MESSAGE);
    if (!response.ok) {
      const timedOut = isText && response.status === 504;
      throw Object.assign(new Error(timedOut ? GENERATION_TIMEOUT_MESSAGE : body?.error || `Gemini proxy failed with HTTP ${response.status}`), {
        status: response.status,
        code: timedOut ? 'generation_timeout' : body?.code,
        retryable: timedOut ? false : body?.retryable,
      });
    }
    return body as T;
  } catch (error) {
    if (controller.signal.aborted) {
      throw Object.assign(new Error(GENERATION_TIMEOUT_MESSAGE), {
        status: 504, code: 'generation_timeout', retryable: false,
      });
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
};

const createBrowserProxyClient = () => ({
  models: {
    generateContent: (args: GenerateContentArgs) =>
      callGeminiProxy<Awaited<ReturnType<GoogleGenAI["models"]["generateContent"]>>>(
        "/api/gemini/generate-content",
        args,
      ),
  },
});

export const getGeminiClient = (): GoogleGenAI => {
  if (typeof window !== "undefined") {
    return createBrowserProxyClient() as unknown as GoogleGenAI;
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY });
};

export const hasBrowserGeminiProxy = async (): Promise<boolean> => {
  if (typeof window === "undefined") return false;
  try {
    const response = await fetch("/api/gemini/health", { method: "GET" });
    const body = await response.json();
    return Boolean(response.ok && body?.enabled && body?.hasKey);
  } catch {
    return false;
  }
};
