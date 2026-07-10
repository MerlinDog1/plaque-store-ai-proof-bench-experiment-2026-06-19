import { isIP } from "node:net";

export const MAX_GEMINI_REQUEST_BYTES = 10 * 1024 * 1024;

const MAX_PROMPT_CHARS = 40_000;
const MAX_SYSTEM_INSTRUCTION_CHARS = 24_000;
const MAX_INLINE_DATA_CHARS = 8 * 1024 * 1024;
const MAX_TOTAL_INLINE_DATA_CHARS = 9 * 1024 * 1024;
const MAX_PARTS = 4;
const MAX_SCHEMA_DEPTH = 7;
const MAX_SCHEMA_NODES = 128;

const STRUCTURED_TEXT_MODEL = "gemini-3.5-flash";
const PROMPT_ENHANCEMENT_MODEL = "gemini-3-flash-preview";
const IMAGE_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const STANDARD_IMAGE_ASPECT_RATIOS = new Set([
  "1:1",
  "2:3",
  "3:2",
  "3:4",
  "4:3",
  "9:16",
  "16:9",
  "21:9",
]);
const EXTENDED_IMAGE_ASPECT_RATIOS = new Set([
  ...STANDARD_IMAGE_ASPECT_RATIOS,
  "4:1",
  "1:4",
  "8:1",
  "1:8",
]);
const IMAGE_MODEL_PROFILES = new Map([
  ["gemini-3-pro-image-preview", {
    contents: "text",
    sizeCosts: new Map([["1K", 6]]),
    aspectRatios: STANDARD_IMAGE_ASPECT_RATIOS,
    maxReferenceImages: 0,
    allowSafetySettings: false,
    allowHttpOptions: false,
    requireSafetySettings: false,
    requireHttpOptions: false,
  }],
  ["gemini-3.1-flash-image-preview", {
    contents: "parts",
    sizeCosts: new Map([["512px", 3], ["1K", 5], ["2K", 8], ["4K", 12]]),
    aspectRatios: EXTENDED_IMAGE_ASPECT_RATIOS,
    maxReferenceImages: 2,
    allowSafetySettings: true,
    allowHttpOptions: true,
    requireSafetySettings: false,
    requireHttpOptions: true,
  }],
  ["gemini-2.5-flash-image", {
    contents: "parts",
    sizeCosts: new Map([["1K", 4]]),
    aspectRatios: STANDARD_IMAGE_ASPECT_RATIOS,
    maxReferenceImages: 2,
    allowSafetySettings: true,
    allowHttpOptions: true,
    requireSafetySettings: true,
    requireHttpOptions: true,
  }],
]);
const SAFETY_CATEGORIES = new Set([
  "HARM_CATEGORY_HATE_SPEECH",
  "HARM_CATEGORY_DANGEROUS_CONTENT",
  "HARM_CATEGORY_SEXUALLY_EXPLICIT",
  "HARM_CATEGORY_HARASSMENT",
]);
const SCHEMA_TYPES = new Set(["STRING", "NUMBER", "INTEGER", "BOOLEAN", "ARRAY", "OBJECT"]);

export class GeminiProxyRequestError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "GeminiProxyRequestError";
    this.statusCode = statusCode;
  }
}

export const isDeployedGeminiEnvironment = (env = process.env) => (
  Boolean(env.VERCEL) || String(env.NODE_ENV || "").toLowerCase() === "production"
);

export const isGeminiPublicProxyEnabled = (env = process.env) => (
  isDeployedGeminiEnvironment(env)
    ? String(env.GEMINI_PUBLIC_PROXY_ENABLED || "").toLowerCase() === "true"
    : String(env.GEMINI_PUBLIC_PROXY_ENABLED || "true").toLowerCase() !== "false"
);

const normalizeIpAddress = (value) => {
  const candidate = String(value || "").split(",")[0].trim();
  const normalized = candidate.startsWith("::ffff:") ? candidate.slice(7) : candidate;
  return isIP(normalized) ? normalized : null;
};

export const getGeminiClientIdentity = (req, { vercel = Boolean(process.env.VERCEL) } = {}) => {
  if (vercel) return normalizeIpAddress(req?.headers?.["x-vercel-forwarded-for"]);
  return normalizeIpAddress(req?.socket?.remoteAddress);
};

export const hasAllowedGeminiBrowserHeaders = (
  req,
  { deployed = isDeployedGeminiEnvironment() } = {},
) => {
  const origin = String(req?.headers?.origin || "").trim();
  const fetchSite = String(req?.headers?.["sec-fetch-site"] || "").toLowerCase();
  const host = String(req?.headers?.host || "").toLowerCase();
  if (deployed && (!origin || fetchSite !== "same-origin" || !host)) return false;
  if (fetchSite === "cross-site") return false;
  if (!origin) return !deployed;
  try {
    const parsed = new URL(origin);
    if (deployed && parsed.protocol !== "https:") return false;
    return parsed.host.toLowerCase() === host;
  } catch {
    return false;
  }
};

const fail = (message) => {
  throw new GeminiProxyRequestError(message);
};

const isRecord = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);

const assertRecord = (value, label) => {
  if (!isRecord(value)) fail(`${label} must be an object.`);
  return value;
};

const assertExactKeys = (value, allowed, label) => {
  const unexpected = Object.keys(value).filter((key) => !allowed.has(key));
  if (unexpected.length) fail(`${label} contains unsupported field: ${unexpected[0]}.`);
};

const boundedString = (value, label, maxChars, { allowEmpty = false } = {}) => {
  if (typeof value !== "string") fail(`${label} must be a string.`);
  if (!allowEmpty && value.trim().length === 0) fail(`${label} must not be empty.`);
  if (value.length > maxChars) fail(`${label} is too large.`);
  return value;
};

const canonicalizeInlineData = (value, state) => {
  const inlineData = assertRecord(value, "contents.inlineData");
  assertExactKeys(inlineData, new Set(["data", "mimeType"]), "contents.inlineData");
  if (!IMAGE_MIME_TYPES.has(inlineData.mimeType)) fail("contents.inlineData has an unsupported image type.");
  const data = boundedString(inlineData.data, "contents.inlineData.data", MAX_INLINE_DATA_CHARS);
  if (data.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/u.test(data)) {
    fail("contents.inlineData.data must be base64 image data.");
  }
  state.inlineChars += data.length;
  if (state.inlineChars > MAX_TOTAL_INLINE_DATA_CHARS) fail("The combined inline image data is too large.");
  return { mimeType: inlineData.mimeType, data };
};

const canonicalizeContents = (value, { allowImages }) => {
  if (typeof value === "string") {
    return boundedString(value, "contents", MAX_PROMPT_CHARS);
  }

  const content = assertRecord(value, "contents");
  assertExactKeys(content, new Set(["parts"]), "contents");
  if (!Array.isArray(content.parts) || content.parts.length < 1 || content.parts.length > MAX_PARTS) {
    fail(`contents.parts must contain between 1 and ${MAX_PARTS} parts.`);
  }

  const state = { inlineChars: 0, textParts: 0, imageParts: 0 };
  const parts = content.parts.map((partValue) => {
    const part = assertRecord(partValue, "contents part");
    assertExactKeys(part, new Set(["text", "inlineData"]), "contents part");
    const keys = Object.keys(part);
    if (keys.length !== 1) fail("Each contents part must contain exactly one supported field.");
    if (Object.prototype.hasOwnProperty.call(part, "text")) {
      state.textParts += 1;
      return { text: boundedString(part.text, "contents part text", MAX_PROMPT_CHARS) };
    }
    if (!allowImages) fail("Inline images are not supported for this operation.");
    state.imageParts += 1;
    return { inlineData: canonicalizeInlineData(part.inlineData, state) };
  });

  if (state.textParts !== 1) fail("The operation requires exactly one text prompt part.");
  if (allowImages && state.imageParts > 2) fail("At most two reference images are supported.");
  return { parts };
};

const validateHttpOptions = (value) => {
  if (value === undefined) return;
  const httpOptions = assertRecord(value, "config.httpOptions");
  assertExactKeys(httpOptions, new Set(["timeout"]), "config.httpOptions");
  if (!Number.isSafeInteger(httpOptions.timeout) || httpOptions.timeout !== 8 * 60 * 1000) {
    fail("config.httpOptions.timeout is unsupported.");
  }
};

const canonicalizeSchema = (value, state = { count: 0 }, depth = 0) => {
  if (depth > MAX_SCHEMA_DEPTH) fail("config.responseSchema is too deeply nested.");
  state.count += 1;
  if (state.count > MAX_SCHEMA_NODES) fail("config.responseSchema is too complex.");

  const schema = assertRecord(value, "config.responseSchema");
  assertExactKeys(
    schema,
    new Set(["type", "description", "properties", "required", "items"]),
    "config.responseSchema",
  );
  if (!SCHEMA_TYPES.has(schema.type)) fail("config.responseSchema has an unsupported type.");

  const next = { type: schema.type };
  if (schema.description !== undefined) {
    next.description = boundedString(
      schema.description,
      "config.responseSchema.description",
      500,
      { allowEmpty: true },
    );
  }

  if (schema.type === "OBJECT") {
    const properties = assertRecord(schema.properties, "config.responseSchema.properties");
    const entries = Object.entries(properties);
    if (entries.length < 1 || entries.length > 32) fail("config.responseSchema has an invalid property count.");
    next.properties = {};
    for (const [name, child] of entries) {
      if (!/^[A-Za-z][A-Za-z0-9_]{0,63}$/u.test(name)) fail("config.responseSchema has an invalid property name.");
      next.properties[name] = canonicalizeSchema(child, state, depth + 1);
    }
    if (!Array.isArray(schema.required) || schema.required.length > entries.length) {
      fail("config.responseSchema.required must be an array of property names.");
    }
    const required = [...new Set(schema.required)];
    if (required.some((name) => typeof name !== "string" || !Object.hasOwn(next.properties, name))) {
      fail("config.responseSchema.required references an unknown property.");
    }
    next.required = required;
  } else if (schema.type === "ARRAY") {
    next.items = canonicalizeSchema(schema.items, state, depth + 1);
  } else if (schema.properties !== undefined || schema.required !== undefined || schema.items !== undefined) {
    fail("config.responseSchema fields do not match its type.");
  }

  return next;
};

const canonicalizeSafetySettings = (value) => {
  if (!Array.isArray(value) || value.length !== SAFETY_CATEGORIES.size) {
    fail("config.safetySettings has an invalid item count.");
  }
  const seen = new Set();
  return value.map((settingValue) => {
    const setting = assertRecord(settingValue, "config.safetySettings item");
    assertExactKeys(setting, new Set(["category", "threshold"]), "config.safetySettings item");
    if (!SAFETY_CATEGORIES.has(setting.category) || setting.threshold !== "BLOCK_NONE") {
      fail("config.safetySettings contains an unsupported setting.");
    }
    if (seen.has(setting.category)) fail("config.safetySettings contains a duplicate category.");
    seen.add(setting.category);
    return { category: setting.category, threshold: setting.threshold };
  });
};

const canonicalizeStructuredText = (payload, config) => {
  assertExactKeys(
    config,
    new Set(["responseMimeType", "responseSchema", "systemInstruction"]),
    "config",
  );
  if (config.responseMimeType !== "application/json") fail("Structured output must use application/json.");
  const nextConfig = {
    maxOutputTokens: 8_192,
    responseMimeType: "application/json",
    responseSchema: canonicalizeSchema(config.responseSchema),
  };
  if (config.systemInstruction !== undefined) {
    nextConfig.systemInstruction = boundedString(
      config.systemInstruction,
      "config.systemInstruction",
      MAX_SYSTEM_INSTRUCTION_CHARS,
    );
  }
  const contents = canonicalizeContents(payload.contents, { allowImages: true });
  if (typeof contents !== "string") {
    const imageParts = contents.parts.filter((part) => part.inlineData).length;
    if (imageParts !== 1 || contents.parts.length !== 2) {
      fail("Structured image transcription requires exactly one prompt and one reference image.");
    }
  }
  return {
    operation: "structured-content",
    cost: 1,
    request: {
      model: payload.model,
      contents,
      config: nextConfig,
    },
  };
};

const canonicalizePromptEnhancement = (payload, config) => {
  assertExactKeys(config, new Set(["safetySettings"]), "config");
  if (typeof payload.contents !== "string") fail("Prompt enhancement contents must be a string.");
  return {
    operation: "prompt-enhancement",
    cost: 1,
    request: {
      model: payload.model,
      contents: canonicalizeContents(payload.contents, { allowImages: false }),
      config: {
        maxOutputTokens: 1_024,
        safetySettings: canonicalizeSafetySettings(config.safetySettings),
      },
    },
  };
};

const canonicalizeImageGeneration = (payload, config, profile) => {
  assertExactKeys(
    config,
    new Set(["responseModalities", "imageConfig", "safetySettings", "httpOptions"]),
    "config",
  );
  if (!profile.allowHttpOptions && config.httpOptions !== undefined) {
    fail("config.httpOptions is not supported for this model.");
  }
  if (!profile.allowSafetySettings && config.safetySettings !== undefined) {
    fail("config.safetySettings is not supported for this model.");
  }
  if (profile.requireHttpOptions && config.httpOptions === undefined) {
    fail("config.httpOptions is required for this model's application profile.");
  }
  if (profile.requireSafetySettings && config.safetySettings === undefined) {
    fail("config.safetySettings is required for this model's application profile.");
  }
  if (profile.allowHttpOptions) validateHttpOptions(config.httpOptions);
  if (
    !Array.isArray(config.responseModalities)
    || config.responseModalities.length !== 2
    || config.responseModalities[0] !== "IMAGE"
    || config.responseModalities[1] !== "TEXT"
  ) {
    fail("Image generation must request the supported IMAGE and TEXT modalities.");
  }
  const imageConfig = assertRecord(config.imageConfig, "config.imageConfig");
  assertExactKeys(imageConfig, new Set(["imageSize", "aspectRatio"]), "config.imageConfig");
  if (!profile.sizeCosts.has(imageConfig.imageSize)) fail("config.imageConfig.imageSize is unsupported for this model.");
  if (!profile.aspectRatios.has(imageConfig.aspectRatio)) {
    fail("config.imageConfig.aspectRatio is unsupported for this model.");
  }

  if (profile.contents === "text" && typeof payload.contents !== "string") {
    fail("This image model only supports a text prompt in the application.");
  }
  if (profile.contents === "parts" && (typeof payload.contents !== "object" || Array.isArray(payload.contents))) {
    fail("This image model requires the application's content-parts request shape.");
  }
  const contents = canonicalizeContents(payload.contents, { allowImages: true });
  const referenceImages = typeof contents === "string"
    ? 0
    : contents.parts.filter((part) => part.inlineData).length;
  if (referenceImages > profile.maxReferenceImages) {
    fail("This image model does not support that many reference images in the application.");
  }

  const nextConfig = {
    responseModalities: ["IMAGE", "TEXT"],
    imageConfig: {
      imageSize: imageConfig.imageSize,
      aspectRatio: imageConfig.aspectRatio,
    },
  };
  if (profile.allowSafetySettings && config.safetySettings !== undefined) {
    nextConfig.safetySettings = canonicalizeSafetySettings(config.safetySettings);
  }

  return {
    operation: "image-generation",
    cost: profile.sizeCosts.get(imageConfig.imageSize),
    request: {
      model: payload.model,
      contents,
      config: nextConfig,
    },
  };
};

export const validateGeminiGenerateContentRequest = (value) => {
  const payload = assertRecord(value, "Gemini request");
  assertExactKeys(payload, new Set(["model", "contents", "config"]), "Gemini request");
  if (typeof payload.model !== "string") fail("Gemini request model must be a string.");
  const config = assertRecord(payload.config, "config");

  if (payload.model === STRUCTURED_TEXT_MODEL) return canonicalizeStructuredText(payload, config);
  if (payload.model === PROMPT_ENHANCEMENT_MODEL) return canonicalizePromptEnhancement(payload, config);
  const imageProfile = IMAGE_MODEL_PROFILES.get(payload.model);
  if (imageProfile) return canonicalizeImageGeneration(payload, config, imageProfile);
  fail("Gemini request model is not supported by this application.");
};

export const parseGeminiRequestJson = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    throw new GeminiProxyRequestError("Gemini request body must be valid JSON.");
  }
};

export const formatGeminiProxyError = (error, requestId) => {
  if (error instanceof GeminiProxyRequestError) {
    return {
      statusCode: error.statusCode,
      payload: { error: error.message },
      shouldLog: false,
    };
  }
  return {
    statusCode: 502,
    payload: {
      error: "Gemini generation failed. Please try again.",
      requestId,
    },
    shouldLog: true,
  };
};

const positiveInteger = (value, fallback) => {
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : fallback;
};

// A bounded, timer-free fixed-window limiter works in long-lived Node processes
// and warm serverless instances. It is intentionally paired with provider quota;
// no in-memory limiter can coordinate across every cold Vercel instance.
export const createGeminiRateLimiter = ({
  limit = 20,
  windowMs = 60_000,
  maxEntries = 10_000,
  now = Date.now,
} = {}) => {
  const safeLimit = positiveInteger(limit, 20);
  const safeWindowMs = positiveInteger(windowMs, 60_000);
  const safeMaxEntries = positiveInteger(maxEntries, 10_000);
  const entries = new Map();

  const prune = (timestamp) => {
    for (const [key, entry] of entries) {
      if (entry.resetAt <= timestamp) entries.delete(key);
    }
    while (entries.size >= safeMaxEntries) {
      const oldestKey = entries.keys().next().value;
      if (oldestKey === undefined) break;
      entries.delete(oldestKey);
    }
  };

  return {
    consume(keyValue, requestedCost = 1) {
      const timestamp = now();
      const key = String(keyValue || "unknown");
      const cost = Math.max(1, positiveInteger(requestedCost, 1));
      let entry = entries.get(key);
      if (!entry || entry.resetAt <= timestamp) {
        prune(timestamp);
        entry = { used: 0, resetAt: timestamp + safeWindowMs };
        entries.set(key, entry);
      }
      if (entry.used + cost > safeLimit) {
        return {
          ok: false,
          limit: safeLimit,
          remaining: Math.max(0, safeLimit - entry.used),
          retryAfter: Math.max(1, Math.ceil((entry.resetAt - timestamp) / 1000)),
        };
      }
      entry.used += cost;
      return {
        ok: true,
        limit: safeLimit,
        remaining: Math.max(0, safeLimit - entry.used),
        retryAfter: 0,
      };
    },
  };
};
