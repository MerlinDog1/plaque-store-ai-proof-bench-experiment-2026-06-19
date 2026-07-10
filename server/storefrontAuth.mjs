import { timingSafeEqual } from "node:crypto";

const safeEqual = (leftValue, rightValue) => {
  const left = Buffer.from(String(leftValue));
  const right = Buffer.from(String(rightValue));
  return left.length === right.length && timingSafeEqual(left, right);
};

export const parseStorefrontKeys = (env = process.env) => {
  const raw = env.STOREFRONT_INGEST_KEYS || env.STOREFRONT_API_KEYS || "";
  return String(raw)
    .split(",")
    .map((entry) => {
      const [source, key] = entry.includes(":") ? entry.split(/:(.*)/s) : ["*", entry];
      return { source: source.trim().toLowerCase(), key: key.trim() };
    })
    .filter((entry) => entry.key);
};

export const getStorefrontAuth = (req, env = process.env) => {
  const configuredKeys = parseStorefrontKeys(env);
  if (!configuredKeys.length) {
    return {
      ok: false,
      configured: false,
      source: "",
      statusCode: 503,
      code: "STOREFRONT_AUTH_NOT_CONFIGURED",
      error: "Storefront ingestion is not configured. Set STOREFRONT_INGEST_KEYS on the server.",
    };
  }

  const authorization = Array.isArray(req.headers.authorization)
    ? req.headers.authorization[0]
    : req.headers.authorization;
  const keyHeader = Array.isArray(req.headers["x-storefront-api-key"])
    ? req.headers["x-storefront-api-key"][0]
    : req.headers["x-storefront-api-key"];
  const sourceHeader = Array.isArray(req.headers["x-storefront-source"])
    ? req.headers["x-storefront-source"][0]
    : req.headers["x-storefront-source"];
  const headerKey = String(keyHeader || String(authorization || "").replace(/^Bearer\s+/i, "")).trim();
  const headerSource = String(sourceHeader || "").trim().toLowerCase();
  const match = configuredKeys.find((entry) => (
    safeEqual(entry.key, headerKey)
      && (entry.source === "*" || !headerSource || entry.source === headerSource)
  ));

  if (!match) {
    return {
      ok: false,
      configured: true,
      source: headerSource,
      statusCode: 401,
      code: "STOREFRONT_AUTH_REQUIRED",
      error: "A valid storefront API key is required.",
    };
  }

  return {
    ok: true,
    configured: true,
    source: headerSource || (match.source === "*" ? "" : match.source),
    statusCode: 200,
    code: "STOREFRONT_AUTHENTICATED",
  };
};
