# Page speed and Google rich results (26 Oct 2026, Claude)

## Why

The owner asked Claude to fix and improve PageSpeed Insights and rich-results snippets "for everything". Claude worked
from the source of the live deployment (dpl_ogT7gvhE6aZ9EfUbRrLcb55ekVN9) and deployed straight to Vercel.

## Speed

- **Fonts.** The fonts.googleapis.com stylesheet blocked rendering and needed two extra connections. The build now
  replaces it with inline `@font-face` rules for the same Montserrat and Playfair Display (Fontsource 5.3.0 variable
  files, latin and latin-ext, on cdn.jsdelivr.net, `font-display: swap`). The public pages draw headings in Georgia and
  text in Inter/system-ui, so these faces load only where they are used.
- **Cookie banner.** It was rendered only by React, after the whole app bundle. On phones it was the largest text
  block, so it became the Largest Contentful Paint (6.2 s on PageSpeed mobile).
  - `MetaConsent`'s own markup is now in the static HTML.
  - It is removed before paint when a choice is stored, and on admin views.
  - Its buttons store exactly what `choose()` stores.
  - Each sentence is a span, shown as its own line on phones (`shopfront-a11y.css`). The wording is unchanged.
- **App start.** The Vite module script is replaced by a small script that adds it after first contentful paint (one
  frame where paint timing is unsupported; at most 3 s). The static HTML is complete and its links work.
- **Google tag.** `gtag/js` loads on the first pointerdown, keydown, scroll or touchstart, or 3.5 s after the load
  event. The consent defaults, `js` and `config` calls run at once as before and wait in dataLayer.
  `scripts/check-google-consent.mjs` checks the deferral and the single loader.
- **Photos.** `services/imageUrls.ts` builds srcsets from Vercel Image Optimization (`/_vercel/image`, WebP, q75;
  allowed widths in `vercel.json` `images`) for:
  - the product page main image (a phone takes ~750 px, 10 KB, instead of the 1500 px JPG, 127 KB);
  - catalogue cards;
  - the home tiles and hero;
  - the quality photo.

  It switches on only when `VERCEL=1` at build time (`vite.config.ts` defines `__VERCEL_IMAGES__`), so the static HTML
  and the app agree and other builds keep the plain URLs.

## Rich results

`scripts/finalise-public-html.mjs` runs after `prerender-product-pages.mjs`. It asserts the markup it expects, so a
change of shape fails the build instead of shipping half-applied pages. It adds:

- **Organization:** `logo` (`/site-images/brand/instaplaque-logo-512.png`), a customer-service `contactPoint` and the
  store-wide `hasMerchantReturnPolicy`. The address is unchanged (Dunkirk Avenue, Desborough), as the owner asked.
- **Product (175 pages):**
  - `sku` = Merchant Center offer ID;
  - `size` and `color`;
  - `isVariantOf` a `ProductGroup` with `productGroupID` = the feed's `item_group_id`, `variesBy` and `hasVariant`
    (this page by `@id`, the other variants by URL: Google's multi-page variant markup).
- **Breadcrumbs** on the 10 pages that had none (Home > page heading).
- **ItemList** of the exact products a category page links to (home already had one).
- **Favicon:** real `/favicon.ico`, `/favicon.svg` and `/apple-touch-icon.png`. Google can't use a `data:` favicon.

`SiteExperience.tsx` `useSeoMeta` used to replace the build-time route schema as soon as the app started. Google renders
pages, so it never saw the build-time markup. It now keeps that schema while it describes the current address.

## Not done

- Review stars need real reviews collected on the site.
- FAQ rich results are shown only for government and health sites.
- 158 titles are longer than Google shows; they were left as written.
