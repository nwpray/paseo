# Schedule cadence: design notes

Ticket: [PASEO-20](https://app.plane.so/paseo/browse/PASEO-20/)
Mock: `designs/schedule-cadence/index.html` (self-contained, open it in a browser)
Screenshots: `designs/schedule-cadence/screenshots/`

This is a design mock. No app code changed.

## Recommendation

Replace the 5-item preset dropdown and the always-visible cron field with a **mode picker**
(`SegmentedControl`: Interval, Daily, Weekly, Monthly, Cron). Each mode shows only its own controls:

| Mode     | Controls                                                                             | Cron it produces          |
| -------- | ------------------------------------------------------------------------------------ | ------------------------- |
| Interval | Every N minutes or hours, minute past the hour, optional "Only during set hours" with from/to and days | `*/15 9-16 * * 1-5`       |
| Daily    | One or more times                                                                    | `0 9,13,17 * * *`         |
| Weekly   | Day toggles (Weekdays, Weekends, Every day shortcuts) plus times                     | `30 8 * * 1,3,5`          |
| Monthly  | "On day N" or "On the first to fourth weekday", plus times                           | `0 10 8-14 * 2`           |
| Cron     | Raw 5-field expression with a field legend and plain-language errors                 | as typed                  |

Below the controls are the **time zone** (searchable combobox, defaults to the device zone) and a
**When it runs** card:

- A plain summary ("Weekdays at 9:00 AM"), then the next run in relative terms.
- A 14-day strip. Days run across and the time of day runs down, so you can see how dense the schedule is.
  It shows the difference between every 15 minutes, three times a day and the second Tuesday at a glance.
- The next 5 runs with time zone abbreviations, so DST changes show up (MDT to MST).
- The generated cron in mono, plus "Edit as cron". This keeps cron visible without making it the main control.

**Ends** gets its own field (Never, On a date, After runs). It replaces the separate "Max runs" input.

The interval steps are limited to values that divide evenly into an hour or day (1, 2, 3, 4, 5, 6, 10,
12, 15, 20, 30 minutes; 1, 2, 3, 4, 6, 8, 12 hours). Cron `*/7` resets at the top of each hour,
so a 7-minute interval would leave a 4-minute gap. Steps that don't divide evenly are still available in Cron mode.

Layout follows the existing form shape: a single column inside `AdaptiveModalSheet`. Desktop is a centered
600px card with `sm` controls. Compact is a bottom sheet with `md` (44px) controls. Nothing new at the
shell level.

## Supported today vs proposed

Use "Phase 1 / Phase 2" in the mock bar to switch scope. Turn on "Capability tags" to label each control.

### Phase 1: buildable on the current daemon and protocol, app-only change

Every builder mode compiles to one `{ type: "cron", expression, timezone }` cadence, which the protocol
already accepts.

- **Interval, daily, weekly, monthly day N:** standard cron.
- **Monthly "Nth weekday":** works today *because* the daemon ANDs day-of-month with day-of-week
  (`packages/server/src/server/schedule/cron.ts`, `computeNextRunAt`). `0 10 8-14 * 2` means
  "the Tuesday that falls on the 8th to 14th". Standard Vixie cron ORs those two fields, so this
  expression would mean something else in other tools. If the daemon ever switches to OR semantics,
  this mode breaks. Pin it with a test.
- **Several times a day:** only when every time shares the same minute (9:00 AM, 1:00 PM, 5:00 PM gives
  `0 9,13,17`). A single cron line can't express 9:00 and 17:30 without also matching 9:30 and
  17:00, so Phase 1 blocks mixed minutes with an inline error.
- **Time zone picker:** `cadence.timezone` is already stored and honored by the daemon. The app
  hard-codes the device zone (`normalizeScheduleFormCadence`, `cadence-editor.tsx`), so the picker is UI only.
- **End date:** `expiresAt` exists in `CreateScheduleInput`/`UpdateScheduleInput` and
  `shouldCompleteSchedule` honors it. The form doesn't expose it today. The mock stores the end of
  the chosen day in the cadence time zone.
- **After N runs:** `maxRuns` exists and is already in the form.
- **Upcoming runs preview:** there is no preview RPC. The app can compute it locally the same way the mock does.

### Phase 2: needs backend or protocol work (shown only in Phase 2)

- **Mixed-minute times.** The cadence needs to hold several cron rules. That is a protocol change
  (optional new field, per `docs/protocol-compatibility.md`).
- **Last day of month, last weekday of month.** No `L` support in `parseCronExpression`.
- **Start date.** The schedule has no `startAt`.
- **DST policy.** See below.

### Cron syntax the daemon accepts

Numbers, `*`, ranges, steps and comma lists. **No** names (`MON`, `JAN`), no `L`/`W`/`#`/`?`, and
weekday is 0–6 (7 is rejected). The Cron mode's helper line and errors say this directly, e.g.
"Weekday must use numbers (0–6, Sunday is 0). Names like MON-FRI aren't supported." `validateCron`
returns raw parser text ("Invalid day-of-week value") today.

## Behavior the mock exposes (current daemon)

- **DST fall back:** a daily 1:30 AM job in America/Denver runs **twice** on Nov 1, 2026 (MDT and MST).
- **DST spring forward:** a daily 2:30 AM job is **skipped** on Mar 14, 2027 because that local
  time doesn't exist.
- **Day 29 to 31:** months without that day are skipped. The monthly hint says "Skips months without a 31st".
- **Never runs:** `0 9 30 2 *` has no match in 366 days. The daemon throws "Unable to compute next run
  time" when you create it. The mock catches this before saving: "This never runs. No date in the next year matches."
- **Missed runs aren't caught up:** after downtime, `advanceNextRunAtPast` skips to the next future
  run. The mock doesn't show this; consider a one-line note on the schedule detail page.

The Phase 2 DST proposal: run once when clocks fall back (at the first occurrence), and run at the first
valid minute after the gap when clocks spring forward. Phase 1 shows the current behavior as an amber note
under the affected run and an amber mark on the strip, so nothing is hidden.

## Preview accuracy

The run times aren't illustrative. The mock's engine is a port of `parseCronExpression` (protocol) and
`computeNextRunAt` (server), plus skip-ahead for days and hours that can't match. A parity script ran
both against 14 expressions × 5 time zones × 4 start points across DST boundaries: **3,145 run
times, 0 mismatches**. Phase 2 previews use the same engine plus the proposed rules, and the card marks them
"needs backend".

The mock clock is fixed at Thu Oct 29 2026, 10:15 AM MDT (the spring DST state uses Mar 10 2027),
and the device zone is simulated as America/Denver, so screenshots are reproducible.

## States in the mock

Blank new schedule, daily several times, interval in working hours, weekly, no days picked, monthly
2nd Tuesday, monthly day 31, invalid cron, never-runs cron, edit with an unrecognized cron (opens in
Cron mode, summary "Custom cron schedule"), ends after N runs (the strip hatches days past the end),
DST fall back and spring forward, edit loading (skeletons hold the same box), host offline (warning
`Alert`, Create disabled, preview still works because it is local), saving ("Creating...", form
dimmed), and save failed (error `Alert`, button becomes "Try again"). Streaming doesn't apply.

Every control works: Cancel, close and Escape close the sheet, and Create runs a save that adds a row to the
schedules list behind the sheet.

## Implementation notes for later

- Keep the form-model shape from `docs/forms.md`: the mode and builder fields live in
  `schedule-form-model.ts`, and the model derives the cron and the summary. When you open an existing cron,
  recognize the builder shapes (the mock's `describeCron` covers the shapes it emits). Anything else opens in Cron mode.
- Switching modes keeps each mode's state. Entering Cron pre-fills from the builder unless the user
  has edited the cron since the last builder change.
- Mock-only substitutes: native `<select>` stands in for `SelectField`, and `<input type="time">`
  stands in for a native time picker. The time zone list is a curated 15 zones; the real one should use
  `Intl.supportedValuesOf("timeZone")` with search.
- Time format follows the user's locale. The mock pins `en-US` for reproducible screenshots. The current
  presets use 24-hour "9:00".
- Accessibility: segmented controls are radiogroups with arrow-key roving focus. Day toggles use
  `aria-pressed` with a fill and border change, not color alone. The time zone combobox uses
  `aria-activedescendant` and returns focus to its trigger. The summary is `aria-live="polite"`.
  The strip is `role="img"` with a run-count label, and the list carries the detail. Compact controls are 44px.

## Open questions for Nick

1. Is Phase 1 the scope for PASEO-20, with Phase 2 items filed separately (multi-rule cadence,
   `L` rules, `startAt`, DST policy)?
2. Should "Interval" also allow a rolling interval from the last run ("every 90 minutes")? The legacy
   `every` cadence does this, but it is COMPAT-tagged for removal, so the mock leaves it out.
3. Should "Run once now" (`runOnCreate`, already in the protocol) sit next to Create?
