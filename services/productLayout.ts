// The new product page layout (owner msgs 7596-7633, 29 Oct 2026): the finish close-up in the gallery, the film with
// big Design online / Design on WhatsApp buttons that glow with it, and the long copy folded away. Live on these pages
// first ("put that one tweaked product page live"); add slugs, or switch it on for every catalogue page, once the owner
// is happy with it.
export const newProductLayoutSlugs = new Set(['brushed-stainless-150x65-rect-plaque']);
export const hasNewProductLayout = (slug: string) => newProductLayoutSlugs.has(slug);
