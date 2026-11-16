// Vaccine date checks use intercepted API fixtures, never real family data.
const fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const modules =
  process.env.HABIT_QA_MODULES || "/tmp/habit-unified-qa/node_modules";
const puppeteer = require(path.join(modules, "puppeteer-core"));
const origin = process.env.HABIT_QA_URL || "http://127.0.0.1:3100";
const user = {
  id: "member-1",
  family_id: "family-1",
  name: "Nadia",
  email: "qa@example.test",
  role: "admin",
  color: "sky",
};
const kid = {
  id: "kid-1",
  family_id: user.family_id,
  name: "Aruna",
  birth_date: "2019-01-01",
  gender: "female",
  notes: "",
};
const result = { checks: [], errors: [], violations: [] };
let vaccines = [],
  mutations = [];
(async () => {
  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/google-chrome",
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  try {
    const page = await browser.newPage();
    await page.emulateTimezone("Asia/Jakarta");
    await page.setViewport({ width: 390, height: 844 });
    await page.setBypassServiceWorker(true);
    page.on("pageerror", (e) => result.errors.push(e.message));
    await page.setRequestInterception(true);
    page.on("request", async (req) => {
      const p = new URL(req.url()).pathname.split("/api/v1")[1];
      if (p === undefined) return req.continue();
      let data = [];
      if (p === "/auth/me") data = user;
      else if (p.startsWith("/auth/"))
        data = {
          access_token: "qa-token",
          refresh_token: "qa-refresh",
          member: user,
        };
      else if (p === "/family")
        data = { id: user.family_id, name: "Keluarga QA" };
      else if (p === "/family/members") data = [user];
      else if (p === "/kids") data = [kid];
      else if (p === `/kids/${kid.id}/vaccines`) {
        if (req.method() === "POST") {
          const payload = JSON.parse(req.postData());
          mutations.push(payload);
          vaccines.push({
            ...payload,
            id: "vaccine-1",
            status: payload.given_date ? "given" : "scheduled",
          });
          data = vaccines.at(-1);
        } else data = vaccines;
      }
      await req.respond({
        status: req.method() === "OPTIONS" ? 204 : 200,
        contentType: "application/json",
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "*",
          "Access-Control-Allow-Methods": "*",
        },
        body:
          req.method() === "OPTIONS"
            ? ""
            : JSON.stringify({ data, message: "success" }),
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
      localStorage.setItem("refresh_token", "qa-refresh");
      localStorage.setItem("theme", "dark");
      localStorage.setItem("pwa-prompt-dismissed", String(Date.now()));
    }, user);
    await page.setCookie({
      name: "access_token",
      value: "qa-token",
      url: origin,
    });
    await page.goto(origin + "/kids", { waitUntil: "networkidle0" });
    const click = async (text) => {
      await page.evaluate((text) => {
        const b = [...document.querySelectorAll("button")].find(
          (b) => b.textContent.trim() === text,
        );
        if (!b) throw Error("Missing " + text);
        b.click();
      }, text);
    };
    const fill = async (selector, value) =>
      page.$eval(
        selector,
        (e, value) => {
          Object.getOwnPropertyDescriptor(
            HTMLInputElement.prototype,
            "value",
          ).set.call(e, value);
          e.dispatchEvent(new Event("input", { bubbles: true }));
          e.dispatchEvent(new Event("change", { bubbles: true }));
        },
        value,
      );
    await click("Vaksin");
    await page.waitForFunction(() =>
      [...document.querySelectorAll("button")].some(
        (b) => b.textContent.trim() === "Tambah vaksin",
      ),
    );
    await click("Tambah vaksin");
    await page.waitForSelector("#kid-given_date");
    await fill("#kid-vaccine_name", "Vaksin uji");
    await fill("#kid-scheduled_date", "2020-02-02");
    const today = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Jakarta",
    });
    assert.equal(await page.$eval("#kid-given_date", (e) => e.max), today);
    assert.equal(
      await page.$eval("#kid-given_date", (e) =>
        e.getAttribute("aria-describedby"),
      ),
      "kid-given_date-help",
    );
    result.checks.push(
      "actual date max is today, never the scheduled date; field help linked",
    );
    for (const date of ["2020-02-01", "2020-02-02", "2020-02-03"]) {
      await fill("#kid-given_date", date);
      assert(await page.$eval("#kid-given_date", (e) => e.checkValidity()));
    }
    result.checks.push("actual dates before, on and after schedule accepted");
    await fill("#kid-given_date", "2999-01-02");
    await click("Simpan");
    assert.equal(mutations.length, 0);
    assert.match(
      await page.$eval("#kid-given_date", (e) => e.validationMessage),
      /hari ini/,
    );
    result.checks.push("future actual date blocked with clear today message");
    await fill("#kid-given_date", "2018-12-31");
    assert.equal(
      await page.$eval("#kid-given_date", (e) => e.checkValidity()),
      false,
    );
    assert.match(
      await page.$eval("#kid-given_date", (e) => e.validationMessage),
      /tanggal lahir/,
    );
    result.checks.push("pre-birth date still blocked");
    await fill("#kid-given_date", "2020-02-03");
    assert(await page.$eval("#kid-given_date", (e) => e.checkValidity()));
    result.checks.push("corrected input clears custom validity");
    await page.addScriptTag({
      path: path.join(modules, "axe-core/axe.min.js"),
    });
    result.violations = await page.evaluate(async () =>
      (
        await axe.run(document.querySelector("[role=dialog]"), {
          runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
        })
      ).violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
    );
    assert.deepEqual(result.violations, []);
    fs.mkdirSync(path.resolve(__dirname, "../../docs/qa"), { recursive: true });
    await page.screenshot({
      path: path.resolve(
        __dirname,
        "../../docs/qa/vaccine-date-help-390-dark.png",
      ),
      fullPage: true,
    });
    await click("Simpan");
    await page.waitForFunction(() => !document.querySelector("[role=dialog]"));
    assert.equal(mutations.length, 1);
    assert.equal(mutations[0].scheduled_date, "2020-02-02");
    assert.equal(mutations[0].given_date, "2020-02-03");
    result.checks.push("after-schedule actual date submitted successfully");
    assert.deepEqual(result.errors, []);
    console.log(
      JSON.stringify({
        checks: result.checks.length,
        errors: result.errors,
        violations: result.violations,
      }),
    );
  } finally {
    fs.writeFileSync(
      path.resolve(__dirname, "../../docs/qa/vaccine-date-help-results.json"),
      JSON.stringify(result, null, 2),
    );
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
