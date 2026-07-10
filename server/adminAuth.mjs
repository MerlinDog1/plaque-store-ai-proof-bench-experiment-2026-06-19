import crypto from "node:crypto";

const configuredPassword = String(process.env.ADMIN_PASSWORD || "").trim();
const configuredToken = String(process.env.ADMIN_ACCESS_TOKEN || "").trim();
const hasConfiguredCredential = Boolean(configuredPassword || configuredToken);
const authSecret = String(
  process.env.ADMIN_AUTH_SECRET
    || configuredPassword
    || configuredToken
    || crypto.randomBytes(32).toString("hex"),
);
const sessionCookieName = "instaplaque_admin_session";
const sessionHours = Number(process.env.ADMIN_SESSION_HOURS || 8);
const sessionTtlMs = (Number.isFinite(sessionHours) && sessionHours > 0 ? sessionHours : 8) * 60 * 60 * 1000;

export const getAdminAuthConfig = () => {
  return {
    configured: hasConfiguredCredential,
    operational: hasConfiguredCredential,
    authRequired: true,
    status: hasConfiguredCredential ? "configured" : "misconfigured",
    label: configuredPassword
      ? "Admin passcode"
      : configuredToken
        ? "Admin access token"
        : "Admin access",
    message: hasConfiguredCredential
      ? "Admin access is configured."
      : "Admin access is not configured. Set ADMIN_PASSWORD or ADMIN_ACCESS_TOKEN on the server, including for local development.",
  };
};

const digest = (value) =>
  crypto.createHmac("sha256", authSecret).update(String(value)).digest("hex");

const safeEqual = (a, b) => {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
};

const expectedToken = () => configuredToken || (configuredPassword ? digest(configuredPassword) : "");

export const createAdminSession = (credential) => {
  if (!hasConfiguredCredential) {
    const error = new Error("Admin access is not configured. Set ADMIN_PASSWORD or ADMIN_ACCESS_TOKEN on the server, including for local development.");
    error.statusCode = 503;
    error.code = "ADMIN_AUTH_NOT_CONFIGURED";
    throw error;
  }

  const supplied = String(credential || "");
  const validPassword = configuredPassword && safeEqual(digest(supplied), digest(configuredPassword));
  const validToken = configuredToken && safeEqual(supplied, configuredToken);
  if (!validPassword && !validToken) {
    const error = new Error("Admin credential is incorrect.");
    error.statusCode = 401;
    error.code = "ADMIN_AUTH_INVALID";
    throw error;
  }
  const expiresAt = Date.now() + sessionTtlMs;
  const payload = `${expiresAt}.${crypto.randomBytes(16).toString("hex")}.${digest(expectedToken())}`;
  const signature = digest(payload);
  return { token: `${payload}.${signature}`, expiresAt };
};

export const parseCookies = (req) =>
  Object.fromEntries(String(req.headers.cookie || "")
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const separator = entry.indexOf("=");
      if (separator === -1) return [entry, ""];
      const value = entry.slice(separator + 1);
      try {
        return [entry.slice(0, separator), decodeURIComponent(value)];
      } catch {
        return [entry.slice(0, separator), value];
      }
    }));

export const getAdminSessionCookieName = () => sessionCookieName;

export const verifyAdminSessionToken = (token) => {
  if (!hasConfiguredCredential) return false;
  const parts = String(token || "").split(".");
  if (parts.length !== 4) return false;
  const [expiresAt, nonce, tokenDigest, signature] = parts;
  if (!expiresAt || !nonce || !tokenDigest || !signature) return false;
  if (Number(expiresAt) <= Date.now()) return false;
  const payload = `${expiresAt}.${nonce}.${tokenDigest}`;
  if (!safeEqual(signature, digest(payload))) return false;
  return safeEqual(tokenDigest, digest(expectedToken()));
};

export const isAdminRequest = (req) => {
  if (!hasConfiguredCredential) return false;

  const cookieToken = parseCookies(req)[sessionCookieName];
  if (cookieToken && verifyAdminSessionToken(cookieToken)) return true;

  const authorization = Array.isArray(req.headers.authorization)
    ? req.headers.authorization[0]
    : req.headers.authorization;
  const headerValue = Array.isArray(req.headers["x-admin-token"])
    ? req.headers["x-admin-token"][0]
    : req.headers["x-admin-token"];
  const headerToken = headerValue || String(authorization || "").replace(/^Bearer\s+/i, "");
  return Boolean(
    headerToken
      && (verifyAdminSessionToken(headerToken) || safeEqual(headerToken, expectedToken())),
  );
};

export const getAdminAuthFailure = () => {
  const config = getAdminAuthConfig();
  if (!config.operational) {
    return {
      statusCode: 503,
      code: "ADMIN_AUTH_NOT_CONFIGURED",
      error: config.message,
    };
  }
  return {
    statusCode: 401,
    code: "ADMIN_AUTH_REQUIRED",
    error: "Admin access required.",
  };
};
