// Responsive copies of the site's photos, made on request by Vercel Image Optimization (vercel.json "images") and
// cached by Vercel's CDN, so a phone downloads a ~750 px WebP instead of the 1200-1500 px original (PageSpeed,
// 26 Oct 2026). Only builds on Vercel use it (__VERCEL_IMAGES__, set in vite.config.ts from VERCEL=1), so the static
// HTML and the app always agree, and local, VPS and preview-server builds keep the plain file URLs.
declare const __VERCEL_IMAGES__: boolean | undefined;

const vercelImages = typeof __VERCEL_IMAGES__ !== 'undefined' && __VERCEL_IMAGES__ === true;

// Every width used here must be listed in vercel.json images.sizes, and the quality in images.qualities.
export const OPTIMISED_WIDTHS = [320, 480, 640, 750, 828, 1080] as const;
type OptimisedWidth = typeof OPTIMISED_WIDTHS[number];
const QUALITY = 75;

export const optimisedImageUrl = (src: string, width: OptimisedWidth) =>
  `/_vercel/image?url=${encodeURIComponent(src)}&w=${width}&q=${QUALITY}`;

/** srcset of optimised widths plus the original file at its own width (and any existing smaller files in `extra`),
 *  or `fallback` when not building on Vercel. */
export const optimisedSrcSet = (src: string, originalWidth: number, widths: OptimisedWidth[], fallback?: string, extra: string[] = []) =>
  vercelImages
    ? [...extra, ...widths.filter(width => width < originalWidth).map(width => `${optimisedImageUrl(src, width)} ${width}w`), `${src} ${originalWidth}w`].join(', ')
    : fallback;
