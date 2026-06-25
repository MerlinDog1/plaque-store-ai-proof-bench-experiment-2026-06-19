import crypto from "node:crypto";

const configuredPassword = process.env.ADMIN_PASSWORD || "";
const configuredToken = process.env.ADMIN_ACCESS_TOKEN || "";
const authSecret = process.env.ADMIN_AUTH_SECRET || configuredPassword || configuredToken || "instaplaque-local-admin";

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
  if (!getAdminAuthConfig().authRequired) return { token: "local-preview-admin" };
  const supplied = String(password || "");
  const validPassword = configuredPassword && safeEqual(digest(supplied), digest(configuredPassword));
  const validToken = configuredToken && safeEqual(supplied, configuredToken);
  if (!validPassword && !validToken) {
    const error = new Error("Admin passcode is incorrect.");
    error.statusCode = 401;
    throw error;
  }
  return { token: expectedToken() };
};

export const isAdminRequest = (req) => {
  if (!getAdminAuthConfig().authRequired) return true;
  const headerToken = req.headers["x-admin-token"] || req.headers.authorization?.replace(/^Bearer\s+/i, "");
  return Boolean(headerToken && safeEqual(headerToken, expectedToken()));
};

