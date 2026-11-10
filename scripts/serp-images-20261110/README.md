# SERP photo review — 10 November 2026

Photos/review only, owner msg 11900. No site files, deployments or Google settings change.

Working output: `/home/coding-agent/workspace/output/instaplaque-serp-images-20261110/`.

- `prepare.py` copies the existing `run_batch.py` subscription runner and coded bench/garden scene helpers into the isolated output work folder. It builds three square guides and two-version job specifications.
- Stainless uses the live page's exact NORMA BRADSHAW designer artwork, cropped at its native 1500-pixel coordinates (70,455)-(1430,1045). Its four original cross-head screws are retained. Do not infer native image coordinates from a scaled tool display.
- Garden references are the saved garden-hero scalloped SUSAN MARSH drawing and the round-two MAY ATHERTON circle drawing with smooth flat caps.
- All cameras are square-on and level. Width fractions: S .60, G1 .50, G2 .40. G2 uses the lower requested limit to preserve a 6%-of-square clearance inside the narrow OG crop.
- Generation: `cody-job -- python3 -I run_batch.py` in the output `work/` directory, one generation at a time. Stop on usage/rate limits. No paid provider fallback.
- `review_candidates.py` creates full plaque crops, scene previews, coded-guide overlays and crop-band evidence. `measure.py` segments the metal near the expected guide bounds, reports its native-pixel bounding box and creates a measured outline for human verification. These are provisional until visually reviewed.
- `measurements.json` is the final inspected selection. `export.py` exports selected native masters plus centred 1x1, 4x3, 16x9 and OG crops. It calls the existing repository publisher's `tag()` function and verifies every file's IPTC DigitalSourceType through exiftool.
- The review sheet retains the actual screenshot's URL/title/snippet/price pixels, substituting only rounded square candidate thumbnails. The large image below each candidate is 500px. Review mock-ups do not predict or promise Google's image choice.

No image binaries are committed. The release step chooses and publishes the owner-approved images separately.
