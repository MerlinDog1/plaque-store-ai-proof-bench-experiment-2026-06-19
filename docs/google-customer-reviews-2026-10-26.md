# Google Customer Reviews — 26 October 2026

## Why

The owner (Telegram msg 6658): "Collect reviews after each delivery, through Google Customer Reviews - can you set this
up?". That is Merchant Center's prompt for its Customer Reviews add-on. Survey answers build the store rating Google
shows on Search and Shopping ads. The speed and rich-results release noted that review stars need real reviews.

## The two halves

1. **Merchant Center (owner):** the "Google Customer Reviews" add-on and its agreement. Path: Settings → Add-ons →
   Discover → Google Customer Reviews → Add → Go to Google Customer Reviews → Sign agreement.
   - There is no API for it. The Merchant API lists only checkout, free-listings, loyalty, product-ratings,
     shopping-ads and youtube-shopping-checkout for account 5859684800, though Cody's service account is an admin.
   - The add-on's "Opt-in integration" step is the code below.
2. **The site (this release):** Google's survey opt-in module on the order confirmation page.

## How it works

`services/googleCustomerReviews.ts` runs from `OrderConfirmedPage` (`components/SiteExperience.tsx`) once the order is
loaded.

- **Who sees the box.** All of these must hold:
  - the order is paid and has a valid email address;
  - it isn't a test payment or a no-fulfilment order (`checkoutTestPolicy`, `liveVerificationPolicy`,
    `noFulfilment`, the same exclusions as purchase measurement);
  - it was paid less than 48 hours ago (people reopening the page from their order email aren't asked again);
  - the browser isn't the owner's own (`?internal=on`).
- **What it does.** It loads `https://apis.google.com/js/platform.js?onload=renderOptIn` once. It then renders
  `gapi.surveyoptin` in UK English as Google's default centre dialogue, with:
  - merchant 5859684800;
  - the order number;
  - the email address;
  - the delivery country (Stripe's, otherwise GB);
  - an estimated delivery date.
- **Estimated delivery date.** The survey email goes out after this date. It is the UK date of payment plus, counting
  Monday to Friday:
  - the production estimate (the order's `turnaroundWorkingDays`, otherwise `getProductionEstimate`);
  - 1 delivery day (the transit time checkout and Merchant Center promise);
  - 2 spare days, so the survey doesn't arrive before the plaque.

  Bank holidays aren't counted; the spare days cover them. A standard order paid on Monday 26 Oct gets Thursday
  5 Nov.
- **Cookie choice.** Google requires the box for every customer after checkout, so it doesn't wait for the cookie
  choice. The box is itself Google's yes/no for the survey.

## Privacy

A probe of Google's real module (`workspace/output/instaplaque-gcr-20261026/probe_gcr.cjs`) answered the page locally
as https://instaplaque.co.uk/order-confirmed with a private session ID in the address, and pressed no buttons.

- **Requests:** platform.js, the surveyoptin module, and the box's frame
  `www.google.com/shopping/customerreviews/optin?merchant_id=…&order_id=…&origin=https://instaplaque.co.uk`.
- **What Google got:**
  - The email is in no address.
  - The session ID reached no Google request.
  - Referrers were the site's origin only.
- **Storage:** none. No cookies, local storage or session storage were set, on our page or in Google's frame (fresh
  browser).
- **Before the agreement:** Google's frame shows nothing (a 404 inside it), so the code is harmless until the owner
  signs.

The policies were updated to match:

- **Privacy policy:** a new "Google Customer Reviews" section, and Google Customer Reviews added to the service
  providers.
- **Cookie policy:** a new section saying we set nothing for it and Google may use its own cookies.
- The privacy date stays 26 October 2026.

## Checks

- **`npm run check:gcr` (new).** Covers:
  - delivery dates: a weekday, a weekend, 00:30 BST on 1 July (the UK date, not UTC), wood-backed A4 (10 days) and
    custom work (15 days);
  - who is offered the box;
  - the script loading once, with the render details;
  - the owner's browser and unpaid orders excluded.
- **`scripts/check-google-customer-reviews-browser.mjs` (new).** Needs `npm run build` and Chrome (`CHROME_PATH`).
  - It runs the built app with a synthetic order API, and records Google's script instead of loading it.
  - Results:
    - a paid order gets one box with the right details;
    - the session ID and inscription reach no outside address;
    - unpaid, owner-test, reopened (3 days) and owner's-browser visits get none;
    - /privacy and /cookies describe it.
  - With `LIVE=1` it runs the live site's own files instead of `dist/`.
- **Other checks:**
  - `npm run build` with every postbuild check passes, and so do `check:posthog` and `check:replay`.
  - `tsc` finds no errors in the repository's files. A scratch file in the ignored `output/` folder of the VPS
    checkout fails on its own.

## Release

- **Base:** Claude's live speed release (`claude/instaplaque-speed-rich-results-20261026`, dpl_DBVbnpja). Branch
  `codex/instaplaque-google-customer-reviews-20261026` is that plus this change.
- **Candidate:** built on Vercel (`vercel deploy --prod --skip-domain`): instaplaque-ovr62c0y3,
  dpl_47YaX9pvMhg1h5qtCKHumLdMLaiT, `index-DkNBmYdZ.js`. Against live:
  - 8 of 10 sampled pages were byte-identical apart from hashed file names;
  - /privacy and /cookies differed only by the new wording;
  - its bundle has the opt-in code and the live one didn't.
- **Live:** promoted at 16:32 UTC on 26 Oct, while production was still dpl_DBVbnpja, so nothing newer was overwritten.
  - Both domains point to dpl_47YaX9pv.
  - The browser check passes with `LIVE=1`.
  - `verify_live.py` passes on the product pages and their files.
- **Rollback:** `vercel promote https://instaplaque-dxg3rrhi3-dullaghan31-3959s-projects.vercel.app --yes`
  (dpl_DBVbnpja), with `VERCEL_ORG_ID`/`VERCEL_PROJECT_ID` set.

## After the owner signs

- **Check it works:** rerun `probe_gcr.cjs`. Google's dialogue should now appear in the frame; don't press its buttons.
- **Reporting:** the add-on shows opt-ins and survey results in Merchant Center. Google needs a body of reviews before
  it shows a store rating on ads.
