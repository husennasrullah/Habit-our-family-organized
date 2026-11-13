// Visual and interaction checks against fixture API responses; never writes family data.
const path = require("node:path");
const fs = require("node:fs");
const assert = require("node:assert/strict");
const modules = process.env.HABIT_QA_MODULES;
const puppeteer = require(
  modules ? path.join(modules, "puppeteer-core") : "puppeteer-core",
);
const origin = process.env.HABIT_QA_URL || "http://127.0.0.1:3000";
const out = path.resolve(__dirname, "../../docs/qa");
const user = {
  id: "member-qa",
  family_id: "family-qa",
  name: "Nadia Pratama",
  role: "admin",
  email: "qa@example.test",
  color: "#007f5b",
};
const result = { checks: [], errors: [], audits: [] };
(async () => {
  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/google-chrome",
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  try {
    const page = await browser.newPage();
    await page.emulateTimezone("Asia/Jakarta");
    await page.setBypassServiceWorker(true);
    await page.setCookie({
      name: "access_token",
      value: "qa-token",
      url: origin,
    });
    page.on("pageerror", (e) => result.errors.push(e.message));
    const date = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Jakarta",
    });
    const event = (id, title, start, end, color, allDay = false) => ({
      id,
      title,
      start_at: `${date}T${start}:00+07:00`,
      end_at: `${date}T${end}:00+07:00`,
      color,
      is_all_day: allDay,
      type: allDay ? "vacation" : "general",
      description: "Agenda keluarga",
      reminder_minutes: 0,
      is_recurring: false,
    });
    const events = [
      event(
        "a",
        "Sarapan dan rencana akhir pekan",
        "08:00",
        "09:00",
        "emerald",
      ),
      event("b", "Kontrol kesehatan keluarga", "08:30", "10:00", "rose"),
      event("c", "Waktu bersama keluarga", "00:00", "23:59", "violet", true),
      event("d", "Jalan sore di taman", "16:00", "17:00", "sky"),
    ];
    let mode = "data";
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const u = new URL(req.url());
      if (!u.pathname.includes("/api/v1/")) return req.continue();
      const p = u.pathname.split("/api/v1")[1];
      const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "*",
      };
      if (req.method() === "OPTIONS")
        return req.respond({ status: 204, headers });
      let data = [];
      if (p === "/auth/me") data = user;
      else if (p === "/family")
        data = { id: "family-qa", name: "Keluarga Pratama" };
      else if (p === "/family/members") data = [user];
      else if (p === "/events") {
        if (mode === "error")
          return req.respond({
            status: 500,
            headers,
            contentType: "application/json",
            body: '{"message":"Fixture error"}',
          });
        data = mode === "empty" ? [] : events;
      }
      return req.respond({
        status: 200,
        headers,
        contentType: "application/json",
        body: JSON.stringify({ data }),
      });
    });
    await page.evaluateOnNewDocument((user) => {
      localStorage.setItem(
        "keluarga-auth",
        JSON.stringify({
          state: { user, accessToken: "qa-token", isAuthenticated: true },
          version: 0,
        }),
      );
      localStorage.setItem("access_token", "qa-token");
      localStorage.setItem("pwa-prompt-dismissed", String(Date.now()));
    }, user);
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    async function clickText(selector, text) {
      const handle = await page.evaluateHandle(
        (selector, text) =>
          Array.from(document.querySelectorAll(selector)).find(
            (e) => e.textContent.trim() === text,
          ),
        selector,
        text,
      );
      assert.ok(await handle.asElement(), `missing ${text}`);
      await handle.asElement().click();
      await handle.dispose();
      await wait(250);
    }
    async function geometry(label) {
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
        `${label} overflow`,
      );
      result.checks.push(label);
    }
    async function audit(label) {
      await page.addScriptTag({
        path: modules
          ? path.join(modules, "axe-core/axe.min.js")
          : require.resolve("axe-core/axe.min.js"),
      });
      const violations = await page.evaluate(async () =>
        (
          await axe.run(document, {
            runOnly: {
              type: "rule",
              values: [
                "button-name",
                "label",
                "color-contrast",
                "nested-interactive",
              ],
            },
          })
        ).violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => n.target),
        })),
      );
      result.audits.push({ label, violations });
    }
    for (const width of [1440, 390, 375]) {
      await page.setViewport({ width, height: 1000 });
      await page.goto(origin + "/calendar", { waitUntil: "networkidle0" });
      await page.waitForSelector(".calendar-month-card");
      await geometry(`month-${width}`);
      assert.equal(
        await page.$$eval(".calendar-day-target", (els) => els.length >= 28),
        true,
      );
      assert.equal(
        await page.$$eval(".calendar-agenda-event", (els) => els.length),
        4,
      );
      await page.screenshot({
        path: path.join(out, `calendar-modern-month-${width}.png`),
        fullPage: true,
      });
      await audit(`month-${width}`);
      await clickText(".calendar-agenda-add", "Tambah acara");
      await page.waitForSelector('[role="dialog"]');
      assert.equal(
        await page.$eval("#start_at", (e) => e.value.slice(0, 10)),
        date,
      );
      await page.click('[aria-label="Tutup"]');
      await page.click('.calendar-day-target:not([aria-pressed="true"])');
      await page.waitForSelector(".calendar-agenda-empty");
      await page.click(".calendar-today-button");
      await clickText(".calendar-view-option", "Minggu");
      await page.waitForSelector(".calendar-time-inner.is-week");
      await geometry(`week-${width}`);
      assert.equal(
        await page.$$eval(
          ".calendar-all-day-events .calendar-event-badge",
          (els) => els.length,
        ),
        1,
      );
      assert.equal(
        await page.$$eval(".calendar-time-event", (els) => els.length),
        3,
      );
      await page.screenshot({
        path: path.join(out, `calendar-modern-week-${width}.png`),
        fullPage: true,
      });
      await audit(`week-${width}`);
      await clickText(".calendar-view-option", "Hari");
      await geometry(`day-${width}`);
      const positions = await page.$$eval(".calendar-time-event", (els) =>
        els
          .slice(0, 2)
          .map((e) => ({
            left: e.getBoundingClientRect().left,
            width: e.getBoundingClientRect().width,
          })),
      );
      assert.notEqual(positions[0].left, positions[1].left);
      await page.screenshot({
        path: path.join(out, `calendar-modern-day-${width}.png`),
        fullPage: true,
      });
      await clickText(".calendar-view-option", "Bulan");
      await page.evaluate(() => {
        localStorage.setItem("theme", "dark");
        document.documentElement.classList.add("dark");
        document.documentElement.style.colorScheme = "dark";
      });
      await page.screenshot({
        path: path.join(out, `calendar-modern-dark-${width}.png`),
        fullPage: true,
      });
      await audit(`dark-${width}`);
      await page.evaluate(() => {
        localStorage.setItem("theme", "light");
        document.documentElement.classList.remove("dark");
        document.documentElement.style.colorScheme = "light";
      });
    }
    mode = "empty";
    await page.reload({ waitUntil: "networkidle0" });
    await page.waitForSelector(".calendar-agenda-empty");
    result.checks.push("empty state");
    mode = "error";
    await page.reload({ waitUntil: "networkidle0" });
    await wait(6000);
    assert.ok(await page.$('[role="alert"]'));
    result.checks.push("error state");
    assert.deepEqual(result.errors, []);
    fs.writeFileSync(
      path.join(out, "calendar-modern-results.json"),
      JSON.stringify(result, null, 2),
    );
    console.log(JSON.stringify(result, null, 2));
    assert.equal(
      result.audits.reduce((n, a) => n + a.violations.length, 0),
      0,
      "accessibility violations",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
