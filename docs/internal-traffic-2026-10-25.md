# The owner's own browsers left out of the stats (25 Oct 2026)

## Why

The owner (msg 6422): "Is there a way to hide my views, Bedford was definitely me".

That evening's PostHog read showed two direct visits from Bedford: the owner testing the WhatsApp QR window from
their phone. The owner's browsers have analytics consent, so their visits counted in PostHog, GA4, Vercel and Meta
like a customer's.

## What changed

- **The switch.** Opening any page with `?internal=on` marks the browser in localStorage
  (`instaplaque-internal-v1 = yes`); `?internal=off` clears the mark.
  - `services/internalTraffic.ts` `applyInternalSwitch()` runs first in `index.tsx`, before any analytics starts.
  - It stores the choice and removes only the `internal` parameter from the address (`history.replaceState`), so
    the switch is not bookmarked or shared.
  - It shows a note for 8 seconds: "This browser is now left out of InstaPlaque’s stats." or "This browser is
    counted in InstaPlaque’s stats again." If site storage is blocked, the note says so.
  - The mark lasts until the browser's site data is cleared. Private windows start unmarked.
- **What a marked browser does:**
  - **Google tag:** `index.html`'s bootstrap treats it like a private page, so there is no `js`/`config` and no
    loader. Consent defaults are still queued, as on private pages.
    - The bootstrap reads `?internal=on` and `?internal=off` itself, so the visit that carries the switch is
      already excluded (on) or counted (off) before the app stores the choice.
  - **PostHog:** events are sent with `is_test=true`, like the existing QA mode. The saved dashboard 1017503, the
    daily email and Cody's `posthog_ads.py` all leave `is_test` out. The owner's tests can still be traced when
    needed.
  - **GA4 funnel events:** none, because GA4 is already skipped for test sessions.
  - **Meta:** `enableMeta()` returns false, so there is no pixel and no InitiateCheckout.
  - **Vercel Web Analytics:** not injected, and `beforeSend` drops events if the mark appears later.
  - **Google purchase:** `googlePurchase.ts` reports no purchase from a marked browser.
- **Where the key lives:** `INTERNAL_BROWSER_KEY` and `isInternalBrowser()` are in `services/metaPixel.ts`, the
  module the consent code already shares. That way the unit checks, which load these modules in isolation, need
  only small mock changes.

## Checks

- **Unit checks**, all passing:
  - `check-google-consent.mjs` (also the postbuild check) adds cases: a marked browser, `?internal=on`,
    `?internal=off` with a mark, an unknown value, `no`, and unreadable storage.
  - `check-posthog-analytics.cjs`: a marked browser sends only `is_test` events and no Google funnel events;
    clearing the mark counts the browser again.
  - `check-meta-pixel.cjs`: a marked browser gets no pixel and no checkout event.
  - `check-google-purchase.cjs`: no purchase from a marked browser. Its bootstrap mocks no longer answer "yes" to
    every storage key, which would have marked them.
  - `check-analytics-redaction` and `check-server-checkout` are unchanged and pass.
- **Fixed in passing:** `check-posthog-analytics.cjs` had been failing since the WhatsApp QR release (e7202d5). Its
  fake link had no `hasAttribute`, which `contactClick` now calls for `data-contact-counted`. The site code was
  right, and the live browser checks recorded contacts correctly. The mock now has it, plus a case for the QR
  window's own link.
- **Type check:** `tsc -p output/tsconfig.stake.json` passes, with 0 errors in 17 s.
- **Browser check on the staged copy** `instaplaque-gvt8wqavd`, all passing on computer and iPhone 13.
  - Script: `workspace/output/instaplaque-internal-traffic-20261025/run_check.sh` with `check_internal.cjs`. It
    uses the real built app with consent given; every Google, PostHog, Meta and Vercel request is answered locally
    and counted.
  - **A, an ordinary visit:** 1 Google tag, 1 Vercel script and 1 Meta script load, and PostHog events are not tests.
  - **B, `/memorial-plaques?utm_source=qrtest&internal=on`:**
    - the note shows and the mark is stored;
    - the address becomes `/memorial-plaques?utm_source=qrtest`;
    - 0 Google, 0 Vercel, 0 Meta;
    - every PostHog event is `is_test`.
  - **C, a later plain visit and an in-app page change:** still 0 / 0 / 0, all `is_test`, no note.
  - **D, `/?internal=off`:** the note shows, the mark is cleared, the address is clean, and Google, Vercel and Meta
    load again, with PostHog not tests.
  - No page errors.

## Past data

- GA4 places the owner in Desborough and Corby. Cody's GA4 scripts already leave those towns out.
  - GA4 since 1 Oct has no Bedford sessions.
  - PostHog's geo-IP placed the owner's phone in Bedford on 25 Oct. Those two visits are left out by hand.
- Past events cannot be edited in either tool.
