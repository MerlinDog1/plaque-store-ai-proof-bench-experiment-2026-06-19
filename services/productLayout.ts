import { DESIGN_PLAQUE_PARAM } from './groundStake';

// The new product page layout (owner msgs 7596-7633, 29 Oct 2026): the finish close-up in the gallery, the film with
// big Design online / Design on WhatsApp buttons that glow with it, and the long copy folded away. It went live on one
// page first ("put that one tweaked product page live").
// 30 Oct 2026 (owner msg 8065: "Probably gonna have to have the video on all these pages", "show a row more plaques in
// this finish. Another row different finishes in that same size"): every catalogue page gets it, with the photo first
// on phones, a line that says we make any size, finish or wording, and photo rows of the other sizes and finishes in
// place of the text-only wording examples and price lists.
export const newProductLayoutSlugs = new Set(['brushed-stainless-150x65-rect-plaque']);
export const NEW_PRODUCT_LAYOUT_EVERYWHERE = true;
export const hasNewProductLayout = (slug: string) => NEW_PRODUCT_LAYOUT_EVERYWHERE || newProductLayoutSlugs.has(slug);

// "Design online" on a catalogue page links to the designer already on that plaque, so a tap before the page's
// script has loaded no longer opens the default A5 plaque (found 30 Oct 2026). App.tsx reads the parameter (the same
// one the tree page's ground-stake links use) once, then drops it from the address.
export const designHrefFor = (slug?: string) => (slug ? `/design?${DESIGN_PLAQUE_PARAM}=${encodeURIComponent(slug)}` : '/design');
