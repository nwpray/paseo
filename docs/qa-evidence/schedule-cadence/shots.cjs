const { chromium } = require("/private/tmp/paseo-cadence-build/v0.13.2/node_modules/playwright");
const OUT = process.env.OUT || "/private/tmp/pc-shots";
const only = process.argv.slice(2);
async function openApp(b, width, height) {
  const p = await b.newPage({ viewport: { width, height } });
  p.on("pageerror", (e) => console.log("PAGEERROR", e.message));
  p.on("console", (m) => { if (m.type() === "error" && !/uniProps|%s/.test(m.text())) console.log("CONSOLE", m.text().slice(0, 200)); });
  await p.goto("http://localhost:8093/schedules");
  await p.waitForTimeout(5000);
  return p;
}
const id = (p, t) => p.getByTestId(t).first();
async function newSchedule(p) {
  await p.getByText("New schedule", { exact: true }).first().click();
  await p.waitForTimeout(1200);
  if (p.viewportSize().width < 600) {
    await p.mouse.move(195, 306); await p.mouse.down(); await p.mouse.move(195, 120, { steps: 12 }); await p.mouse.move(195, 30, { steps: 8 }); await p.mouse.up();
    await p.waitForTimeout(800);
  }
}
async function mode(p, m) { await id(p, `schedule-cadence-mode-${m}`).click(); await p.waitForTimeout(300); }
async function pick(p, trigger, option) { await id(p, trigger).click(); await p.waitForTimeout(400); await id(p, option).click(); await p.waitForTimeout(400); }
async function fill(p, t, v) { const el = id(p, t); await el.click(); await el.fill(v); await p.waitForTimeout(400); }
async function shot(p, name) {
  await p.waitForTimeout(500);
  await p.screenshot({ path: `${OUT}/${name}.png` });
  const box = await id(p, "schedule-form-sheet").boundingBox().catch(() => null);
  if (box) {
    await p.mouse.move(box.x + box.width / 2, Math.min(box.y + box.height / 2, 500));
    await p.mouse.wheel(0, 2000);
    await id(p, "schedule-ends").scrollIntoViewIfNeeded().catch(() => id(p, "schedule-preview").scrollIntoViewIfNeeded());
    await p.waitForTimeout(500);
    await p.screenshot({ path: `${OUT}/${name}-lower.png` });
    await p.mouse.wheel(0, -2000);
    await p.waitForTimeout(300);
  }
  console.log("shot", name);
}
const flows = {
  async "create-daily"(p) { await newSchedule(p); await fill(p, "schedule-prompt-input", "Review new issues and summarize anything urgent"); await shot(p, "create-daily-default"); await id(p, "schedule-time-add").click(); await id(p, "schedule-time-add").click(); await shot(p, "create-daily-three-times"); },
  async "minute-mismatch"(p) { await newSchedule(p); await id(p, "schedule-time-add").click(); await fill(p, "schedule-time-1", "5:30 PM"); await shot(p, "error-times-minute-mismatch"); },
  async interval(p) { await newSchedule(p); await mode(p, "interval"); await id(p, "schedule-interval-window").click(); await p.waitForTimeout(300); await shot(p, "interval-working-hours"); },
  async weekly(p) { await newSchedule(p); await mode(p, "weekly"); await id(p, "schedule-weekdays-3").click(); await id(p, "schedule-weekdays-5").click(); await fill(p, "schedule-time-0", "8:30 AM"); await shot(p, "weekly-mwf"); await id(p, "schedule-weekdays-1").click(); await id(p, "schedule-weekdays-3").click(); await id(p, "schedule-weekdays-5").click(); await shot(p, "weekly-no-days"); },
  async nth(p) { await newSchedule(p); await mode(p, "monthly"); await id(p, "schedule-monthly-kind-nth").click(); await pick(p, "schedule-monthly-nth", "schedule-monthly-nth-2"); await pick(p, "schedule-monthly-weekday", "schedule-monthly-weekday-2"); await fill(p, "schedule-time-0", "10:00 AM"); await shot(p, "monthly-second-tuesday"); },
  async "month-edge"(p) { await newSchedule(p); await mode(p, "monthly"); await pick(p, "schedule-monthly-day", "schedule-monthly-day-31"); await shot(p, "monthly-day-31"); },
  async "cron-invalid"(p) { await newSchedule(p); await mode(p, "cron"); await fill(p, "cadence-cron-expression", "0 9 * * MON-FRI"); await shot(p, "cron-invalid"); await fill(p, "cadence-cron-expression", "0 9 30 2 *"); await shot(p, "cron-never"); },
  async ends(p) { await newSchedule(p); await mode(p, "weekly"); await id(p, "schedule-weekdays-weekdays").click(); await id(p, "schedule-ends-runs").click(); await fill(p, "schedule-max-runs-input", "4"); await shot(p, "ends-after-4-runs"); await id(p, "schedule-ends-date").click(); await p.waitForTimeout(300); await fill(p, "schedule-ends-date-input", "2026-11-04"); await shot(p, "ends-on-date"); },
  async dst(p) { await newSchedule(p); await fill(p, "schedule-time-0", "1:30 AM"); await pick(p, "schedule-timezone-trigger", "schedule-timezone-America/Denver"); await shot(p, "dst-fall-back-denver"); },
  async timezone(p) { await newSchedule(p); await id(p, "schedule-timezone-trigger").click(); await p.waitForTimeout(500); await p.keyboard.type("kolk"); await p.waitForTimeout(500); await shot(p, "timezone-search"); },
  async "edit-weekday"(p) { await p.getByText("Weekday triage").first().click(); await p.waitForTimeout(2500); await shot(p, "edit-max-runs"); },
  async "save-untouched"(p) { await p.getByText("Nightly dependency audit").first().click(); await p.waitForTimeout(2500); await id(p, "schedule-form-submit").click(); await p.waitForTimeout(2500); await p.screenshot({ path: `${OUT}/save-untouched-after.png` }); console.log("saved untouched"); },
  async "save-changed"(p) { await p.getByText("Check-ins").first().click(); await p.waitForTimeout(2500); await id(p, "schedule-time-remove-1").click(); await pick(p, "schedule-timezone-trigger", "schedule-timezone-UTC"); await id(p, "schedule-ends-date").click(); await p.waitForTimeout(300); await fill(p, "schedule-ends-date-input", "2026-12-31"); await shot(p, "edit-changed-before-save"); await id(p, "schedule-form-submit").click(); await p.waitForTimeout(2500); await p.screenshot({ path: `${OUT}/save-changed-after.png` }); console.log("saved changed"); },
  async "edit-custom"(p) { await p.getByText("Nightly dependency audit").first().click(); await p.waitForTimeout(1500); await shot(p, "edit-row-click"); },
};
(async () => {
  const b = await chromium.launch({ channel: "chrome" });
  const width = Number(process.env.W || 1280), height = Number(process.env.H || 900);
  for (const [name, fn] of Object.entries(flows)) {
    if (only.length && !only.includes(name)) continue;
    const p = await openApp(b, width, height);
    try { await fn(p); } catch (e) { console.log("FAIL", name, e.message.split("\n")[0]); await p.screenshot({ path: `${OUT}/fail-${name}.png` }); }
    await p.close();
  }
  await b.close();
})();
