import { createHash } from "node:crypto";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

const prefix = "r2-artwork:v1:";
const bucket = "order-proofs";
const maxBytes = 30 * 1024 * 1024;
const svgFields = new Set([
  "generated_svg", "generatedSvg", "generatedSvgContent", "generated_svg_content",
  "memorialImageSvg", "memorial_image_svg", "productionSvg", "production_svg",
  "visualProofSvg", "visual_proof_svg",
]);
const binaryFields = new Map([
  ["visualProofPng", "png"], ["visual_proof_png", "png"],
  ["productionArtworkPdf", "pdf"], ["production_artwork_pdf", "pdf"],
]);
const types = { svg: "image/svg+xml", png: "image/png", jpg: "image/jpeg", webp: "image/webp", pdf: "application/pdf" };
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
let client;

function enabled() {
  const provider = process.env.ARTWORK_STORAGE_PROVIDER || "inline";
  if (!["inline", "r2"].includes(provider)) throw new Error("Unknown artwork storage provider.");
  return provider === "r2";
}

function storage() {
  if (!enabled()) throw new Error("R2 artwork storage is required to read this record.");
  if (!client) {
    const account = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    if (!/^[a-f0-9]{32}$/.test(account || "") || !accessKeyId || !secretAccessKey) {
      throw new Error("R2 artwork storage is not configured.");
    }
    client = new S3Client({
      region: "auto", forcePathStyle: true,
      endpoint: `https://${account}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
  }
  return client;
}

function objectKey(scope, digest, type) {
  if (typeof scope !== "string" || !scope) throw new Error("Artwork record scope is required.");
  return `instaplaque/${hash(scope)}/${digest}.${type}`;
}

function parseArtwork(value, field) {
  if (svgFields.has(field) && value.trim().startsWith("<svg")) {
    return { type: "svg", encoding: "text", bytes: Buffer.from(value) };
  }
  const data = /^data:(image\/(?:png|jpeg|webp)|application\/pdf);base64,([A-Za-z0-9+/]*={0,2})$/.exec(value);
  const type = data ? Object.keys(types).find((key) => types[key] === data[1]) : binaryFields.get(field);
  const encoded = data ? data[2] : value;
  if (!type || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) return null;
  const bytes = Buffer.from(encoded, "base64");
  // Retain exact string round trips, including legacy noncanonical input.
  if (bytes.toString("base64") !== encoded) return null;
  return { type, encoding: data ? "url" : "base64", bytes };
}

async function walk(value, transform, field = "", depth = 0) {
  if (depth > 24) throw new Error("Artwork record is too deeply nested.");
  if (typeof value === "string") return transform(value, field);
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) {
    const result = [];
    for (const item of value) result.push(await walk(item, transform, field, depth + 1));
    return result;
  }
  const result = Object.create(null);
  for (const [key, item] of Object.entries(value)) {
    result[key] = await walk(item, transform, key, depth + 1);
  }
  return result;
}

async function readBytes(key, digest) {
  const object = await storage().send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  if (!object.Body || !Number.isSafeInteger(object.ContentLength) || object.ContentLength > maxBytes) {
    throw new Error("Invalid artwork object size.");
  }
  const chunks = [];
  let total = 0;
  for await (const chunk of object.Body) {
    total += chunk.length;
    if (total > maxBytes) throw new Error("Artwork object exceeds the read limit.");
    chunks.push(chunk);
  }
  const bytes = Buffer.concat(chunks);
  if (total !== object.ContentLength || hash(bytes) !== digest) throw new Error("Artwork integrity check failed.");
  return bytes;
}

// Only call on sanitized application data. References are generated here, never
// accepted from a browser. Upload completes before the database stores its marker.
export async function storeArtwork(value, scope) {
  if (!enabled()) return value;
  const written = new Set();
  return walk(value, async (text, field) => {
    if (text.startsWith(prefix)) throw new Error("Artwork references cannot be supplied by a client.");
    const artwork = parseArtwork(text, field);
    if (!artwork) return text;
    const { bytes, type, encoding } = artwork;
    if (bytes.length > maxBytes) throw new Error("Artwork exceeds the upload limit.");
    const digest = hash(bytes);
    const key = objectKey(scope, digest, type);
    if (!written.has(key)) {
      try {
        await storage().send(new PutObjectCommand({
          Bucket: bucket, Key: key, Body: bytes, ContentType: types[type],
          ContentLength: bytes.length, IfNoneMatch: "*",
        }));
      } catch (error) {
        if (error?.$metadata?.httpStatusCode !== 412) throw error;
        // Existing content-addressed objects must still contain the expected bytes.
        await readBytes(key, digest);
      }
      written.add(key);
    }
    return `${prefix}${type}:${encoding}:${digest}`;
  });
}

// Call only on rows read from the database, before existing SVG sanitizers. Keys
// are derived from that row's identity; a marker cannot read a different order.
export async function loadArtwork(value, scope) {
  const cache = new Map();
  return walk(value, async (text) => {
    if (!text.startsWith(prefix)) return text;
    const match = /^r2-artwork:v1:(svg|png|jpg|webp|pdf):(text|url|base64):([a-f0-9]{64})$/.exec(text);
    if (!match) throw new Error("Invalid stored artwork reference.");
    const [, type, encoding, digest] = match;
    if ((type === "svg") !== (encoding === "text")) throw new Error("Invalid artwork encoding.");
    const key = objectKey(scope, digest, type);
    if (!cache.has(key)) cache.set(key, readBytes(key, digest));
    const bytes = await cache.get(key);
    if (encoding === "text") return bytes.toString("utf8");
    const base64 = bytes.toString("base64");
    return encoding === "url" ? `data:${types[type]};base64,${base64}` : base64;
  });
}
