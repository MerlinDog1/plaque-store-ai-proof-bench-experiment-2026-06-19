# Meta checkout tracking — 3 October 2026

Owner supplied pixel 2766586460430567 and requested installation on InstaPlaque for an existing InitiateCheckout campaign. Baseline actual live dpl_EvtFsGFGtVUb63WLfdo4mGezmq1g / 7406c2c; branch codex/instaplaque-meta-checkout.

Optional Meta consent in App (including designer); rejected or absent consent does not load Meta. Preferences allow withdrawal. No changes to existing Google tracking. No automatic advanced matching; autoConfig disabled. Private paths/query parameters/referrers excluded. Explicit PageView and InitiateCheckout only. Checkout event is in central handleCreateMockOrder after successful live Stripe response, covering direct designer and separate checkout page. Sends server-confirmed GBP value and quantity1, not inscription/customer fields or session IDs. Session IDs remain local for in-memory duplicate suppression. Test/mock/failed checkout excluded. No historical event replay or Purchase event added.

Focused TypeScript, TSX syntax and VM behavioral tests passed. Full repo typecheck hit existing 512MiB heap limit; no override attempted. Cloud build/live verification recorded below. No real checkout/order/payment generated for testing. Meta Events Manager receipt is separate from browser verification.

Rollback: previous Vercel deployment above. Ad account/campaign/budget unchanged.

Release305115e deployed READY dpl_Fpfz2aemHnvnxT7CTEogF3eC9STK; canonical/www alias verified. Cloud production build/runtime checks passed. Hosted390px consent/rejection/revocation/reload/nooverflow passed. Meta loader and exact pixel config both HTTP200. No event collection request or Events Manager receipt independently confirmed; owner Test Events verification remains. No real order/payment created.
