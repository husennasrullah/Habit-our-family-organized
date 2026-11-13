// Fixture-only checks for profile and member avatar fallbacks.
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
  id: "user-qa",
  family_id: "family-qa",
  name: "Nadia",
  email: "qa@example.test",
  role: "admin",
  auth_provider: "email",
};
(async () => {
  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/google-chrome",
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const results = [];
  const errors = [];
  try {
    const page = await browser.newPage();
    await page.setBypassServiceWorker(true);
    await page.setCookie({
      name: "access_token",
      value: "qa-token",
      url: origin,
    });
    page.on("pageerror", (e) => errors.push(e.message));
    let source = "";
    const asset = fs.readFileSync(
      path.resolve(__dirname, "../public/icons/assets-habit/logo-user-ibu.png"),
    );
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const u = new URL(req.url());
      if (u.hostname === "avatar.example.test")
        return req.respond({
          status: u.pathname === "/valid.png" ? 200 : 404,
          contentType: "image/png",
          body: u.pathname === "/valid.png" ? asset : Buffer.alloc(0),
        });
      if (!u.pathname.includes("/api/v1/")) return req.continue();
      const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
      };
      if (req.method() === "OPTIONS")
        return req.respond({ status: 204, headers });
      const p = u.pathname.split("/api/v1")[1];
      let data = [];
      if (p === "/auth/me") data = { ...user, avatar_url: source };
      if (p === "/family")
        data = { id: "family-qa", name: "Keluarga QA", invite_code: "TEST123" };
      if (p === "/family/members")
        data = [
          { ...user, avatar_url: source },
          {
            ...user,
            id: "child-qa",
            name: "Anak",
            role: "child",
            avatar_url: source,
          },
        ];
      return req.respond({
        status: 200,
        headers,
        contentType: "application/json",
        body: JSON.stringify({ data }),
      });
    });
    for (const scenario of ["empty", "broken", "whitespace", "valid"]) {
      source = {
        empty: "",
        broken: "https://avatar.example.test/missing.png",
        whitespace: "   ",
        valid: "https://avatar.example.test/valid.png",
      }[scenario];
      const init = await page.evaluateOnNewDocument(
        (user) => {
          localStorage.setItem("access_token", "qa-token");
          localStorage.setItem(
            "keluarga-auth",
            JSON.stringify({
              state: { user, accessToken: "qa-token", isAuthenticated: true },
              version: 0,
            }),
          );
          localStorage.setItem("pwa-prompt-dismissed", String(Date.now()));
        },
        { ...user, avatar_url: source },
      );
      await page.goto(origin + "/settings", { waitUntil: "networkidle0" });
      await page.waitForFunction(
        () =>
          document.querySelectorAll("main img").length === 3 &&
          [...document.querySelectorAll("main img")].every(
            (i) => i.complete && i.naturalWidth > 0,
          ),
      );
      const images = await page.$$eval("main img", (els) =>
        els.map((e) => ({ src: e.getAttribute("src"), width: e.naturalWidth })),
      );
      assert.equal(images.length, 3);
      assert.ok(images.every((i) => i.width > 0));
      if (scenario === "valid")
        assert.ok(
          images.every(
            (i) => i.src === "https://avatar.example.test/valid.png",
          ),
        );
      else {
        assert.ok(images[0].src.endsWith("logo-user-ayah.png"));
        assert.ok(images[1].src.endsWith("logo-user-ayah.png"));
        assert.ok(images[2].src.endsWith("logo-user-anak.png"));
      }
      results.push({ scenario, images });
      await page.removeScriptToEvaluateOnNewDocument(init.identifier);
      if (scenario === "broken")
        await page.screenshot({
          path: path.join(out, "settings-avatar-fallback.png"),
          fullPage: true,
        });
    }
    assert.deepEqual(errors, []);
    fs.writeFileSync(
      path.join(out, "settings-avatar-results.json"),
      JSON.stringify({ results, errors }, null, 2),
    );
    console.log(
      "Passed: empty, broken, whitespace and valid avatars; profile and both member roles.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
