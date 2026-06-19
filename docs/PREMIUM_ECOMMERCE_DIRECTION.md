# Premium Ecommerce Direction

## Winner

Use the hero-image-led direction from `output/home-mockups-premium/premium-home-1.png` as the current homepage north star.

The site should feel like a high-end memorial/plaque ecommerce brand first, with the proof engine presented as the practical advantage. It should not feel like a dashboard, a configurator landing page, or a generic AI product-photo catalogue.

Core homepage sentence:

> A beautiful plaque, designed before you order.

Supporting promise:

> Choose a plaque, enter the wording and see a finished proof in minutes with intelligent typography, realistic materials and live pricing.

## Design Principles

- Lead with strong, real-feeling plaque photography.
- Use quiet serif display typography for premium/emotional pages.
- Keep the existing proof tool colour language: deep green/black, brass/gold, warm cream, restrained borders.
- Do not copy the proof bench layout onto the homepage.
- Do not use blurred fake plaque photos or unreadable AI-generated product imagery as primary ecommerce assets.
- Make the proof engine visible as a small, confident proof card or embedded proof moment, not as the whole visual style.
- Product pages should continue the premium tone before launching into the functional proof bench.
- Customers can edit freely until they explicitly approve the proof; approval locks the production snapshot.

## Homepage Structure

1. Premium photographic hero
2. Clear emotional headline
3. Primary CTA: create proof
4. Secondary CTA: view plaque types
5. Small proof-generated card showing the instant-proof advantage
6. Story/gallery section showing product categories and proof examples
7. Product cards leading into preset proof setups
8. Simple process section: choose, enter wording, generate proof, approve/order

## Current Implementation

- Homepage implementation commit: `eb7cea3` (`Add premium hero-led ecommerce homepage`)
- Product-page scroll/typography polish: `5aae345` (`Polish premium product pages`)
- Checkout approval polish: `97f5d5a` (`Refine checkout approval presentation`)
- Live temporary tunnel during this pass: `https://labs-velocity-figures-surely.trycloudflare.com`

## Useful Assets

- `/public/site-images/plaque-hero-equine.jpg`
- `/public/site-images/plaque-hero-memorial.jpg`
- `/public/site-images/plaque-hero-cat.png`
- `/public/site-images/proofbench-materials.png`

## Next Work

- Replace remaining prototype-heavy sections with premium editorial layouts.
- Improve product cards so they feel curated rather than generated.
- Add a better mobile navigation pattern for ecommerce pages.
- Add real product/category page copy around the instant proof promise.
- Later, generate new realistic product hero photos from actual app-produced plaque proofs rather than from text-only prompts.
