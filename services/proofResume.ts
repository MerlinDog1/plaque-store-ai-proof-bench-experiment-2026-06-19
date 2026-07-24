import { PlaqueState } from "../types";
import { sanitizeProofStateSvg, sanitizeSvgMarkup } from "./svgSanitizer.mjs";

const INLINE_PROOF_VERSION = 1;
const INLINE_PROOF_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_INLINE_PROOF_URL_CHARS = 2_850;

interface InlineProofPayload {
  v: number;
  e: number;
  s: PlaqueState;
  w: string;
  g: string | null;
  i: string;
}

export interface ResumableProofSnapshot {
  plaqueState: PlaqueState;
  wording: string;
  generatedSvg: string | null;
  inscriptionGuidance: string;
}

const bytesToBase64Url = (bytes: Uint8Array) => {
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
};

const base64UrlToBytes = (value: string) => {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, character => character.charCodeAt(0));
};

const gzipText = async (value: string) => {
  if (typeof CompressionStream === "undefined") {
    throw new Error("This browser cannot create a compact proof link.");
  }
  const compressed = new Blob([value])
    .stream()
    .pipeThrough(new CompressionStream("gzip"));
  return new Uint8Array(await new Response(compressed).arrayBuffer());
};

const gunzipText = async (value: Uint8Array) => {
  if (typeof DecompressionStream === "undefined") {
    throw new Error("This browser cannot open the compact proof link.");
  }
  const decompressed = new Blob([value])
    .stream()
    .pipeThrough(new DecompressionStream("gzip"));
  return new Response(decompressed).text();
};

const compactProofState = (state: PlaqueState): PlaqueState => ({
  ...state,
  generatedSvgContent: null,
  aiReasoning: null,
  conceptImageUrl: null,
  memorialImageSourceUrl: null,
  memorialImagePreviewUrl: null,
  etchmasterStyleReferenceUrl: null,
});

export const createInlineProofResumeUrl = async (
  snapshot: ResumableProofSnapshot,
  origin = window.location.origin,
) => {
  const payload: InlineProofPayload = {
    v: INLINE_PROOF_VERSION,
    e: Date.now() + INLINE_PROOF_LIFETIME_MS,
    s: compactProofState(snapshot.plaqueState),
    w: snapshot.wording,
    g: snapshot.generatedSvg,
    i: snapshot.inscriptionGuidance,
  };
  const encoded = bytesToBase64Url(await gzipText(JSON.stringify(payload)));
  const url = `${origin}/design#proof=${encoded}`;
  if (url.length > MAX_INLINE_PROOF_URL_CHARS) {
    throw new Error("This proof contains too much artwork for a QR-safe offline link.");
  }
  return url;
};

export const getInlineProofResumeToken = () => {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.hash.replace(/^#/, "")).get("proof");
};

export const decodeInlineProofResumeToken = async (
  token: string,
): Promise<ResumableProofSnapshot> => {
  const payload = JSON.parse(await gunzipText(base64UrlToBytes(token))) as InlineProofPayload;
  if (payload.v !== INLINE_PROOF_VERSION) {
    throw new Error("This proof link uses an unsupported format.");
  }
  if (!Number.isFinite(payload.e) || payload.e < Date.now()) {
    throw new Error("This proof link has expired.");
  }
  if (!payload.s || typeof payload.s !== "object" || Array.isArray(payload.s)) {
    throw new Error("This proof link is invalid.");
  }
  const plaqueState = sanitizeProofStateSvg(payload.s) as PlaqueState;
  const generatedSvg = payload.g === null ? null : sanitizeSvgMarkup(payload.g);
  if (payload.g && !generatedSvg) {
    throw new Error("This proof link contains invalid artwork.");
  }
  return {
    plaqueState,
    wording: typeof payload.w === "string" ? payload.w : "",
    generatedSvg,
    inscriptionGuidance: typeof payload.i === "string" ? payload.i : "",
  };
};
