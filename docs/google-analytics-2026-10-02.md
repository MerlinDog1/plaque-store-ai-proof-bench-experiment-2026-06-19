# InstaPlaque GA4 — 2 October 2026

Owner supplied G-FKP17EXNBX for InstaPlaque. Task branch: codex/instaplaque-google-analytics. Source release: 7406c2c0df4bf404498d2dccac73b93162905fb5. Based on live metadata 9f8e5d923e0793e7f0344455b7a54cab8c33605b, preserving oval-plaque updates.

Added GA4 configuration to existing AW-18288208905 Google loader; Ads configuration/conversion code unchanged. Private proof/order/session query URLs, private routes and admin views skip GA configuration at page load. GA page_location allows only view/UTM query parameters and strips fragments; referrer reduced to origin. Existing Vercel analytics redaction retained. Policies updated to describe actual tracking.

Verification: npm ci, typecheck, production build/runtime checks, analytics-redaction check and focused VM configuration tests passed. Live Chrome homepage and /brass-plaques each emitted exactly one GA page_view for this ID, Google HTTP204, no page errors. Google internally loads a destination-specific script; this is not a second installed bootstrap. No account-dashboard access/receipt claimed. No purchase or artwork generation tested.

Vercel READY dpl_EvtFsGFGtVUb63WLfdo4mGezmq1g, alias https://instaplaque.co.uk. Prior deployment dpl_8eteXnsXvozn6fbmfswmpjd2dTHh. Code pushed on task branch; git.deploymentEnabled=false retained. No PIM changes or paid services enabled. No known test failures remain. Account reporting permissions remain a separate step; collection is live.
