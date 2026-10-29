const { chromium } = require("/private/tmp/paseo-cadence-build/v0.13.2/node_modules/playwright");
const { execSync } = require("child_process");
(async () => {
  const b = await chromium.launch({ channel: "chrome" });
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto("http://localhost:8093/schedules"); await p.waitForTimeout(5000);
  await p.getByText("Weekday triage").first().click(); await p.waitForTimeout(2500);
  const pids = execSync("lsof -nP -tiTCP:6791 -sTCP:LISTEN").toString().trim().split("\n");
  console.log("killing daemon pids", pids.join(","));
  for (const pid of pids) process.kill(Number(pid), "SIGTERM");
  await p.waitForTimeout(6000);
  await p.screenshot({ path: "/private/tmp/pc-shots/offline-edit.png" });
  await p.mouse.move(640, 450); await p.mouse.wheel(0, 3000); await p.waitForTimeout(500);
  await p.screenshot({ path: "/private/tmp/pc-shots/offline-edit-lower.png" });
  await b.close();
})();
