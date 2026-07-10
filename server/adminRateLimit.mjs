import { isIP } from "node:net";

const expandIpv6 = (address) => {
  let value = address.toLowerCase();
  const ipv4Tail = value.match(/(\d{1,3}(?:\.\d{1,3}){3})$/)?.[1];
  if (ipv4Tail) {
    const octets = ipv4Tail.split(".").map(Number);
    const replacement = `${((octets[0] << 8) | octets[1]).toString(16)}:${((octets[2] << 8) | octets[3]).toString(16)}`;
    value = `${value.slice(0, -ipv4Tail.length)}${replacement}`;
  }

  const halves = value.split("::");
  const left = halves[0] ? halves[0].split(":") : [];
  const right = halves[1] ? halves[1].split(":") : [];
  const fill = halves.length === 2 ? Array(Math.max(0, 8 - left.length - right.length)).fill("0") : [];
  return [...left, ...fill, ...right].map((group) => group.padStart(4, "0")).join(":");
};

export const normalizeIpAddress = (input) => {
  let value = String(input || "").trim().replace(/^"|"$/g, "");
  if (!value) return "";

  if (value.startsWith("[")) {
    const closingBracket = value.indexOf("]");
    if (closingBracket === -1 || (value.slice(closingBracket + 1) && !/^:\d+$/.test(value.slice(closingBracket + 1)))) {
      return "";
    }
    value = value.slice(1, closingBracket);
  } else {
    const ipv4WithPort = value.match(/^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/);
    if (ipv4WithPort) value = ipv4WithPort[1];
  }

  value = value.replace(/%.+$/, "");
  const mappedIpv4 = value.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i)?.[1];
  if (mappedIpv4 && isIP(mappedIpv4) === 4) {
    return mappedIpv4.split(".").map((octet) => String(Number(octet))).join(".");
  }

  const version = isIP(value);
  if (version === 4) return value.split(".").map((octet) => String(Number(octet))).join(".");
  if (version === 6) {
    const expanded = expandIpv6(value);
    const groups = expanded.split(":");
    if (groups.slice(0, 5).every((group) => group === "0000") && groups[5] === "ffff") {
      const high = Number.parseInt(groups[6], 16);
      const low = Number.parseInt(groups[7], 16);
      return [high >> 8, high & 255, low >> 8, low & 255].join(".");
    }
    return expanded;
  }
  return "";
};

export const getAdminClientIp = (req, env = process.env) => {
  const socketAddress = normalizeIpAddress(req?.socket?.remoteAddress) || "unknown";
  // Outside Vercel, forwarding headers are caller-controlled and never identify a rate-limit bucket.
  if (String(env.VERCEL || "") !== "1") return socketAddress;

  const forwardedHeader = req?.headers?.["x-forwarded-for"];
  const forwardedAddresses = (Array.isArray(forwardedHeader) ? forwardedHeader : [forwardedHeader])
    .flatMap((value) => String(value || "").split(","))
    .map(normalizeIpAddress)
    .filter(Boolean);
  // Vercel appends the trusted client hop at the end of the forwarding chain.
  return forwardedAddresses.at(-1) || socketAddress;
};

export const createAdminLoginRateLimiter = ({
  windowMs = 15 * 60 * 1000,
  maxAttempts = 8,
  now = () => Date.now(),
  env = process.env,
} = {}) => {
  const attempts = new Map();
  const keyFor = (req) => getAdminClientIp(req, env);

  return {
    check(req) {
      const key = keyFor(req);
      const checkedAt = now();
      const current = attempts.get(key);
      if (!current || current.resetAt <= checkedAt) {
        attempts.set(key, { count: 1, resetAt: checkedAt + windowMs });
        return { ok: true };
      }
      if (current.count >= maxAttempts) {
        return { ok: false, retryAfter: Math.max(1, Math.ceil((current.resetAt - checkedAt) / 1000)) };
      }
      current.count += 1;
      return { ok: true };
    },
    clear(req) {
      attempts.delete(keyFor(req));
    },
  };
};
