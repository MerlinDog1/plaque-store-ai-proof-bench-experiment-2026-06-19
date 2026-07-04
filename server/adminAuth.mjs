import crypto from "node:crypto";

const configuredPassword = process.env.ADMIN_PASSWORD || "";
const configuredToken = process.env.ADMIN_ACCESS_TOKEN || "";
const authSecret = process.env.ADMIN_AUTH_SECRET || configuredPassword || configuredToken || "instaplaque-local-admin";
const sessionCookieName = "instaplaque_admin_session";
const sessionHours = Number(process.env.ADMIN_SESSION_HOURS || 8);
const sessionTtlMs = (Number.isFinite(sessionHours) && sessionHours > 0 ? sessionHours : 8) * 60 * 60 * 1000;

export const getAdminAuthConfig = () => ({
  authRequired: Boolean(configuredPassword || configuredToken),
  label: configuredPassword ? "Admin passcode" : "Admin access token",
});

const digest = (value) =>
  crypto.createHmac("sha256", authSecret).update(String(value)).digest("hex");

const safeEqual = (a, b) => {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
};

const expectedToken = () => configuredToken || (configuredPassword ? digest(configuredPassword) : "");

export const createAdminSession = (password) => {
  if (!getAdminAuthConfig().authRequired) {
    const expiresAt = Date.now() + sessionTtlMs;
    return { token: "local-preview-admin", expiresAt };
  }
  const supplied = String(password || "");
  const validPassword = configuredPassword && safeEqual(digest(supplied), digest(configuredPassword));
  const validToken = configuredToken && safeEqual(supplied, configuredToken);
  if (!validPassword && !validToken) {
    const error = new Error("Admin passcode is incorrect.");
    error.statusCode = 401;
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
      return [entry.slice(0, separator), decodeURIComponent(entry.slice(separator + 1))];
    }));

export const getAdminSessionCookieName = () => sessionCookieName;

export const verifyAdminSessionToken = (token) => {
  if (!getAdminAuthConfig().authRequired) return true;
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
  if (!getAdminAuthConfig().authRequired) return true;
  const cookieToken = parseCookies(req)[sessionCookieName];
  if (cookieToken && verifyAdminSessionToken(cookieToken)) return true;
  const headerToken = req.headers["x-admin-token"] || req.headers.authorization?.replace(/^Bearer\s+/i, "");
  return Boolean(headerToken && (verifyAdminSessionToken(headerToken) || safeEqual(headerToken, expectedToken())));
};
