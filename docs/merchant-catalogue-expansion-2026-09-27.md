# Merchant catalogue expansion — 27 September 2026

Owner authorised the full standard range for Google free listings; no paid ads.

## Release

- Application commit: `49cf41a` (expansion `7f0eace`, ID correction `49cf41a`) on `codex/merchant-free-listings`.
- Worktree: `projects/instaplaque-merchant`.
- Production: `dpl_4FynpLKygsk16TD1BcAu77v2SqWB`.
- Canonical and www independently inspected READY at this deployment.
- Previous compatible release: `dpl_AY8iSJ4VovByE6KLztq9TPYL9DyG` (two offers).

## Scope

175 exact configurations across six finishes, standard bench/wall/A4/A5 dimensions, light/dark wood-backed wall variants, oval and circle. The two previously submitted IDs remain stable. Quote-only shapes, oversized jobs and infinite bespoke dimensions are intentionally not advertised as fixed-price products.

Each offer has a dedicated landing page, price from canonical checkout calculation, matching preset, accurate fixings and a matching illustration. 173 new 1500px native-designer renderings were produced without model calls, with synthetic-source metadata. The existing two AI-generated images retain their AI metadata. All pages disclose illustrations, not completed customer photographs. Google may still request image changes; import is not approval.

Feed variant attributes and per-offer handling days match existing production rules. Source remains FREE_LISTINGS only. Removed redundant excluded-destination values that Google reported as a non-impacting invalid-destination warning. No claim yet that Google has cleared that warning.

## Verification

- Typecheck and production build passed.
- Catalogue uniqueness, canonical pricing and quote-eligibility checks: all175 passed.
- Feed/built page schema, image, price and production checks: all175 passed.
- All173 rendered images passed lettering-boundary/fixing-count checks; all175 visuals reviewed in six contact sheets.
- Local built-site browser checks:210 at1440/390; page/designer prices, dimensions, fixings, loading, no overflow/JS errors. APIs intercepted.
- Hosted all175 pages/images available; live feed byte-identical to checked build.
- Hosted representative22 desktop/mobile page-to-designer checks passed; APIs intercepted.
- First development-server browser run timed out; complete built-site run passed. Earlier renderer nested-SVG portrait positioning and UI watermark were corrected before final images/checks.
- No orders, payments, refunds, emails, database writes or paid ads.

## Google state

Existing datasource10749182094 in Merchant5859684800 retained (GB/en, daily06:00 Europe/London). At start, original two products were pending initial review, with no account-level issues. Google described up to three business days for that review. First expanded import processed175 but rejected101 overlength IDs (50-character limit), creating72 new products alongside the original2. Fixed only those overlength IDs to compact deterministic configuration IDs, retaining all previously accepted IDs. Added ID length and uniqueness assertions, then rebuilt for a second import. Final import result recorded below.

Rollback: promote previous deployment and refetch the same source. Google may remove expanded products on the subsequent import; do not recreate the data source.

### Final import evidence

Corrected feed verified byte-for-byte on canonical and www,175 unique IDs each <=50 characters. Second upload `1790511018770000` at12:10:18UTC: SUCCEEDED, itemsTotal175, itemsCreated101, no import issues (101 newly created plus74 already accepted). Product-list processing lags file import. Initial product status snapshot showed74 with pending initial policy review,72 pending image crawl and12 NOT_IMPACTED unit-pricing-measure notices. Unit pricing is not the sales basis for these individually priced custom plaques; no fabricated measurements added. No account-level issues. The former excluded-destination warning was absent from that snapshot. Google approval/display remains unproven.
