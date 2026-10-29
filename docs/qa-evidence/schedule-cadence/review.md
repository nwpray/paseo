# Independent QA review: PASEO-21

**Final verdict: APPROVE (Phase 1).** Fix commit `745fe57e9` resolves the three findings from the first independent review. Do not close the Plane item until the parent records this verdict and decides its platform QA gate. The mock's Phase 2 mixed-minute times, last-day rules, start date, and new DST policy remain deferred; this verdict does not cover them.

## Re-review of the three findings

1. **Dense 14-day strip: fixed.** Previously the 1,500-run collection cap made later days blank for 1-, 2-, and 5-minute cadences. The new `collectStrip` in `packages/app/src/schedules/cadence-preview.ts` counts every cron run through the 14-day boundary and retains sampled marks, including the first run of each local day. Independent probe at `2026-10-29T10:15:00Z`, UTC, no end limit:

   | Cron          | Exact count | Marks on days 1–14              | Local probe time |
   | ------------- | ----------: | ------------------------------- | ---------------: |
   | `* * * * *`   |      19,544 | 83, then 144 on every later day |            74 ms |
   | `*/2 * * * *` |       9,772 | 83, then 144 on every later day |            60 ms |
   | `*/5 * * * *` |       3,908 | 82, then 144 on every later day |            60 ms |

   These counts match the minute grids for the 14-day UTC window (the first run occurs strictly after the probe clock). A separate Denver fall-back probe counted 19,964 minute runs across the same 14 local days in 64 ms, with marks on every day. With `remainingRuns=1,501`, the preview stops at 1,501 and hatches days after the last run. A bound just after the next midnight retained the next day's single run and hatched subsequent days. The legacy rolling one-minute cadence also counted 19,544 runs with marks across all days in 17 ms; its 1,501-run limit hatched the later days. The old false blank days did not recur.

2. **Combined saved Ends limits: fixed.** `resolveExpiresAt` and `resolveMaxRuns` in `packages/app/src/schedules/schedule-ends.ts` now use both persisted limits until the user touches Ends. Independent form-state probe with saved `0 9 * * *` UTC, `maxRuns=10`, zero completed runs, and form clock `2026-10-29T00:00:00Z`:
   - `expiresAt=2026-10-28T00:00:00Z` gives `preview.status="ended"`, no next run, and the saved end timestamp in preview state. Before the fix it falsely showed an upcoming Oct 29 run.
   - `expiresAt=2026-10-31T00:00:00Z` gives an upcoming Oct 29 run while retaining both `expiresAt` and `maxRuns` in preview state.
   - An untouched edit sends no Ends fields. Changing Ends to Never sends `{expiresAt:null,maxRuns:null}`, as intended.

3. **Cadence mode accessibility: fixed on web by code and browser evidence.** `packages/app/src/components/ui/segmented-control.tsx` now opts into a named radiogroup with radio roles, checked state, one tab stop, and Arrow/Home/End movement; `cadence-editor.tsx` enables it for Cadence. I inspected the handler and the author's isolated Chrome test, which asserts checked state, focus, and tab index after ArrowLeft, End, and Home. Its raw output is `radio-e2e.txt` (**1 passed**). I did not rerun that already-green test. Native radio roles and checked state are present in source, but iOS/Android screen-reader behavior was not exercised.

## Independent delivery and runtime checks

- `FORK_BUILD_DIR=/private/tmp/paseo-cadence-final-verify fork-patches/prepare.sh` passed its ordered patch-id verification for 0001–0018. `git apply --reverse --check` for patch 0018 passed in the final stack. All 19 paths in patch 0018 are byte-identical between `/private/tmp/paseo-cadence-build/v0.13.2` and `/private/tmp/paseo-cadence-final-verify/v0.13.2`. Direct `git apply --check` in the delivery checkout does not apply because it lacks the preceding patch-stack context; the ordered stack verification is the relevant check.
- Fixed final-stack ARM64 artifacts match the README SHA-256 values: DMG `b706700728d5c95c45424edbc884d24e03d53ea927c80f9b981d9da66c4cd2a8`; ZIP `8960b85fef31b13f155219e3d223fe35acf6874f01b2d1341ca55a955b4191f6`. `hdiutil verify` reports a valid DMG checksum; `unzip -tqq` accepts the ZIP. I did not install or launch the package.
- The first review independently passed one real browser plus isolated daemon create flow (raw output `browser-e2e.txt`) and ten optimized-cron vs minute-oracle cases around DST, month, and zone edges. The author reports 37 focused tests and clean typecheck, lint, format, fresh-stack build, and the radio browser test after the fixes. I did not rerun their green suites.
- The approved mock and existing compact-web screenshots were reviewed in the first pass. The fixed build has no new native screenshots. Native iOS/Android, desktop Windows/Linux, and packaged desktop runtime remain unexercised by this reviewer. The browser dev warning about `uniProps` originates outside this patch.

Plane PASEO-21 item `6f1c72a7-9806-49d5-a9bc-863442278f3c` remains for the parent to update. No Plane connector/API was available in this review session, and Chrome computer control was denied. Record **APPROVE (Phase 1)** with this evidence; do not close the ticket here.
