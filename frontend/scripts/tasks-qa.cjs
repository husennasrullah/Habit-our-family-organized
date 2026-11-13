// Tasks UI checks with an in-memory fixture API; no family data is changed.
const path = require("node:path"),
  fs = require("node:fs"),
  assert = require("node:assert/strict");
const modules = process.env.HABIT_QA_MODULES;
const puppeteer = require(
  modules ? path.join(modules, "puppeteer-core") : "puppeteer-core",
);
const origin = process.env.HABIT_QA_URL || "http://127.0.0.1:3000";
const out = path.resolve(__dirname, "../../docs/qa");
const user = {
  id: "11111111-1111-4111-8111-111111111111",
  family_id: "22222222-2222-4222-8222-222222222222",
  name: "Nadia Pratama",
  email: "qa@example.test",
  role: "admin",
  auth_provider: "email",
  color: "#007f5b",
};
const child = {
  ...user,
  id: "33333333-3333-4333-8333-333333333333",
  name: "Raka",
  role: "child",
  avatar_url: "https://avatar.example.test/broken.png",
};
const result = { checks: [], errors: [], audits: [], mutations: [] };
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
    page.on("dialog", (dialog) => dialog.accept());
    const now = new Date(),
      today = now.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
    const yesterday = new Date(now.getTime() - 86400000).toLocaleDateString(
      "en-CA",
      { timeZone: "Asia/Jakarta" },
    );
    const fixture = () => [
      {
        id: "task-1",
        title: "Siapkan bekal untuk piknik",
        description: "Buah, air minum, dan camilan untuk keluarga.",
        assigned_to: user.id,
        status: "pending",
        due_date: today + "T00:00:00Z",
        points: 15,
      },
      {
        id: "task-2",
        title: "Rapikan ruang bermain",
        description: "Simpan mainan kembali ke tempatnya.",
        assigned_to: child.id,
        status: "in_progress",
        due_date: yesterday,
        points: 10,
      },
      {
        id: "task-3",
        title: "Siram tanaman di teras",
        description: "",
        assigned_to: null,
        status: "pending",
        due_date: null,
        points: 0,
      },
      {
        id: "task-4",
        title: "Bantu menata meja makan",
        description: "",
        assigned_to: child.id,
        status: "done",
        due_date: today,
        points: 10,
      },
    ];
    let tasks = fixture(),
      mode = "data",
      failSave = false;
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const u = new URL(req.url());
      if (u.hostname === "avatar.example.test")
        return req.respond({ status: 404, body: "" });
      if (!u.pathname.includes("/api/v1/")) return req.continue();
      const p = u.pathname.split("/api/v1")[1],
        method = req.method();
      const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "*",
      };
      const respond = (data, status = 200) =>
        req.respond({
          status,
          headers,
          contentType: "application/json",
          body: JSON.stringify({
            data,
            message: status === 200 ? "success" : "Gagal menyimpan fixture",
          }),
        });
      if (method === "OPTIONS") return req.respond({ status: 204, headers });
      if (
        (mode === "tasks-error" && p === "/tasks") ||
        (mode === "members-error" && p === "/family/members") ||
        (mode === "rank-error" && p === "/tasks/leaderboard")
      )
        return respond(null, 500);
      if (p === "/auth/me") return respond(user);
      if (p === "/family")
        return respond({
          id: user.family_id,
          name: "Keluarga Pratama",
          invite_code: "QA123",
        });
      if (p === "/family/members") return respond([user, child]);
      if (p === "/tasks/leaderboard")
        return respond(
          mode === "empty"
            ? []
            : [{ member_id: child.id, total_points: 0, tasks_done: 1 }],
        );
      if (p === "/tasks" && method === "GET")
        return respond(mode === "empty" ? [] : tasks);
      if (p.startsWith("/tasks") && method !== "GET") {
        const body = req.postData() ? JSON.parse(req.postData()) : {};
        result.mutations.push({ path: p, method, body });
        if (failSave) return respond(null, 400);
        if (method === "POST") {
          const task = { id: "new-" + Date.now(), ...body };
          tasks.push(task);
          return respond(task);
        }
        const task = tasks.find((t) => t.id === p.split("/")[2]);
        if (method === "DELETE") {
          tasks = tasks.filter((t) => t !== task);
          return respond(null);
        }
        if (method === "PUT") Object.assign(task, body);
        if (p.endsWith("/complete")) task.status = "done";
        return respond(task);
      }
      return respond([]);
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
    const pause = (ms) => new Promise((r) => setTimeout(r, ms));
    async function go(width = 1440) {
      await page.setViewport({ width, height: 950 });
      await page.goto(origin + "/tasks", { waitUntil: "networkidle0" });
      await page.waitForSelector(".task-toolbar");
    }
    async function click(selector) {
      await page.waitForSelector(selector);
      await page.click(selector);
      await pause(200);
    }
    async function text(selector, value) {
      const handle = await page.evaluateHandle(
        (s, v) =>
          [...document.querySelectorAll(s)].find(
            (e) => e.textContent.trim() === v,
          ),
        selector,
        value,
      );
      assert.ok(handle.asElement(), `missing ${value}`);
      await handle.asElement().click();
      await handle.dispose();
      await pause(200);
    }
    async function fill(selector, value) {
      await page.$eval(
        selector,
        (e, value) => {
          const setter = Object.getOwnPropertyDescriptor(
            HTMLInputElement.prototype,
            "value",
          ).set;
          setter.call(e, value);
          e.dispatchEvent(new Event("input", { bubbles: true }));
        },
        value,
      );
    }
    async function audit(name) {
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
      result.audits.push({ name, violations });
    }
    for (const width of [1440, 1024, 390, 375]) {
      tasks = fixture();
      await go(width);
      await page.waitForSelector(".task-card");
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
      await page.screenshot({
        path: path.join(out, `tasks-modern-${width}.png`),
        fullPage: true,
      });
      await audit(`tasks-${width}`);
      result.checks.push(`responsive-${width}`);
      await click('[aria-label="Edit Siapkan bekal untuk piknik"]');
      assert.equal(await page.$eval("#task-due", (e) => e.value), today);
      await page.screenshot({
        path: path.join(out, `tasks-modal-${width}.png`),
        fullPage: true,
      });
      await audit(`modal-${width}`);
      await click('[aria-label="Tutup"]');
    }
    await go();
    await fill(".task-search input", "tanaman");
    await pause(200);
    assert.equal(await page.$$eval(".task-card", (e) => e.length), 1);
    await text(".task-reset", "Reset filter");
    result.checks.push("search");
    await page.select("#task-member", child.id);
    assert.equal(await page.$$eval(".task-card", (e) => e.length), 2);
    await page.select("#task-member", "");
    await page.select("#task-due-filter", "overdue");
    assert.equal(await page.$$eval(".task-card", (e) => e.length), 1);
    await page.select("#task-due-filter", "all");
    result.checks.push("member and overdue filters");
    await click('[aria-label="Mulai Siapkan bekal untuk piknik"]');
    await page.waitForFunction(() =>
      document
        .querySelector(".task-column.is-progress")
        .textContent.includes("Siapkan bekal"),
    );
    await click('[aria-label="Selesaikan Siapkan bekal untuk piknik"]');
    await page.waitForFunction(() =>
      document
        .querySelector(".task-column.is-done")
        .textContent.includes("Siapkan bekal"),
    );
    await click('[aria-label="Buka kembali Siapkan bekal untuk piknik"]');
    await page.waitForFunction(() =>
      document
        .querySelector(".task-column.is-pending")
        .textContent.includes("Siapkan bekal"),
    );
    result.checks.push("start complete reopen");
    await click('[aria-label="Edit Siapkan bekal untuk piknik"]');
    await page.select("#task-assign", "");
    await fill("#task-due", "");
    await text("button", "Simpan");
    await page.waitForFunction(
      () => !document.querySelector('[role="dialog"]'),
    );
    assert.equal(tasks[0].assigned_to, null);
    assert.equal(tasks[0].due_date, null);
    result.checks.push("clear assignee and due date");
    await click(".task-add-button");
    await fill("#task-title", "Draft yang dibatalkan");
    await click('[aria-label="Tutup"]');
    await click(".task-add-button");
    assert.equal(await page.$eval("#task-title", (e) => e.value), "");
    result.checks.push("create modal reset");
    await fill("#task-title", "   ");
    await text("button", "Buat Tugas");
    assert.ok(await page.$('[role="dialog"]'));
    assert.ok(
      await page.$eval("#task-title", (e) =>
        e.className.includes("border-error"),
      ),
    );
    result.checks.push("reject whitespace title");
    await fill("#task-title", "  Tugas baru  ");
    await text("button", "Buat Tugas");
    await page.waitForFunction(
      () => !document.querySelector('[role="dialog"]'),
    );
    assert.equal(tasks.at(-1).title, "Tugas baru");
    result.checks.push("create trimmed task");
    failSave = true;
    await click('[aria-label="Edit Tugas baru"]');
    await fill("#task-title", "Tidak tersimpan");
    await text("button", "Simpan");
    assert.ok(await page.$('[role="dialog"]'));
    failSave = false;
    await click('[aria-label="Tutup"]');
    result.checks.push("failed save preserves form");
    await click('[aria-label="Hapus Tugas baru"]');
    await page.waitForFunction(
      () => !document.querySelector('[aria-label="Edit Tugas baru"]'),
    );
    result.checks.push("delete");
    await page.waitForFunction(
      () => document.querySelectorAll("[data-sonner-toast]").length === 0,
      { timeout: 15000 },
    );
    await click('[aria-label="Gunakan tema gelap"]');
    await page.screenshot({
      path: path.join(out, "tasks-modern-dark.png"),
      fullPage: true,
    });
    await audit("dark");
    await click('[aria-label="Gunakan tema terang"]');
    mode = "empty";
    await go();
    await page.waitForSelector(".task-column-empty");
    result.checks.push("empty state");
    mode = "rank-error";
    await go();
    await page.waitForFunction(
      () =>
        document
          .querySelector(".task-leaderboard")
          .textContent.includes("Poin belum bisa dimuat"),
      { timeout: 15000 },
    );
    result.checks.push("leaderboard error");
    mode = "members-error";
    await go();
    await page.waitForSelector(".task-inline-error", { timeout: 15000 });
    assert.equal(await page.$eval("#task-member", (e) => e.disabled), true);
    await click('[aria-label="Edit Rapikan ruang bermain"]');
    await text("button", "Simpan");
    await page.waitForFunction(
      () => !document.querySelector('[role="dialog"]'),
    );
    assert.equal(tasks.find((t) => t.id === "task-2").assigned_to, child.id);
    result.checks.push("members error preserves assignee");
    mode = "tasks-error";
    await go();
    await page.waitForSelector('[role="alert"]', { timeout: 15000 });
    result.checks.push("tasks error");
    assert.deepEqual(result.errors, []);
    fs.writeFileSync(
      path.join(out, "tasks-modern-results.json"),
      JSON.stringify(result, null, 2),
    );
    console.log(JSON.stringify(result, null, 2));
    assert.equal(
      result.audits.reduce((n, a) => n + a.violations.length, 0),
      0,
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
