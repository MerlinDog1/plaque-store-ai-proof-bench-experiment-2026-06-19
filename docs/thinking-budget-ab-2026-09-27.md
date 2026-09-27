# Thinking/output allowance A/B experiment — 27 September 2026

Owner requested repeated real A/B tests against live. Branch codex/thinking-budget-ab; worktree projects/instaplaque-thinking-ab. This branch is EXPERIMENTAL and must not be promoted as a shop release. Production remains application7af33c1, deployment dpl_HSwvSSUVEhDvmfj7kD7c4vPQyrRW.

## Design

Same existing prompt, modelGemini3.8Flash, exact wording, local renderer and validation/one-repair policy. Four synthetic regular etched plaques:100x25 short memorial,200x50 long-name bench inscription,148x210 portrait award,297x210 heritage history. Two runs per profile. No customer orders, email, payments or persisted proof sessions; only real model generation.

Profiles: LOW8192 current; LOW16384; MEDIUM16384; HIGH32768. Larger input context is not the variable. Runtime QA profile is an allowlisted server environment setting; callers cannot set thinking/budget. Unknown/absent profile retains LOW8192. All source edits isolated, Git auto-deployment disabled.

Initial high test kept the shop's30s function timeout, as did bothLOWs andMEDIUM. All fourHIGH first-round cases hit504twice. SecondHIGH round deliberately uses a separate120s deployment to assess potential quality with a longer wait; it is NOT a same-timeout reliability replicate. Thus reportHIGH30s andHIGH120s separately.

## Deployments (unpromoted)

- LOW16: dpl_8jCyvhbp9U4VU9RtZFcMRDnVhij6; instaplaque-7cqm80mqi-dullaghan31-3959s-projects.vercel.app.
- MEDIUM16: dpl_ChdVcVGLoCKNKxTFFmEjseZh3HSV; instaplaque-lki6csv01-dullaghan31-3959s-projects.vercel.app.
- HIGH32/30s: dpl_22pZS91z7rk79MpoLMsVp44ezfEs; instaplaque-94k2luk98-dullaghan31-3959s-projects.vercel.app.
- HIGH32/120s: dpl_6znSAw6RpnTcceykDAJAVLRm8t4A; instaplaque-4ywkrd4rf-dullaghan31-3959s-projects.vercel.app.

First three built sourcea16fbdb; extended timeoutsource0c0a854. These used existing production environment credentials through Vercel without reading/exporting their values; canonical/www never promoted. Protected requests use own CLIauthentication.

## Measurement caveats

Times include request/response transfer and, for protected URLs, CLI startup/auth. LOW8round1 used directHTTP; all other rounds includingLOW8round2 useCLI. CompareLOW8round2 with protected variants for less biased timings; small differences must not be attributed solely to the model. Token counts are returned metadata, not cost calculations. Timed-out calls lack usage metadata and may still have consumed provider tokens; missing usage is not zero spend.

MEDIUMround1history browser closed while waiting; saved200complete model response was recovered for replay through the same validator without another generation. Retain original interrupted record alongside recovered data. Initial queue was paused/terminated only afterHIGHround1 child finished to replaceHIGHround2 endpoint with120s version; no generation repeated by queue restart.

Artifacts and reproducible summary/boards: ignored output/thinking-ab. Scripts check-layout-quality.cjs,run-thinking-ab-rounds.cjs,summarize-thinking-ab.cjs,render-thinking-ab.cjs. Real test calls require explicitLIVE_LAYOUT_QA=true. No automatic schedule or background model loop.

## Completed results

32 comparisons completed and visually inspected.42 recorded API responses across those cases; one additionalLOW16 history request was interrupted with no response receipt, so total provider usage cannot be stated exactly. The recoveredMEDIUM response is counted once, not again for replay. Initial service launch failed before API access because of the default Node/PATH; corrected to installed Node24 and own Vercel wrapper, then the finite job completed exit0. No recurring service or schedule.

| Profile | Cases | Valid AI | First-pass AI | Local fallback | No proof | Recorded calls | Median measured request-total seconds |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| LOW8 | 8 | 7 | 5 | 0 | 1 | 11 | 4.8* |
| LOW16 | 8 | 8 | 5 | 0 | 0 | 11 | 6.4 |
| MEDIUM16 | 8 | 8 | 8 | 0 | 0 | 8 | 16.9 |
| HIGH32,30s server | 4 | 0 | 0 | 3 | 1 | 8 | 67.3 (two timeout attempts) |
| HIGH32,120s server | 4 | 4 | 4 | 0 | 0 | 4 | 39.0 |

*LOW8round1directHTTP vs protectedCLI elsewhere makes the pooled median not directly comparable. LOW8round2CLI-only median8.1s. MEDIUM range11.3–34.4s includes CLI startup/auth; success over30s end-to-end does not imply function execution exceeded its30s limit. ExtendedHIGH range18.9–73.4s. No returned completed response hit MAX_TOKENS; LOW response token totals were far below8k, so its one extra failure cannot be confidently blamed on the output cap.

## Visual judgement and recommendation

- Successful LOW/LOW16 layouts broadly similar; LOW16 did not establish an aesthetic benefit from more output room.
- MEDIUM kept clearer consistent grouping, all8firstpass; name/heading and supporting copy remained legible in this sample. Portrait award still rather spacious. Best candidate for a controlled upgrade based on reliability, not a demonstrated aesthetic breakthrough.
- HIGH with time allowed gave conventional, acceptable designs very similar toMEDIUM. No consistent visual benefit justifies its extra time/tokens from this sample. First tinyplaque probe took50.1s/12,083thinkingtokens. Without changing the shop timeout, initialHIGH runs all failed.
- Timeout fallbacks are clearly worse: combined name/date or date/tribute lines on benches, oversized generic title on the award; dense history no proof. These are fallback designs, not evidence ofHIGH's own typography quality.
- All generated outputs had measured corners within the plaque and no mobile horizontal overflow. All32desktop results inspected, including failure placeholders; no claim of physical manufacture validation.

Recommendation: MEDIUM16 merits the next controlled preview or owner-approved change. Do not automatically promote this experimental branch: it contains a120s test timeout and QA profile mechanism. A clean release should explicitly choose intended production settings and preserve the current30s timeout unless separately justified. Current canonical production remains unchanged.

Small sample: four inscriptions, two repetitions forLOW/MEDIUM, oneHIGH repetition at each timeout. Not a statistically robust universal ranking. No runtime pricing estimate; failed calls may incur tokens missing from response metadata.
