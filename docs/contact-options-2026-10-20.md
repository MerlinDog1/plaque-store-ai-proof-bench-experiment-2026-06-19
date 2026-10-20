# WhatsApp, email and funnel tracking — review candidate

**Prepared on a test branch only; not deployed.** The owner asked to see this before it goes live.

- Branch: `codex/instaplaque-contact-options-20261020`
- Application commit: `6488ab19a9e6b6f0558c5fcdea6bad44686b5391`
- Base: `4ec93c6bed3f964425947aafbaf368e6e05a1c3e` on `origin/codex/instaplaque-admin-list-release-20261016`.
- The public memorial page still served `index-2XO612Kq.js` when inspected. This matches the October 16 release record. The later PIM homepage branch is not assumed deployed or merged.
- Migration handover was read. Supabase/private R2, API, payment and production configuration are unchanged.

## Customer behaviour

Home, collection/landing and catalogue pages offer WhatsApp and email beside the existing designer. On screens up to 720 px a fixed bar offers Design online, WhatsApp and Email us. Product designer presets are retained. The new number also appears on Contact and in the footer.

WhatsApp uses the owner's confirmed **07464 843841** (`https://wa.me/447464843841`). Email uses **hello@instaplaque.co.uk**. The existing separate telephone number is unchanged.

Opening a contact link prepares a suggested message and an `IP-` enquiry reference. Customers choose whether to send it. The reference uses no cookies or personal input. With analytics consent, its click event can be matched to a received enquiry. It is not an order ID, does not automatically create a lead/order and cannot prove a message was sent.

## Measurement

- Existing PostHog designer, wording, layout, proof, enquiry and checkout observations now also reach GA4. Existing `begin_checkout` and purchase contracts remain intact.
- Contact events include only allowed channel, placement and generated reference. Left/middle clicks are handled with rapid-repeat deduplication.
- Price views record a visible starting price or configured total once per page/context/session. They wait for at least half the price element to enter the viewport and handle consent granted while it is visible.
- Collection prices are derived from the actual displayed GBP label, not an optional schema-only fallback. Quote-only text does not claim a price view.
- Plausible Google click identifiers without UTMs classify the PostHog session as Google/cpc; the identifiers themselves are not stored or sent to PostHog.
- Existing consent, private-route exclusion, production-host checks, QA suppression and redaction remain. Local/preview contact and funnel events do not reach production analytics.
- Privacy text now explains contact references. No session replay was enabled.

The GA4–Google Ads account link and Ads conversion settings were not changed or independently verified. Keep contact taps as secondary observations, rather than counted sales or primary bidding goals. Actual enquiries and paid orders remain the business outcomes to assess.

## Verification

Passed:

- `npm run typecheck`
- `npm run check:posthog` (extended consent, GA4, contact, attribution and redaction coverage)
- `npm run check:google-consent`
- `npm run check:analytics-redaction`
- `npm run check:google-purchase`
- `npm run build`, including runtime, static consent, SEO, catalogue, policy and merchant-feed checks
- `git diff --check`
- Independent review of the React, CSS and measurement diff.

Browser checks used Chromium at 320, 390 and 1440 px across home, memorial, bench, brass, garden and contact. No horizontal overflow; the bar appears only on supported mobile shop pages; all WhatsApp links have the confirmed destination. Desktop/mobile screenshots and cookie-banner stacking were inspected.

A production-origin browser fixture served the candidate build from localhost, intercepted PostHog and blocked all other external requests. It verified no contact capture after rejection; price capture after acceptance; matching reference in message, PostHog and GA4; email prefill; Google/cpc classification without raw ID leakage; and mobile designer navigation with the bar removed. No messages or real analytics events were sent by this fixture.

Existing Vite large-chunk warnings remain. The local preview is static: payment, AI generation, email delivery and authenticated admin operations were not exercised. No new failure remains in the tested scope.

## Review and release boundary

Local preview: `http://127.0.0.1:4182/memorial-plaques`, started with `node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4182 --strictPort`.

The preview runs on the Windows machine while that process remains active. Vercel connector inspection returned 403, so no hosted preview was created.

Before pushing, verified `vercel.json` disables Git deployment and the only repository workflow performs checks without deployment. Push is to this test branch only. Before any later release, obtain the owner's approval, recheck the actual live revision and reconcile newer work, follow the migration handover and deployment checks, and preserve all existing backend configuration.

Next step: owner reviews the layout and contact copy. Manual quote/order plumbing, mailbox setup, Google Ads account settings, automated messaging and production release are separate work.
