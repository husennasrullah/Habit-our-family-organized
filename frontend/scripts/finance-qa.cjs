// Browser flow checks with an isolated fixture API; PostgreSQL correctness is tested in backend/internal/services/finance_test.go.
const path = require("node:path"),
  fs = require("node:fs"),
  os = require("node:os"),
  assert = require("node:assert/strict");
process.chdir(path.resolve(__dirname, "../.."));
const modules = process.env.HABIT_QA_MODULES;
const puppeteer = require(
  modules ? path.join(modules, "puppeteer-core") : "puppeteer-core",
);
const origin = process.env.HABIT_QA_URL || "http://localhost:3000";
const user = {
  id: "11111111-1111-4111-8111-111111111111",
  family_id: "22222222-2222-4222-8222-222222222222",
  name: "Nadia Pratama",
  email: "nadia@example.test",
  role: "admin",
  auth_provider: "email",
  color: "#007f5b",
};
const result = { checks: [], errors: [], mutations: [], audits: [] };
(async () => {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "habit-finance-qa-"));
  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/google-chrome",
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
    userDataDir: profile,
  });
  const page = await browser.newPage();
  await page.setBypassServiceWorker(true);
  await page.emulateTimezone("Asia/Jakarta");
  let expenses = [],
    budgets = [],
    goals = [],
    items = [],
    entries = [],
    failBudget = false;
  const audit = async (name) => {
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
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      })),
    );
    result.audits.push({ name, violations });
    assert.equal(violations.length, 0, JSON.stringify(violations));
  };
  const stamp = () => new Date().toISOString();
  let counter = 0;
  const id = () =>
    `33333333-3333-4333-8333-${String(++counter).padStart(12, "0")}`;
  await page.setRequestInterception(true);
  page.on("request", async (req) => {
    const url = new URL(req.url());
    if (!url.pathname.startsWith("/api/v1")) return req.continue();
    const method = req.method(),
      p = url.pathname.slice("/api/v1".length);
    let body = {};
    try {
      body = JSON.parse(req.postData() || "{}");
    } catch {}
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "*",
    };
    if (method === "OPTIONS") return req.respond({ status: 204, headers });
    let data = [],
      status = 200;
    if (method !== "GET") result.mutations.push({ method, path: p, body });
    if (p === "/auth/me") data = user;
    else if (p === "/expenses/summary") {
      const list = expenses.filter(
        (e) =>
          Number(e.date.slice(5, 7)) ===
            Number(url.searchParams.get("month")) &&
          Number(e.date.slice(0, 4)) === Number(url.searchParams.get("year")),
      );
      const grouped = {};
      for (const e of list) {
        grouped[e.category] ??= { category: e.category, total: 0, count: 0 };
        grouped[e.category].total += e.amount;
        grouped[e.category].count++;
      }
      data = {
        total: list.reduce((s, e) => s + e.amount, 0),
        by_category: Object.values(grouped),
        by_month: [],
      };
    } else if (p === "/budgets") {
      if (failBudget && method === "GET")
        return req.respond({
          status: 500,
          headers,
          contentType: "application/json",
          body: JSON.stringify({ message: "QA unavailable" }),
        });
      if (method === "POST") {
        const existing = budgets.find(
          (b) =>
            b.category === body.category &&
            b.month === body.month &&
            b.year === body.year,
        );
        data = Object.assign(existing || {}, body, {
          id: existing?.id || id(),
        });
        if (!existing) budgets.push(data);
      } else
        data = budgets.filter(
          (b) =>
            b.month === Number(url.searchParams.get("month")) &&
            b.year === Number(url.searchParams.get("year")),
        );
    } else if (p === "/expenses") {
      if (method === "POST") {
        data = { ...body, id: id(), created_at: stamp(), currency: "IDR" };
        expenses.push(data);
      } else
        data = expenses.filter(
          (e) =>
            (!url.searchParams.get("category") ||
              e.category === url.searchParams.get("category")) &&
            Number(e.date.slice(5, 7)) ===
              Number(url.searchParams.get("month")) &&
            Number(e.date.slice(0, 4)) === Number(url.searchParams.get("year")),
        );
    } else if (p.startsWith("/expenses/")) {
      const key = p.split("/")[2];
      if (method === "DELETE") expenses = expenses.filter((e) => e.id !== key);
      else {
        data = expenses.find((e) => e.id === key);
        Object.assign(data, body);
      }
    } else if (p === "/financial-goals") {
      if (method === "POST") {
        data = {
          ...body,
          id: id(),
          created_at: stamp(),
          is_achieved: body.current_amount >= body.target_amount,
        };
        goals.push(data);
        if (body.current_amount > 0)
          entries.push({
            id: id(),
            goal_id: data.id,
            actor_name: user.name,
            amount: body.current_amount,
            balance_after: body.current_amount,
            kind: "opening",
            note: "Saldo awal",
            created_at: stamp(),
          });
      } else data = goals;
    } else if (p.startsWith("/financial-goals/")) {
      const key = p.split("/")[2];
      data = goals.find((g) => g.id === key);
      if (p.endsWith("/entries"))
        data = entries.filter((e) => e.goal_id === key);
      else if (p.endsWith("/progress")) {
        data.current_amount += body.amount;
        entries.unshift({
          id: id(),
          goal_id: key,
          actor_name: user.name,
          amount: body.amount,
          balance_after: data.current_amount,
          kind: "deposit",
          note: body.note,
          created_at: stamp(),
        });
        data.is_achieved = data.current_amount >= data.target_amount;
      } else if (method === "PUT") {
        const before = data.current_amount;
        Object.assign(data, body);
        data.is_achieved = data.current_amount >= data.target_amount;
        if (body.current_amount !== undefined && before !== body.current_amount)
          entries.unshift({
            id: id(),
            goal_id: key,
            actor_name: user.name,
            amount: body.current_amount - before,
            balance_after: body.current_amount,
            kind: "adjustment",
            note: "Koreksi saldo",
            created_at: stamp(),
          });
      }
    } else if (p === "/shopping-items") {
      if (method === "POST") {
        data = { ...body, id: id(), is_checked: false };
        items.push(data);
      } else data = items;
    } else if (p === "/shopping-items/checkout") {
      data = {
        ...body,
        id: id(),
        currency: "IDR",
        description: "Belanja: Beras",
        created_at: stamp(),
      };
      expenses.push(data);
      items = items.filter((i) => !body.item_ids.includes(i.id));
    } else if (p.endsWith("/check")) {
      data = items.find((i) => i.id === p.split("/")[2]);
      data.is_checked = !data.is_checked;
    }
    return req.respond({
      status,
      headers,
      contentType: "application/json",
      body: JSON.stringify({ data }),
    });
  });
  page.on("pageerror", (e) => result.errors.push(e.message));
  page.on("dialog", (d) => d.accept());
  await page.setCookie({
    name: "access_token",
    value: "qa-token",
    url: origin,
  });
  await page.evaluateOnNewDocument(
    ({ user }) => {
      localStorage.setItem(
        "keluarga-auth",
        JSON.stringify({
          state: { user, accessToken: "qa-token", isAuthenticated: true },
          version: 0,
        }),
      );
      localStorage.setItem("access_token", "qa-token");
      localStorage.setItem("theme", "light");
      localStorage.setItem("pwa-prompt-dismissed", String(Date.now()));
      document.cookie = "access_token=qa-token; path=/";
    },
    { user },
  );
  const check = (name) => result.checks.push(name);
  const button = async (name, scope = "body") => {
    const selector = await page.evaluateHandle(
      ({ name, scope }) =>
        [...document.querySelector(scope).querySelectorAll("button")].find(
          (b) => b.textContent.trim() === name,
        ),
      { name, scope },
    );
    assert(await selector.asElement(), `button ${name}`);
    await selector.asElement().click();
    await selector.dispose();
  };
  const fill = async (selector, value) => {
    await page.$eval(
      selector,
      (el, value) => {
        el.value = "";
        el.dispatchEvent(new Event("input", { bubbles: true }));
      },
      "",
    );
    await page.click(selector, { clickCount: 3 });
    await page.keyboard.press("Backspace");
    await page.type(selector, String(value));
  };
  const dialog = async () => {
    await page.waitForSelector('[role="dialog"]');
    const bounds = await page.$eval(".finance-dialog-card", (el) => {
      const r = el.getBoundingClientRect();
      return { width: r.width, top: r.top, bottom: r.bottom };
    });
    assert(
      bounds.width <= 440 &&
        bounds.top >= 15 &&
        bounds.bottom <= page.viewport().height - 15,
      JSON.stringify(bounds),
    );
  };
  const closed = () =>
    page.waitForSelector('[role="dialog"]', { hidden: true });
  const tab = async (name) => {
    await button(name, '[role="tablist"]');
    await new Promise((r) => setTimeout(r, 200));
  };
  try {
    await page.setViewport({ width: 1366, height: 768 });
    await page.goto(origin + "/budget", { waitUntil: "networkidle0" });
    await page.waitForSelector("[role=tab]");
    assert.equal(await page.$$eval('[role="tab"]', (els) => els.length), 4);
    check("four flat finance tabs");
    await tab("Anggaran");
    await button("Buat anggaran");
    await dialog();
    await audit("budget-dialog");
    await page.select("#budget-category", "Belanja Rumah");
    await fill("#budget-amount", 100000);
    await button("Simpan anggaran", '[role="dialog"]');
    await closed();
    await page.waitForFunction(() =>
      document
        .querySelector('[role="tabpanel"]')
        .innerText.includes("Belanja Rumah"),
    );
    assert.equal(expenses.length, 0);
    assert.equal(budgets.length, 1);
    check("create first budget before any expense");
    await tab("Pengeluaran");
    await button("Catat pengeluaran", "main");
    await dialog();
    const localToday = await page.evaluate(() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    });
    assert.equal(await page.$eval("#exp-date", (el) => el.value), localToday);
    check("expense defaults to local date");
    await audit("expense-dialog");
    await page.screenshot({ path: "docs/qa/finance-expense-dialog-1366.png" });
    await fill("#exp-amount", 25000);
    await page.select("#exp-cat", "Belanja Rumah");
    await fill("#exp-desc", "Kebutuhan rumah");
    await button("Tambah", '[role="dialog"]');
    await closed();
    assert.equal(expenses.length, 1);
    check("record expense");
    await tab("Belanja");
    await fill('input[aria-label="Item belanja baru"]', "Beras");
    await page.click('button[aria-label="Tambah"]');
    await page.waitForFunction(() =>
      document.querySelector('[role="tabpanel"]').innerText.includes("Beras"),
    );
    assert.equal(
      await page.$eval(
        ".shopping-check-mark",
        (el) => el.getBoundingClientRect().width,
      ),
      20,
    );
    await page.screenshot({ path: "docs/qa/finance-checklist-1366.png" });
    await page.click('[role="tabpanel"] button[role="checkbox"]');
    await page.waitForFunction(() =>
      document.body.innerText.includes("Selesaikan belanja"),
    );
    await button("Selesaikan belanja");
    await dialog();
    await audit("checkout-dialog");
    await fill("#exp-amount", 50000);
    await page.select("#exp-cat", "Belanja Rumah");
    await button("Catat belanja", '[role="dialog"]');
    await closed();
    await page.waitForFunction(
      () =>
        document.querySelector('[role="tab"][aria-selected="true"]')
          .innerText === "Pengeluaran",
    );
    assert.equal(items.length, 0);
    assert.equal(expenses.length, 2);
    check("checkout creates one expense and leaves shopping list");
    await tab("Tabungan");
    await button("Tambah tabungan", "main");
    await dialog();
    await audit("goal-dialog");
    await fill("#field-GoalModal-componentsbudget-0", "Dana darurat");
    await fill("#field-GoalModal-componentsbudget-1", 100000);
    await fill("#field-GoalModal-componentsbudget-2", 10000);
    await button("Simpan", '[role="dialog"]');
    await closed();
    assert.equal(goals.length, 1);
    check("create savings goal with opening balance");
    await button("Tambah Dana");
    await dialog();
    await audit("deposit-dialog");
    await fill("#field-AddFundModal-componentsbudget-0", 15000);
    await fill("#deposit-note", "Setoran Ayah");
    await button("Tambahkan", '[role="dialog"]');
    await closed();
    assert.equal(goals[0].current_amount, 25000);
    check("add deposit with note");
    await button("Riwayat setoran");
    await dialog();
    await page.waitForFunction(() =>
      document
        .querySelector('[role="dialog"]')
        .innerText.includes("Setoran Ayah"),
    );
    assert(
      (await page.$eval('[role="dialog"]', (el) => el.innerText)).includes(
        user.name,
      ),
    );
    await audit("history-dialog");
    check("deposit history shows member date amount and note");
    await button("Tutup", '[role="dialog"]');
    await closed();
    await page.click('button[aria-label="Edit"]');
    await dialog();
    assert.equal(
      await page.$eval(
        "#field-GoalModal-componentsbudget-2",
        (el) => el.disabled,
      ),
      true,
    );
    await fill("#field-GoalModal-componentsbudget-1", 200000);
    await button("Simpan", '[role="dialog"]');
    await closed();
    const edit = result.mutations
      .filter(
        (m) => m.path.startsWith("/financial-goals/") && m.method === "PUT",
      )
      .at(-1);
    assert(!("current_amount" in edit.body));
    check("metadata edit does not overwrite savings balance");
    for (const width of [375, 390, 768, 1366]) {
      await page.setViewport({ width, height: 800, isMobile: width < 768 });
      for (const name of ["Pengeluaran", "Anggaran", "Tabungan", "Belanja"]) {
        await tab(name);
        assert(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
          `${name} overflow ${width}`,
        );
        check(`${name} fits ${width}`);
        if ([390, 1366].includes(width)) await audit(`${name}-${width}`);
        if ([390, 1366].includes(width))
          await page.screenshot({
            path: `docs/qa/finance-${name.toLowerCase()}-${width}.png`,
          });
      }
    }
    await page.setViewport({
      width: 390,
      height: 650,
      isMobile: true,
      hasTouch: true,
    });
    await tab("Anggaran");
    await button("Buat anggaran");
    await dialog();
    await page.screenshot({ path: "docs/qa/finance-budget-dialog-mobile.png" });
    await button("Batal", '[role="dialog"]');
    await closed();
    check("compact dialog fits mobile");
    await page.setViewport({
      width: 1366,
      height: 768,
      isMobile: false,
      hasTouch: false,
    });
    await tab("Anggaran");
    await page.evaluate(() => localStorage.setItem("theme", "dark"));
    await page.reload({ waitUntil: "networkidle0" });
    await tab("Anggaran");
    await page.screenshot({ path: "docs/qa/finance-anggaran-dark-1366.png" });
    check("dark theme budget");
    await audit("budget-dark");
    failBudget = true;
    await page.reload({ waitUntil: "networkidle0" });
    await page.waitForFunction(() =>
      document.body.innerText.includes("Tidak tersedia"),
    );
    check("failed budget request is not shown as zero");
    assert.equal(result.errors.length, 0);
  } finally {
    fs.writeFileSync(
      "docs/qa/finance-results.json",
      JSON.stringify(result, null, 2),
    );
    await browser.close();
    fs.rmSync(profile, { recursive: true, force: true });
  }
  console.log(
    JSON.stringify(
      {
        checks: result.checks.length,
        errors: result.errors,
        audits: result.audits.length,
      },
      null,
      2,
    ),
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
