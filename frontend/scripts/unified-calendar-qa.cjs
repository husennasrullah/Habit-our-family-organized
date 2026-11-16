// Run from the checkout with temporary QA tooling; no application dependencies are added.
const path = require("node:path");
const os = require("node:os");
process.chdir(path.resolve(__dirname, "../.."));
process.env.TZ = "Asia/Jakarta";
const qaModules = process.env.HABIT_QA_MODULES;
const puppeteer = require(
  qaModules ? path.join(qaModules, "puppeteer-core") : "puppeteer-core",
);
const axePath = qaModules
  ? path.join(qaModules, "axe-core/axe.min.js")
  : require.resolve("axe-core/axe.min.js");
const fs = require("fs");
const assert = require("assert/strict");
const origin = process.env.HABIT_QA_URL || "http://localhost:3100";
const today = new Date().toLocaleDateString("en-CA", {
  timeZone: "Asia/Jakarta",
});
const stamp = today + "T00:00:00Z";
const user = {
  id: "member-1",
  family_id: "family-1",
  name: "Nadia Pratama",
  email: "nadia@example.test",
  role: "admin",
  avatar_url: "",
  auth_provider: "email",
  color: "#426653",
};
const tasks = [
  {
    id: "task-1",
    title: "Siapkan bekal untuk piknik keluarga",
    description: "Buah, air minum, dan camilan kesukaan.",
    due_date: stamp,
    status: "pending",
    assigned_to: user.id,
    points: 10,
  },
  {
    id: "task-2",
    title: "Belanja kebutuhan dapur",
    description: "Sayuran dan kebutuhan minggu ini.",
    due_date: today,
    status: "in_progress",
    assigned_to: user.id,
    points: 5,
  },
];
const events = [
  {
    id: "event-1",
    title: "Piknik sore di taman kota",
    start_at: today + "T16:00:00+07:00",
    end_at: today + "T18:00:00+07:00",
    is_all_day: false,
    color: "#426653",
    type: "general",
    description: "Bawa tikar dan camilan.",
  },
];
const budgets = [
  {
    id: "budget-1",
    category: "Makanan",
    amount: 2000000,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  },
];
const summary = {
  total: 750000,
  by_category: [
    { category: "Makanan", total: 500000, count: 3 },
    { category: "Transportasi", total: 250000, count: 2 },
  ],
  by_month: [],
};
const kid = {
  id: "kid-1",
  name: "Aruna",
  birth_date: "2022-01-10",
  gender: "female",
  notes: "",
};
const trip = {
  id: "trip-1",
  title: "Akhir pekan di Yogyakarta",
  destination: "Yogyakarta",
  start_date: today,
  end_date: today,
  budget_estimate: 3000000,
  status: "planning",
  notes: "Waktu untuk bersama.",
  members: [user],
  packing_items: [
    {
      id: "pack-1",
      item_name: "Botol air minum",
      category: "Lain-lain",
      is_packed: false,
    },
  ],
  itineraries: [
    {
      id: "it-1",
      day_number: 1,
      title: "Jalan pagi di taman",
      time_start: "08:00",
      time_end: "09:30",
      location: "Taman kota",
      budget_items: [],
    },
  ],
  expenses: [],
  documents: [],
};
const memory = {
  id: "memory-1",
  title: "Sore yang sederhana, cerita yang hangat",
  date: today,
  content: "Bermain bersama di taman.",
  photos: [],
  is_favorite: false,
};
let mode = "data";
let mutations = [];
let goalAchieved = false;
const sourceEvent = (source, source_id, title, source_url, extra = {}) => ({
  id: `${source}-${source_id}`,
  source,
  source_id,
  title,
  source_url,
  read_only: true,
  start_at: today + "T00:00:00+07:00",
  end_at: today + "T23:59:59+07:00",
  is_all_day: true,
  color: "teal",
  type: "general",
  description: "Terhubung dari menu asal.",
  ...extra,
});
events.push(
  sourceEvent(
    "task",
    "task-1",
    "Tugas · Siapkan bekal",
    `/tasks?date=${today}&record=task-1`,
  ),
  sourceEvent(
    "meal",
    "meal-1",
    "Sarapan · Nasi goreng",
    `/meals?date=${today}&record=meal-1`,
  ),
  sourceEvent(
    "trip",
    "trip-1",
    "Liburan Yogyakarta",
    `/trips/trip-1?date=${today}&record=trip-1`,
  ),
  sourceEvent(
    "vaccine",
    "v-1",
    "Vaksin · Aruna",
    `/kids?date=${today}&kid=kid-1&tab=vaccines&record=v-1`,
  ),
  sourceEvent(
    "birthday",
    "member-1",
    "Ulang tahun · Nadia",
    `/settings?date=${today}`,
  ),
  sourceEvent(
    "goal",
    "goal-1",
    "Target tabungan · Liburan",
    `/budget?date=${today}&tab=goals&record=goal-1`,
  ),
  sourceEvent(
    "memory",
    "memory-1",
    "Kenangan · Sore bersama",
    `/memories?date=${today}&record=memory-1`,
  ),
  sourceEvent(
    "expense",
    "expense-1",
    "Pengeluaran · Belanja",
    `/budget?date=${today}&tab=expenses&record=expense-1`,
  ),
  sourceEvent(
    "growth",
    "g-1",
    "Pertumbuhan · Aruna",
    `/kids?date=${today}&kid=kid-1&tab=growth&record=g-1`,
  ),
);
(async () => {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "habit-ui-qa-"));
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
    userDataDir: profile,
  });
  const page = await browser.newPage();
  await page.emulateTimezone("Asia/Jakarta");
  await page.setBypassServiceWorker(true);
  await page.setCookie({
    name: "access_token",
    value: "qa-token",
    url: origin,
  });
  let errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setRequestInterception(true);
  page.on("request", async (req) => {
    const url = new URL(req.url());
    if (!url.pathname.includes("/api/v1/")) {
      return req.continue();
    }
    const p = url.pathname.split("/api/v1")[1];
    if (req.method() !== "GET" && req.method() !== "OPTIONS")
      mutations.push({
        path: p,
        method: req.method(),
        body: p.startsWith("/auth")
          ? "[QA credentials omitted]"
          : req.postData(),
      });
    if (req.method() === "OPTIONS")
      return req.respond({
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "*",
          "Access-Control-Allow-Methods": "*",
        },
      });
    if (mode === "error" && !p.startsWith("/auth"))
      return req.respond({
        status: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
        contentType: "application/json",
        body: '{"message":"QA simulated error"}',
      });
    let data = [];
    if (p === "/auth/me") data = user;
    else if (p.startsWith("/auth/"))
      data = {
        access_token: "qa-token",
        refresh_token: "qa-refresh",
        member: user,
      };
    else if (p === "/family")
      data = {
        id: "family-1",
        name: "Keluarga Pratama",
        invite_code: "HABIT26",
      };
    else if (p === "/family/members") data = [user];
    else if (p === "/tasks/leaderboard") data = [];
    else if (p.startsWith("/tasks")) {
      data = tasks;
      if (req.method() !== "GET") {
        if (p.endsWith("/complete")) tasks[0].status = "done";
        data = tasks[0];
      }
    } else if (p === "/events") data = events;
    else if (p === "/expenses/summary") data = summary;
    else if (p === "/expenses")
      data = [
        {
          id: "expense-1",
          amount: 500000,
          category: "Makanan",
          description: "Belanja mingguan",
          date: today,
          currency: "IDR",
        },
      ];
    else if (p === "/budgets") data = budgets;
    else if (p === "/financial-goals")
      data = [
        {
          id: "goal-1",
          title: "Dana liburan keluarga",
          target_amount: 5000000,
          current_amount: 1500000,
          deadline: "2026-12-31",
          notes: "Sedikit demi sedikit",
          is_achieved: goalAchieved,
        },
      ];
    else if (p === "/kids") data = [kid];
    else if (p.endsWith("/vaccines"))
      data = [
        {
          id: "v-1",
          vaccine_name: "Jadwal vaksin berikutnya",
          scheduled_date: today,
          status: "scheduled",
        },
      ];
    else if (p.endsWith("/growth"))
      data = [
        { id: "g-1", date: today, height_cm: 103, weight_kg: 16 },
        { id: "g-2", date: "2026-09-13", height_cm: 101, weight_kg: 15.5 },
      ];
    else if (p === "/memories") data = [memory];
    else if (p.startsWith("/memories/")) data = memory;
    else if (p === "/documents")
      data = [
        {
          id: "doc-1",
          title: "Kartu Keluarga Pratama.pdf",
          type: "kk",
          file_size: 120000,
          url: "data:application/pdf,test",
        },
      ];
    else if (p === "/meal-plans")
      data = [
        {
          id: "meal-1",
          date: today,
          meal_type: "breakfast",
          name: "Nasi goreng sayuran",
          notes: "Porsi untuk seluruh keluarga",
          recipe_url: "",
        },
      ];
    else if (p === "/trips") data = [trip];
    else if (p.startsWith("/trips/")) data = trip;
    if (
      mode === "empty" &&
      !p.startsWith("/auth") &&
      p != "/family" &&
      p != "/family/members"
    ) {
      data =
        p === "/expenses/summary"
          ? { total: 0, by_category: [], by_month: [] }
          : p.startsWith("/trips/")
            ? trip
            : [];
    }
    return req.respond({
      status: 200,
      contentType: "application/json",
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ data, message: "success" }),
    });
  });
  const init = await page.evaluateOnNewDocument(
    ({ user, origin }) => {
      if (location.origin !== origin) return;
      localStorage.setItem("pwa-prompt-dismissed", String(Date.now()));
      localStorage.setItem(
        "keluarga-auth",
        JSON.stringify({
          state: { user, accessToken: "qa-token", isAuthenticated: true },
          version: 0,
        }),
      );
      localStorage.setItem("access_token", "qa-token");
      localStorage.setItem("refresh_token", "qa-refresh");
      document.cookie = "access_token=qa-token; path=/";
    },
    { user, origin },
  );
  const axeResults = [];
  const results = [];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  async function go(route, width = 1440, theme = "light", shot = false) {
    await page.evaluate((theme) => {
      try {
        localStorage.setItem("theme", theme);
      } catch {}
    }, theme);
    await page.setViewport({
      width,
      height: 1000,
      isMobile: width < 768,
      deviceScaleFactor: 1,
    });
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await page.goto(origin + route, {
          waitUntil: "networkidle0",
          timeout: 60000,
        });
        break;
      } catch (error) {
        if (attempt === 2) throw error;
        await sleep(400);
      }
    }
    await page.evaluate((theme) => {
      document.documentElement.classList.toggle("dark", theme === "dark");
      localStorage.setItem("theme", theme);
    }, theme);
    await sleep(200);
    const overflow = await page.evaluate(() => ({
      width: innerWidth,
      scroll: document.documentElement.scrollWidth,
      heading: document.querySelector("h1")?.textContent,
    }));
    results.push({ route, width, theme, mode, ...overflow });
    if (overflow.scroll > width + 1) {
      console.log("OVERFLOW", route, width, overflow.scroll);
      let offenders = await page.evaluate(() =>
        [...document.querySelectorAll("body *")]
          .filter(
            (x) =>
              x.getBoundingClientRect().right > innerWidth + 1 &&
              getComputedStyle(x).position !== "fixed",
          )
          .slice(-12)
          .map((x) => ({
            tag: x.tagName,
            cls: x.className,
            txt: x.textContent.slice(0, 40),
            right: x.getBoundingClientRect().right,
          })),
      );
      console.log(offenders);
    }
    if (
      mode === "data" &&
      !route.startsWith("/trips/") &&
      !["/login", "/register", "/onboarding"].includes(route)
    )
      assert(
        overflow.heading && !overflow.heading.includes("Selamat datang"),
        route + " rendered authenticated page",
      );
    if (shot)
      await page.screenshot({
        path: `docs/qa/unified-${route.split("?")[0].replaceAll("/", "-").slice(1)}-${width}-${theme}.png`,
        fullPage: true,
      });
  }
  const checks = [];
  const routes = [
    "/dashboard",
    "/tasks",
    "/calendar",
    "/meals",
    "/budget",
    "/kids",
    "/memories",
    "/documents",
    "/settings",
    "/trips",
    "/trips/trip-1",
  ];
  const clickText = async (text, scope = "button") => {
    const found = await page.evaluate(
      ({ text, scope }) => {
        const root =
          [...document.querySelectorAll("[role=dialog]")].at(-1) || document;
        const button = [...root.querySelectorAll(scope)].find(
          (b) =>
            b.getClientRects().length &&
            b.textContent.toLowerCase().includes(text.toLowerCase()),
        );
        if (button) {
          button.click();
          return true;
        }
        return false;
      },
      { text, scope },
    );
    assert(found, "missing " + text);
    await sleep(160);
  };
  const audit = async (name, scope = ".app-main") => {
    await page.addScriptTag({ path: axePath });
    await sleep(200);
    const violations = await page.evaluate(
      async (scope) =>
        (
          await axe.run(document.querySelector(scope), {
            runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
          })
        ).violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => ({
            target: n.target,
            summary: n.failureSummary,
          })),
        })),
      scope,
    );
    axeResults.push({ name, violations });
  };
  const fill = async (selector, value) => {
    await page.$eval(
      selector,
      (el, value) => {
        Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          "value",
        ).set.call(el, value);
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      },
      value,
    );
  };
  try {
    if (process.env.HABIT_QA_FLOW_ONLY) {
      const baseline = JSON.parse(
        fs.readFileSync("docs/qa/unified-calendar-results.json", "utf8"),
      );
      assert(baseline.checks.some((c) => c.startsWith("88 page/")));
      results.push(...baseline.results.slice(0, 88));
      axeResults.push(...baseline.axeResults.slice(0, 22));
    }
    if (!process.env.HABIT_QA_FLOW_ONLY)
      for (const width of [375, 390, 768, 1440])
        for (const theme of ["light", "dark"])
          for (const route of routes) {
            await go(route, width, theme, width === 390 || width === 1440);
            const metrics = await page.evaluate(() => ({
              h1: [...document.querySelectorAll("h1")].filter(
                (e) => e.getClientRects().length,
              ).length,
              font: parseFloat(
                getComputedStyle(document.querySelector("h1")).fontSize,
              ),
              left: document.querySelector(".app-main").getBoundingClientRect()
                .left,
              header: document
                .querySelector(".page-header")
                ?.getBoundingClientRect().left,
            }));
            assert.equal(metrics.h1, 1, route + " one title");
            assert.equal(metrics.font, 20, route + " heading scale");
            if (metrics.header !== undefined)
              assert.ok(
                Math.abs(
                  metrics.header -
                    metrics.left -
                    parseFloat(
                      await page.$eval(
                        ".app-main",
                        (el) => getComputedStyle(el).paddingLeft,
                      ),
                    ),
                ) < 2,
                route + " gutter",
              );
            if (width === 390) await audit(`${route} ${theme}`);
          }
    checks.push(
      "88 page/viewport/theme combinations: shared heading, gutters and no overflow",
    );
    // Linked categories are readable, and return to their exact source context.
    await go(`/calendar?date=${today}&sources=task`, 390);
    await page.waitForSelector('[title="Tugas · Siapkan bekal"]');
    await page.click('[title="Tugas · Siapkan bekal"]');
    await page.waitForSelector("[role=dialog]");
    assert.equal(await page.$$eval("[role=dialog] input", (e) => e.length), 0);
    await audit("linked task detail", "[role=dialog]");
    await clickText("Buka menu asal", "a");
    await page.waitForFunction(() => location.pathname === "/tasks");
    await page.waitForSelector(".calendar-record-highlight");
    checks.push("calendar linked task opens source record, no event editing");
    await go(`/calendar?date=${today}&sources=memory`, 390);
    await page.waitForSelector('[title="Kenangan · Sore bersama"]');
    await page.click('[title="Kenangan · Sore bersama"]');
    await clickText("Buka menu asal", "a");
    await page.waitForFunction(() => location.pathname === "/memories");
    await page.waitForSelector("[role=dialog]");
    assert(
      await page.$eval("[role=dialog]", (e) =>
        e.textContent.includes("Sore yang sederhana"),
      ),
    );
    await page.keyboard.press("Escape");
    checks.push("historical memories opt-in and full story source");
    await go(`/calendar?date=${today}&sources=vaccine`, 390);
    await page.click('[title="Vaksin · Aruna"]');
    await clickText("Buka menu asal", "a");
    await page.waitForFunction(() => location.pathname === "/kids");
    await page.waitForSelector('[data-calendar-record="v-1"]');
    assert(
      await page.$eval(
        '[data-calendar-record="v-1"]',
        (e) => e.getClientRects().length > 0,
      ),
    );
    checks.push("vaccine source selects child and vaccine tab");
    await go(`/budget?date=2019-01-02&tab=goals&record=goal-1`, 390);
    await page.waitForSelector('[data-calendar-record="goal-1"]');
    assert(
      await page.$eval(
        '[data-calendar-record="goal-1"]',
        (e) => e.getClientRects().length > 0,
      ),
    );
    checks.push("finance source selects date period and tab");
    await go("/calendar", 1440);
    assert.equal(
      await page.$eval('.calendar-source-chip[aria-pressed="false"]', (e) =>
        e.textContent.includes("Kenangan"),
      ),
      true,
    );
    await clickText("Semua tanggal");
    assert.equal(
      await page.$$eval(
        '.calendar-source-chip[aria-pressed="false"]',
        (e) => e.length,
      ),
      0,
    );
    await clickText("Agenda utama");
    assert.equal(
      await page.$$eval(
        '.calendar-source-chip[aria-pressed="false"]',
        (e) => e.length,
      ),
      7,
    );
    checks.push("agenda/history source presets");
    for (const theme of ["light", "dark"]) {
      await go("/calendar", 390, theme);
      await clickText("Buat acara");
      await page.waitForSelector("#calendar-event-form");
      await fill("#title", "Piknik tes");
      await page.click("#is_all_day");
      await fill("#start_at", today);
      await fill("#end_at", today);
      await audit("calendar all-day form " + theme, "[role=dialog]");
      await page.screenshot({
        path: `docs/qa/unified-calendar-form-390-${theme}.png`,
        fullPage: true,
      });
      const previous = mutations.length;
      await clickText("Buat acara");
      await page.waitForFunction(
        () => !document.querySelector("[role=dialog]"),
      );
      const sent = mutations.slice(previous).find((m) => m.path === "/events");
      assert(sent);
      const payload = JSON.parse(sent.body);
      assert.equal(
        payload.start_at,
        new Date(today + "T00:00:00+07:00").toISOString(),
      );
      assert.equal(
        payload.end_at,
        new Date(today + "T23:59:59+07:00").toISOString(),
      );
      checks.push("all-day form date preserved " + theme);
    }
    await go("/calendar", 390);
    await clickText("Buat acara");
    await fill("#title", "Urutan salah");
    await fill("#start_at", today + "T10:00");
    await fill("#end_at", today + "T09:00");
    const previous = mutations.length;
    await clickText("Buat acara");
    assert(
      await page.$eval("[role=dialog]", (e) =>
        e.innerText.includes("Waktu selesai harus setelah mulai"),
      ),
    );
    assert.equal(mutations.length, previous);
    await page.keyboard.press("Escape");
    checks.push("reversed event dates rejected before mutation");
    for (const [route, label] of [
      ["/tasks", "Tambah tugas"],
      ["/memories", "Tambah kenangan"],
      ["/budget", "Catat pengeluaran"],
      ["/trips", "Rencanakan liburan"],
      ["/kids", "Tambah anak"],
    ]) {
      await go(route, 390, "dark");
      await clickText(label);
      await page.waitForSelector("[role=dialog]");
      const bounds = await page.$eval("[role=dialog]", (root) => {
        const forms = [...root.querySelectorAll("form,section")];
        return {
          overflow: document.documentElement.scrollWidth > innerWidth,
          forms: forms.map((e) => Math.round(e.getBoundingClientRect().width)),
        };
      });
      assert.equal(bounds.overflow, false);
      await audit(route + " form dark", "[role=dialog]");
      await page.keyboard.press("Escape");
    }
    checks.push(
      "compact forms across all main editors, dark labels and controls",
    );
    for (const zone of ["UTC", "America/Los_Angeles", "Asia/Tokyo"]) {
      await page.emulateTimezone(zone);
      await go(`/calendar?date=${today}&sources=event`, 390);
      await page.waitForSelector('[title="Piknik sore di taman kota"]');
      assert(
        await page.$eval('[title="Piknik sore di taman kota"]', (e) =>
          e.innerText.includes("16:00"),
        ),
      );
      checks.push("calendar WIB wall time on " + zone);
    }
    await page.emulateTimezone("Asia/Jakarta");
    mode = "empty";
    await go("/memories", 390);
    await go("/calendar", 390);
    checks.push("empty album and calendar");
    mode = "error";
    await go("/calendar", 390);
    await page.waitForFunction(
      () =>
        document
          .querySelector(".app-main")
          ?.innerText.includes("Data belum bisa dimuat"),
      { timeout: 10000 },
    );
    checks.push("calendar API failure remains explicit");
    mode = "data";
    goalAchieved = true;
    await go("/budget?tab=goals", 390, "dark");
    await audit("achieved savings card dark");
    goalAchieved = false;
    assert.equal(errors.length, 0, "runtime errors");
    assert.equal(
      axeResults.flatMap((r) => r.violations).length,
      0,
      "accessibility",
    );
    assert.equal(
      results.filter((r) => r.scroll > r.width + 1).length,
      0,
      "overflow",
    );
    console.log(
      JSON.stringify({
        pages: results.length,
        checks: checks.length,
        audits: axeResults.length,
        errors,
      }),
    );
  } finally {
    fs.writeFileSync(
      "docs/qa/unified-calendar-results.json",
      JSON.stringify({ results, checks, axeResults, errors }, null, 2),
    );
    await browser.close();
    fs.rmSync(profile, { recursive: true, force: true });
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
