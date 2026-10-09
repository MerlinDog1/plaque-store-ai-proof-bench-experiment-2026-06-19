# InstaPlaque purchase tracking — 9 October 2026

## Status and scope

Prepared for review, **not deployed**. Branch:
codex/instaplaque-purchase-tracking-20261009.
Worktree: projects/instaplaque-purchase-tracking-20261009.
Verified implementation/test commit: f78a935963e994e5e49776850701c9f4066b7edd.

The owner's screenshots showed two Primary actions: Purchase (GA4, imported
values) and Purchase (1) (Website, inactive, $1 setting). Owner said Done after
instructions to make the latter Secondary. That is owner confirmation, not an
independent account read. Ads account 840-515-7684 and its installed memorial
campaign remain separate from this website change. No launch/spend approval,
installer rerun, conversion-action creation or account mutation.

Started from 3863a0b9b040b018895cb30abcedda17e1d1823a, whose only changes after
live application 48954736dbc179cc850957ec5d2bee1a625ad824 are release notes.
Canonical Vercel inspection still identified READY
dpl_8AR2RibDg36LohHmwHa4qjiQmzrx. Fetch showed no newer remote production
branch; the separate admin-list patch is not included.

## Findings and correction

Deployed code sent ads_conversion_Purchase_1, not the standard GA4 purchase.
Public configuration for G-FKP17EXNBX marks purchase as a conversion and contained
no matching custom-name mapping. This indicates a likely mapping gap, not access
to private account processing rules or proof of past conversion receipt.

Direct checkout returns also skip normal GA4 configuration because their URLs
contain private references. Simply renaming the event would not solve this safely.

- Send purchase explicitly to GA4 G-FKP17EXNBX with the server-confirmed GBP
  amount, a stable SHA-256 transaction reference, and one generic plaque item.
- Require a paid API order, positive integral pennies, GBP, canonical HTTPS
  host, and the matching live Stripe checkout-return session and order ID.
  Ordinary order visits, test sessions, previews and unpaid orders cannot trigger
  the event. Payment and order-creation code is unchanged.
- Honour the existing optional advertising-cookie choice. Missing/rejected
  consent sends nothing; acceptance on the order page retries the eligible event.
  The consent storage key retains its historical Meta name. Existing Meta
  behaviour is unchanged apart from a local consent-change notification.
- Browser storage/in-memory guards suppress repeat/reload submissions. GA4
  receives the stable transaction ID too. Blocked storage/tags do not break checkout.
- Use an event-only same-origin frame with a clean URL and no referrer. Normal
  Google tracking stays off on private order/proof/admin documents. The frame
  sends no name, email, address, inscription, proof, raw order ID or Stripe session.
  It retains the existing GA client cookie rather than making a separate visitor.
- Suppress the old unconditional Ads loader/configuration on initial private
  documents too. Public-page Google configuration/redaction stays as before.
- Disclose consented purchase measurement and duplicate suppression in the
  Privacy/Cookies text. Preserve the address-free footer, R2, pricing, design,
  checkout and model-timeout behaviour.

The new noindex frame does not request Google signals or personalised advertising.
It is not a customer-facing page.

## Verification

- Focused TypeScript of changed UI/services and their imports passed within the
  inherited memory limit.
- Purchase regressions passed: private/public bootstrap, paid amount, privacy,
  concurrent/reload deduplication, malformed/unpaid/refunded/test orders, consent,
  revocation, spoofed messages, bounded cleanup and storage/tag failures.
- Existing Meta checkout/consent and Vercel URL-redaction checks passed.
- Production build passed: API runtime boot, SVG sanitisation, three local health
  routes, Vite and prerender. Existing large-chunk advisory only.
- Real Chrome at 390px ran five isolated scenarios against the actual helper,
  bootstrap and frame, using captured public Google tag code. Paid = one
  purchase; unpaid/test/rejected = zero; late consent = one.
- Actual GA4-encoded requests contained the correct measurement ID, GBP amount,
  digest ID and clean page fields. The existing GA client ID survived checkout.
  Repeat calls/reload emitted no second purchase. No browser page errors.
- All Google collection requests were fulfilled **locally**, never delivered.
  No real order lookup, payment, email, DB write or customer fixture was used.
  These checks prove client wiring/encoding, **not Google dashboard or Ads receipt**.
- New public frame files match built copies. Git-triggered deployment stays disabled.

Checks:

    npm run check:google-purchase
    node scripts/check-meta-pixel.cjs
    npm run check:analytics-redaction
    npm run build
    node scripts/check-google-purchase-browser.cjs /path/to/saved-public-tag.js

For the browser check save the public response from
https://www.googletagmanager.com/gtag/js?id=G-FKP17EXNBX to an ignored local file.
The test intercepts every request and never falls back to real delivery.
Private evidence is in ignored output/purchase-tracking/, including the snapshot
hash and structured browser results. No customer fixture or secret is committed.

## Deployment and remaining proof

AGENTS.md requires an explicit deployment request; none is inferred from Done
confirming an Ads setting. Keep the campaign paused. On approval, recheck live
source, deploy only to the existing InstaPlaque project and independently verify
canonical/www and hosted assets. No new environment entry or secret is required.

Then verify the GA4 action's actual property/event mapping and end-to-end receipt
using a controlled approved measurement check or an eligible genuine purchase.
No synthetic production sale or real payment is authorised by these local tests.
Ads attribution can require an eligible ad interaction and reporting delay.
A tag callback or HTTP204 is not evidence of Ads crediting a purchase.

Frontend measurement remains best-effort: no confirmation-page return, rejected
cookies or blocking can prevent a signal. No server-side backfill is added.
Pre-existing public-page Google consent is not comprehensively audited by this
change; the new purchase event is gated on consent.

After a future release, rollback only to the address-free starting deployment,
or revert these files forward on the then-current site. Never restore pre-R2
code or the withdrawn address. No rollback/payment operation was performed here.
