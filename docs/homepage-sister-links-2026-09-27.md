# Homepage sister link — 27 September 2026

- Worktree: `projects/instaplaque-sister-links`, branch `codex/homepage-sister-links`.
- App source: `5f68880`, based on the complete 175-product catalogue at `a94560e`.
- Owner-requested near-bottom homepage section links to `https://portraitsinmetal.com/gallery`, inviting exploration of examples while PIM intake remains closed.
- Existing About links, checkout and product catalogue remain unchanged.
- Typecheck and production build passed. Local 390/1440 browser checks passed for visible link, correct destination, no overflow and no JavaScript errors; mobile screenshot inspected. Static homepage includes crawlable link; generated 175-item Merchant feed byte-identical to current live feed.
- Git auto-deployment disabled, explicit CLI deployment only. Hosted verification recorded below when complete.
- Rollback: previous deployment `dpl_4FynpLKygsk16TD1BcAu77v2SqWB`.

No Merchant account, database, payment, email or customer state changed.

## Verified release

Cloud production build succeeded; deployment `dpl_8JunknXiRQUxDcmur3WxgNrPyv8r` READY and canonical alias independently verified. Both hosted homepages passed 390/1440 browser checks for visible correct links, no horizontal overflow and no JavaScript errors; screenshots inspected. Initial post-deploy checks timed out during runtime interruptions; fresh bounded checks passed. PIM workflow config remains enabled=false/test=true and noindex header retained. No video was added.
