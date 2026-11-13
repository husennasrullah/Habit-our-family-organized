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
          is_achieved: false,
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
        path: `docs/qa/${route.replaceAll("/", "-").slice(1)}-${width}-${theme}.png`,
        fullPage: true,
      });
  }
  try {
    if (process.env.HABIT_QA_REFERENCE) {
      const routes = [
        "/dashboard",
        "/tasks",
        "/calendar",
        "/budget",
        "/meals",
        "/kids",
        "/memories",
        "/documents",
        "/settings",
        "/trips",
        "/trips/trip-1",
      ];
      for (const fixture of ["empty", "data"])
        for (const theme of ["light", "dark"])
          for (const width of [375, 390, 768, 1040, 1440]) {
            mode = fixture;
            await go("/dashboard", width, theme);
            await page.setViewport({
              width,
              height: 900,
              isMobile: width < 768,
              deviceScaleFactor: 1,
            });
            await sleep(100);
            const layout = await page.evaluate(() => ({
              font: getComputedStyle(document.body).fontFamily,
              fontSize: getComputedStyle(document.body).fontSize,
              headerHeadings: document
                .querySelector(".app-topbar")
                .querySelectorAll("h1,h2").length,
              mainHeadings: document
                .querySelector("main")
                .querySelectorAll("h1").length,
              summaryBottom: document
                .querySelector(".dashboard-family-summary")
                .getBoundingClientRect().bottom,
              sidebarWidth: document
                .querySelector(".app-sidebar")
                .getBoundingClientRect().width,
              contentLeft: document
                .querySelector(".dashboard-hero")
                .getBoundingClientRect().left,
              contentRight: document
                .querySelector(".dashboard-hero")
                .getBoundingClientRect().right,
            }));
            assert(
              layout.font.toLowerCase().includes("jakarta"),
              "new font loaded",
            );
            assert.equal(layout.fontSize, "13px");
            assert.equal(layout.headerHeadings, 0);
            assert.equal(layout.mainHeadings, 1);
            if (width === 1440 && fixture === "empty")
              assert(
                layout.summaryBottom < 900,
                "family summary fits first desktop screen",
              );
            if (width >= 1024) {
              assert.equal(layout.sidebarWidth, 208);
              assert(layout.contentLeft >= layout.sidebarWidth + 24,
                "dashboard content clears the fixed sidebar and gutter");
            }
            assert(layout.contentRight <= width - 16,
              "dashboard content stays inside the right gutter");
            results[results.length - 1].layout = layout;
            if ([390, 1040, 1440].includes(width))
              await page.screenshot({
                path: `docs/qa/reference-dashboard-${fixture}-${width}-${theme}.png`,
                fullPage: false,
              });
            if (width === 1440 || width === 390) {
              await page.addScriptTag({ path: axePath });
              const audit = await page.evaluate(async () => {
                const result = await axe.run(document, {
                  runOnly: {
                    type: "rule",
                    values: [
                      "button-name",
                      "label",
                      "color-contrast",
                      "nested-interactive",
                    ],
                  },
                });
                return result.violations.map((v) => ({
                  id: v.id,
                  nodes: v.nodes.map((n) => ({
                    target: n.target,
                    summary: n.failureSummary,
                  })),
                }));
              });
              axeResults.push({
                route: "/dashboard",
                theme,
                width,
                fixture,
                violations: audit,
              });
            }
          }
      mode = "empty";
      for (const [width, height] of [
        [1040, 600],
        [1228, 620],
        [1366, 768],
        [1440, 900],
      ]) {
        await go("/dashboard", width, "light");
        await page.setViewport({ width, height, deviceScaleFactor: 1 });
        await sleep(150);
        const compact = await page.$eval(".dashboard-family-summary", (el) => ({
          bottom: el.getBoundingClientRect().bottom,
        }));
        assert(
          compact.bottom <= height + 6,
          `compact dashboard fits ${width}x${height}: ${compact.bottom}`,
        );
        results[results.length - 1].compact = { width, height, ...compact };
        await page.screenshot({
          path: `docs/qa/reference-dashboard-${width}x${height}.png`,
        });
      }
      mode = "data";
      for (const route of routes.slice(1))
        for (const width of [390, 1440]) {
          await go(route, width);
          const header = await page.evaluate(() => ({
            main: document.querySelector("main").querySelectorAll("h1").length,
            toolbar: document.querySelector(".app-topbar").innerText,
          }));
          assert.equal(header.main, 1, `${route} has one page heading`);
          assert(!header.toolbar.includes("Ruang keluarga"));
        }
      await go("/dashboard", 390);
      await page.click('[aria-label="Buka navigasi"]');
      await sleep(100);
      assert(await page.$eval("#dashboard-background", (el) => el.inert));
      await page.keyboard.press("Escape");
      await sleep(100);
      assert.equal(
        await page.$eval("#dashboard-background", (el) => el.inert),
        false,
      );
      await page.click('[aria-label="Buka pengingat tugas"]');
      assert(
        await page.$eval(
          ".reminder-menu",
          (el) => el.getClientRects().length > 0,
        ),
      );
      await page.keyboard.press("Escape");
      assert.equal(
        await page.$eval(".reminder-menu", (el) => el.getClientRects().length),
        0,
      );
      await page.click('[aria-label="Buka menu akun Nadia Pratama"]');
      assert(
        await page.$eval(
          ".account-menu",
          (el) => el.getClientRects().length > 0,
        ),
      );
      await page.keyboard.press("Escape");
      await go("/dashboard", 1440);
      await page.click('[aria-label="Ringkas navigasi"]');
      await sleep(300);
      assert.equal(
        await page.$eval(".app-sidebar", (el) =>
          Math.round(el.getBoundingClientRect().width),
        ),
        80,
      );
      await page.click('[aria-label="Perluas navigasi"]');
      await sleep(300);
      assert.equal(
        await page.$eval(".app-sidebar", (el) =>
          Math.round(el.getBoundingClientRect().width),
        ),
        208,
      );
    } else {
      for (const width of process.env.HABIT_QA_QUICK
        ? [390, 1440]
        : [375, 390, 768, 1440])
        for (const route of [
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
        ])
          await go(route, width, "light", width === 390 || width === 1440);
      await go("/dashboard", 390, "dark", true);
      await go("/budget", 1440, "dark", true);
      await go("/tasks", 390);
      await page.evaluate(() =>
        [...document.querySelectorAll("button")]
          .find((e) => e.textContent.includes("Tambah Tugas"))
          .click(),
      );
      await page.waitForSelector("[role=dialog]");
      assert(
        await page.evaluate(
          () =>
            document
              .querySelector("#dashboard-background")
              .closest("[inert]") !== null ||
            document.querySelector("#__next")?.inert ||
            document.body.querySelector("body > div[inert]") !== null,
        ),
      );
      await page.keyboard.press("Escape");
      await sleep(100);
      assert.equal(await page.$("[role=dialog]"), null);
      await go("/dashboard", 390);
      await page.click('[aria-label="Buka navigasi"]');
      await sleep(100);
      assert(await page.$eval("#dashboard-background", (el) => el.inert));
      await page.keyboard.press("Escape");
      await sleep(100);
      assert.equal(
        await page.$eval("#dashboard-background", (el) => el.inert),
        false,
      );
      await page.click('[aria-label="Buka navigasi"]');
      await page.setViewport({ width: 1440, height: 1000 });
      await sleep(300);
      assert.equal(await page.evaluate(() => document.body.style.overflow), "");
      mode = "empty";
      for (const route of [
        "/dashboard",
        "/tasks",
        "/calendar",
        "/meals",
        "/budget",
        "/kids",
        "/memories",
        "/documents",
        "/trips",
      ])
        await go(route, 390);
      mode = "error";
      for (const route of [
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
      ])
        await go(route, 390);
      mode = "data";
      for (const theme of ["light", "dark"])
        for (const route of [
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
        ]) {
          await go(route, 390, theme);
          await page.addScriptTag({ path: axePath });
          const audit = await page.evaluate(async () => {
            const result = await axe.run(document, {
              runOnly: {
                type: "rule",
                values: [
                  "button-name",
                  "label",
                  "aria-dialog-name",
                  "color-contrast",
                  "nested-interactive",
                ],
              },
            });
            return result.violations.map((v) => ({
              id: v.id,
              impact: v.impact,
              nodes: v.nodes
                .map((n) => ({ target: n.target, summary: n.failureSummary }))
                .slice(0, 8),
            }));
          });
          axeResults.push({ route, theme, violations: audit });
        }

      async function clickText(text, root = "button") {
        const clicked = await page.evaluate(
          ({ text, root }) => {
            const el = [...document.querySelectorAll(root)].find(
              (e) =>
                e.getClientRects().length &&
                e.textContent.toLowerCase().includes(text.toLowerCase()),
            );
            if (el) {
              el.click();
              return true;
            }
            return false;
          },
          { text, root },
        );
        assert(clicked, "click " + text);
        await sleep(100);
      }
      for (const [route, label] of [
        ["/calendar", "Buat Acara"],
        ["/budget", "Catat pengeluaran"],
        ["/memories", "Tambah Kenangan"],
        ["/trips", "Rencanakan liburan"],
        ["/trips/trip-1", "Edit Liburan"],
        ["/trips/trip-1", "Anggota"],
        ["/trips/trip-1", "Tambah Aktivitas"],
      ]) {
        await go(route, 390, "light");
        if (label === "Tambah Aktivitas") {
          await clickText("Tambah", "button");
        } else await clickText(label);
        await page.waitForSelector("[role=dialog]", { timeout: 4000 });
        await page.addScriptTag({ path: axePath });
        const modalAudit = await page.evaluate(async () => {
          const result = await axe.run(
            document.querySelector("[role=dialog]"),
            {
              runOnly: {
                type: "rule",
                values: [
                  "button-name",
                  "label",
                  "aria-dialog-name",
                  "color-contrast",
                ],
              },
            },
          );
          return result.violations.map((v) => ({
            id: v.id,
            nodes: v.nodes.map((n) => ({
              target: n.target,
              summary: n.failureSummary,
            })),
          }));
        });
        axeResults.push({
          route,
          theme: "light",
          dialog: label,
          violations: modalAudit,
        });
        await page.keyboard.press("Tab");
        assert(
          await page.evaluate(() =>
            document
              .querySelector("[role=dialog]")
              .contains(document.activeElement),
          ),
        );
        await page.keyboard.press("Escape");
        await sleep(100);
        assert.equal(
          await page.$("[role=dialog]"),
          null,
          label + " Escape closes",
        );
      }
      await go("/tasks", 390, "light");
      await clickText("Tambah Tugas");
      await page.waitForSelector("[role=dialog]");
      await page.type("[role=dialog] input[name=title]", "Tugas uji tampilan");
      await clickText("Buat Tugas", "[role=dialog] button");
      await page.waitForFunction(
        () => !document.querySelector("[role=dialog]"),
      );
      assert(
        mutations.some(
          (m) =>
            m.path === "/tasks" &&
            m.method === "POST" &&
            m.body?.includes("Tugas uji tampilan"),
        ),
      );
      await go("/dashboard", 390, "light");
      await page.click(
        '[aria-label="Selesaikan Siapkan bekal untuk piknik keluarga"]',
      );
      await sleep(300);
      assert.equal(tasks[0].status, "done");
      await go("/meals", 390, "light");
      await page.evaluate(() =>
        [...document.querySelectorAll("button")]
          .find((e) => e.textContent.includes("Tambah menu"))
          .click(),
      );
      await page.waitForSelector("[role=dialog]");
      await page.keyboard.press("Tab");
      assert(
        await page.evaluate(() =>
          document
            .querySelector("[role=dialog]")
            .contains(document.activeElement),
        ),
      );
      await page.keyboard.press("Escape");
      await page.removeScriptToEvaluateOnNewDocument(init.identifier);
      await page.evaluate(() => localStorage.clear());
      await page.deleteCookie({ name: "access_token", url: origin });
      for (const route of ["/login", "/register", "/onboarding"])
        for (const width of [390, 1440]) {
          await go(route, width, "light", true);
        }
      await go("/login", 390, "light");
      await page.type("input[type=email]", "nadia@example.test");
      await page.type("input[autocomplete=current-password]", "test-password");
      await page.click("button[type=submit]");
      await page.waitForFunction(() => location.pathname === "/dashboard");
    }
  } finally {
    fs.writeFileSync(
      process.env.HABIT_QA_REFERENCE
        ? "docs/qa/reference-results.json"
        : "docs/qa/browser-results.json",
      JSON.stringify({ results, errors, mutations, axeResults }, null, 2),
    );
    await browser.close();
    fs.rmSync(profile, { recursive: true, force: true });
  }
  assert.equal(errors.length, 0, "no browser runtime errors");
  assert.equal(
    axeResults.flatMap((result) => result.violations).length,
    0,
    "no violations in selected axe rules",
  );
  assert.equal(
    results.filter((r) => r.scroll > r.width + 1).length,
    0,
    "no horizontal overflow",
  );
  console.log(
    JSON.stringify(
      {
        pages: results.length,
        overflow: results.filter((r) => r.scroll > r.width + 1),
        errors,
        axeResults,
      },
      null,
      2,
    ),
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
