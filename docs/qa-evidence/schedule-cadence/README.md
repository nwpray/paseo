# Schedule cadence builder: evidence (PASEO-21)

Ticket: https://app.plane.so/paseo/browse/PASEO-21/
Patch: `fork-patches/0018-schedule-cadence-builder.patch`, on v0.13.2 + 0001–0017.
Approved mock snapshot: `designs/schedule-cadence/index.html` (copied from the designer's
worktree; their files were not changed).

## What ships (Phase 1, current backend)

- Cadence modes Interval / Daily / Weekly / Monthly / Cron replace the five presets.
  Interval: 1–30 minutes or 1–12 hours (divisors only, so cron's hour/day reset never
  changes the gap), minute offset, optional hours window and days. Daily: up to 6 times.
  Weekly: day toggles plus Weekdays / Weekends / Every day. Monthly: day 1–31 with a
  skip hint for 29–31, or 1st–4th weekday (day range AND weekday). Cron: numeric fields,
  field-specific errors.
- Time zone picker (searchable; offsets shown). Cron cadences saved without a zone open in
  UTC, where the daemon runs them.
- Preview: summary, next run, 14-day strip and the next 5 runs. Runs come from
  `findNextCronMatch` in `packages/protocol/src/schedule/cron-next-run.ts`, which the
  daemon's `computeNextRunAt` now calls too. It matches the old minute-by-minute walk
  (equivalence tests across DST, half-hour zones, Lord Howe, month edges) but skips
  spans that can't match. DST notes show today's daemon behavior: a fall-back time runs
  twice, a spring-forward time is skipped.
- Ends: Never / On a date (`expiresAt` = local midnight after the date, in the cadence zone)
  / After N runs (`maxRuns`). Edit loads finished runs via `schedule/inspect` so the preview
  shows the runs left; if that fails it says "N runs in total".
- Edit never rewrites what you didn't touch: an expression opens in a builder mode only
  when that mode recompiles to the exact same string, otherwise it opens as Cron. Unchanged
  cadence and Ends are not sent. Legacy `every` cadences stay rolling until changed.
- States: preview loading while the run count is pending, an invalid cadence shows "Not
  scheduled yet", a cadence that never runs is blocked, a host-offline alert disables Save,
  and a failed save shows an error alert with "Try again".

No wire or schema change. `server_info.features` gating is not needed.

## Phase 2 (proposed in the mock): not shipped, needs product decisions

| Capability                                                                     | Backend need                                                                                   | Decision needed                                                                                                                             |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Times with different minutes (9:00 and 5:30)                                   | Cadence holding several cron rules, e.g. optional `expressions[]`, gated on a new feature flag | Old clients only see and edit the first rule. Hide the cadence from them, or make them read-only?                                           |
| Last day / last weekday of month                                               | Cron extension (`L`) or a new cadence type                                                     | Adding `L` changes the shared numeric parser that old daemons use for validation. Pick a new cadence type or a parser change behind a flag. |
| Start date                                                                     | New optional `startsAt` on schedules plus service changes to `nextRunAt`                       | How a past start date and pause/resume interact with it                                                                                     |
| DST policy (fall back runs once, spring forward shifts to the next valid time) | Change the matcher                                                                             | Changes when every existing schedule runs. Make it opt-in per schedule, or the new default for all?                                         |

Phase 1 doesn't fake any of these. A mixed-minute time list shows "All times need the
same minute", and the DST notes describe what the daemon does today.

## Verification

- Patch stack: `FORK_BUILD_DIR=/private/tmp/paseo-cadence-verify fork-patches/prepare.sh`
  applied 0001–0018 to a fresh v0.13.2 worktree. The resulting tree is identical to the build
  worktree.
- Fork packaging: `FORK_BUILD_DIR=/private/tmp/paseo-cadence-verify fork-patches/build.sh`
  built `Paseo-0.13.2-arm64.dmg` and `.zip` from that stack (exit 0, ad-hoc signed). Nothing
  was installed or launched.
- Typecheck (all workspaces), lint, and format on the changed files: clean. The lefthook
  pre-commit checks passed.
- Targeted tests (196 passed):
  `npx vitest run packages/protocol/src/schedule/ packages/app/src/schedules/ packages/server/src/server/schedule/`
  New: `cron-next-run.test.ts`, `cadence-builder.test.ts`, `cadence-preview.test.ts`, plus cases
  added to `schedule-form-model.test.ts`. The e2e specs that used the removed preset picker were
  updated to the new test IDs but not run locally.
- Browser: Chrome 1280×900 and 390×844 against an isolated dev daemon (port 6791, its own
  `PASEO_HOME`). Scripts: `shots.cjs`, `offline.cjs`. Round-trips checked with
  `paseo schedule inspect`:
  - Untouched save of `5 4 */3 * *` UTC: cadence, `maxRuns`, `expiresAt` and `nextRunAt`
    unchanged.
  - Edited `0 9,13,17 * * *` Denver: removed 1 PM, picked UTC, ended Dec 31. Stored
    `0 9,17 * * *` UTC with `expiresAt` 2027-01-01T00:00:00Z.

## Screenshots

| File                                                     | State                                       |
| -------------------------------------------------------- | ------------------------------------------- |
| `create-daily-three-times*.png`                          | Daily, three times, preview and cron footer |
| `error-times-minute-mismatch.png`                        | Times with different minutes                |
| `interval-working-hours.png`                             | Every 15 minutes, 9–5 on weekdays           |
| `weekly-mwf.png`, `weekly-no-days.png`                   | Weekly days; empty-days error               |
| `monthly-second-tuesday.png`, `monthly-day-31-lower.png` | Nth weekday; day 31 skips short months      |
| `cron-invalid.png`, `cron-never.png`                     | MON-FRI rejected; Feb 30 blocked            |
| `ends-after-4-runs-lower.png`, `ends-on-date-lower.png`  | Ends, last run, past-end strip              |
| `dst-fall-back-denver-lower.png`                         | Nov 1 1:30 AM runs twice (MDT, MST)         |
| `timezone-search.png`                                    | Zone search with offsets                    |
| `edit-row-click-lower.png`                               | Edit custom cron, opened unchanged in UTC   |
| `edit-max-runs-lower.png`                                | Edit with run count loaded                  |
| `offline-edit-lower.png`                                 | Host offline alert, Save disabled           |
| `compact/*.png`                                          | 390px bottom sheet                          |

## Limitations

- Schedule list rows still use the old `formatCadence` text, so multi-time crons show the raw
  expression there.
- Time and date entry are text fields ("9:30 AM", "2026-12-31"). The app has no native
  date/time picker dependency.
- The skipped-run note only covers builder clock modes. Custom cron still skips correctly
  but has no note.
- Native iOS/Android builds were not run. Web and compact web were checked.
- The React `uniProps` console warning shows on the home screen before the sheet opens.
  It exists without this change.
