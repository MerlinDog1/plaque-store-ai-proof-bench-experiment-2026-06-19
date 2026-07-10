import {
  sanitizeOrderSvgFields,
  sanitizeSvgMarkup,
} from "../services/svgSanitizer.mjs";

const safeDownloadName = (value) => {
  const filename = String(value || "proof.svg")
    .replace(/[^A-Za-z0-9._-]+/gu, "-")
    .replace(/^-+|-+$/gu, "")
    .slice(0, 120);
  return filename.toLowerCase().endsWith(".svg") ? filename : `${filename || "proof"}.svg`;
};

export const svgDocumentResponseHeaders = (filename = "proof.svg") => ({
  "Content-Type": "image/svg+xml; charset=utf-8",
  "Content-Security-Policy": "sandbox; default-src 'none'; base-uri 'none'; form-action 'none'",
  "Content-Disposition": `inline; filename="${safeDownloadName(filename)}"`,
  "Cross-Origin-Resource-Policy": "same-origin",
  "X-Content-Type-Options": "nosniff",
});

export const prepareOrderProofSvgDocument = (value, fallbackBuilder) => {
  const order = sanitizeOrderSvgFields(value);
  const rawSvg = sanitizeSvgMarkup(order.proofPackage?.visualProofSvg);
  if (!rawSvg) return null;
  const document = rawSvg.startsWith("<svg")
    ? rawSvg
    : typeof fallbackBuilder === "function"
      ? fallbackBuilder(order, rawSvg)
      : "";
  return sanitizeSvgMarkup(document) || null;
};
