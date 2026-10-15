# Postal-address removal — 9 October 2026

Owner requested removal of the current postal address from InstaPlaque and PIM,
including outgoing emails. No replacement address has been supplied yet.

## Changes

- Removed the address from shared public business configuration, Contact, About,
  Terms and both rendered footer variants. Email/phone contact details remain.
- Footers now use **Made in the UK**, including the static fallback used before
  JavaScript loads. Existing legal/navigation links remain.
- Removed street/town/postcode structured data. Retained Organization and WebSite
  identity with UK service area; removed the now-inapplicable physical-location
  LocalBusiness entry.
- The existing email templates did not include the business postal address.
  Added Made in the UK to the five branded customer templates in HTML and text.
  Customer delivery addresses, recipients, attachments and sending behaviour are
  unchanged. The human-design request notification also has no business address.

## Verification and release

- Reconciled the starting source against canonical live deployment
  dpl_FR2heHpEJmvjoS7eP4GwGAf5nRKC, source b50123b plus docs-only c66108e.
  The separate admin-list fix and unrelated PIM border change are not included.
- Eight email templates rendered offline: no withdrawn address; all five
  customer templates have the UK footer; customer shipping lines preserved.
- Changed UI/services and their imported dependencies passed TypeScript checking
  within the existing memory limit.
- Cloud build passed, including prerendering and actual Vercel API boot, SVG
  sanitisation and three health-route checks. Existing chunk-size advisory only.
- An initial candidate revealed that the static fallback footer needed the same
  UK wording; fixed before promotion. Final candidate Terms response verified.
- App source 48954736dbc179cc850957ec5d2bee1a625ad824 deployed and promoted as
  dpl_8AR2RibDg36LohHmwHa4qjiQmzrx.
- All 26 public/policy pages and the served main JavaScript passed the live
  address scan. Business structured data has no postal address.
- Live browser checks passed Home, Contact, About, Terms and Privacy at both
  390px and 1440px: new footer visible, no old address, page errors or overflow.
  Mobile footer screenshot visually reviewed. The www alias independently
  resolves to the same READY release as the canonical site.
- Complete tracked executable/public source scan: 132 files, zero occurrences
  of the withdrawn street/postcode. Private historical documentation is not
  served by the website and is retained as history.

Private verification artifacts are in ignored output/address-removal/. No
customer email, order, payment, database mutation, artwork change or new schedule.
Already delivered messages cannot be changed. Future address changes must use
the replacement explicitly supplied by the owner, not an old address from notes.

Rollback to the previous deployment would restore the withdrawn address; prefer
a forward correction preserving its removal. Existing Supabase/R2 setup and the
120-second model-request limit remain unchanged.
