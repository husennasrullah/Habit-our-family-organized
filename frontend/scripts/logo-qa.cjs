const path = require("node:path");
const os = require("node:os");
const fs = require("node:fs");
const assert = require("node:assert/strict");
process.chdir(path.resolve(__dirname, "../.."));
const qaModules = process.env.HABIT_QA_MODULES;
const puppeteer = require(
  qaModules ? path.join(qaModules, "puppeteer-core") : "puppeteer-core",
);
const origin = process.env.HABIT_QA_URL || "http://localhost:3100";
(async () => {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "habit-logo-qa-"));
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
    userDataDir: profile,
  });
  const result = { pages: [], errors: [], icons: [] };
  const page = await browser.newPage();
  await page.setBypassServiceWorker(true);
  page.on("pageerror", (error) => result.errors.push(error.message));
  try {
    for (const theme of ["light", "dark"])
      for (const width of [390, 1440]) {
        await page.setViewport({ width, height: 1000, deviceScaleFactor: 1 });
        await page.goto(origin + "/login", { waitUntil: "networkidle0" });
        await page.evaluate((theme) => {
          localStorage.setItem("theme", theme);
          document.documentElement.classList.toggle("dark", theme === "dark");
        }, theme);
        await page.waitForFunction(() =>
          [...document.images]
            .filter((image) => image.src.includes("habit-mark-v2"))
            .every((image) => image.complete && image.naturalWidth > 0),
        );
        const logos = await page.evaluate(() =>
          [...document.images]
            .filter((image) => image.src.includes("habit-mark-v2"))
            .map((image) => ({
              src: image.currentSrc,
              loaded: image.complete && image.naturalWidth > 0,
            })),
        );
        assert.equal(logos.length, 2);
        result.pages.push({ route: "/login", width, theme, logos });
        await page.screenshot({
          path: `docs/qa/logo-login-${width}-${theme}.png`,
        });
      }
    const client = await page.createCDPSession();
    const manifestResult = await client.send("Page.getAppManifest");
    assert.equal(manifestResult.errors.length, 0);
    const manifest = JSON.parse(manifestResult.data);
    assert(manifest.icons.every((icon) => icon.src.includes("habit-v2-")));
    for (const icon of manifest.icons) {
      const response = await fetch(origin + icon.src);
      assert.equal(response.status, 200);
      result.icons.push({ ...icon, status: response.status });
    }
    const favicon = await fetch(origin + "/favicon.ico");
    const bytes = Buffer.from(await favicon.arrayBuffer());
    assert.equal(bytes.readUInt16LE(2), 1);
    assert.equal(bytes.readUInt16LE(4), 3);
    result.favicon = { status: favicon.status, sizes: [16, 32, 48] };
    const user = {
      id: "qa-member",
      family_id: "qa-family",
      name: "Nadia",
      role: "admin",
      email: "preview@example.test",
      avatar_url: "",
    };
    await page.setRequestInterception(true);
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (!url.pathname.includes("/api/v1/")) return request.continue();
      if (request.method() === "OPTIONS")
        return request.respond({
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Methods": "*",
          },
        });
      const data = url.pathname.endsWith("/auth/refresh")
        ? { access_token: "logo-qa-token" }
        : url.pathname.endsWith("/expenses/summary")
          ? { total: 0, by_category: [], by_month: [] }
          : [];
      return request.respond({
        status: 200,
        contentType: "application/json",
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ data }),
      });
    });
    await page.evaluateOnNewDocument(
      ({ user, origin }) => {
        if (location.origin !== origin) return;
        localStorage.setItem(
          "keluarga-auth",
          JSON.stringify({
            state: {
              user,
              accessToken: "logo-qa-token",
              isAuthenticated: true,
            },
            version: 0,
          }),
        );
        localStorage.setItem("access_token", "logo-qa-token");
        localStorage.setItem("refresh_token", "logo-qa-refresh");
        localStorage.setItem("pwa-prompt-dismissed", String(Date.now()));
      },
      { user, origin },
    );
    await page.setCookie({
      name: "access_token",
      value: "logo-qa-token",
      url: origin,
    });
    await page.evaluate(() => localStorage.setItem("theme", "light"));
    await page.setViewport({ width: 1440, height: 1000 });
    await page.goto(origin + "/dashboard", { waitUntil: "networkidle0" });
    const sidebarLogo = await page.$eval("aside img", (image) => ({
      src: image.currentSrc,
      loaded: image.complete && image.naturalWidth > 0,
    }));
    assert(sidebarLogo.src.includes("habit-mark-v2") && sidebarLogo.loaded);
    result.wordmark = await page.$eval(".sidebar-wordmark", (el) => {
      const style = getComputedStyle(el);
      return { size: style.fontSize, weight: style.fontWeight, stroke: style.webkitTextStrokeWidth };
    });
    assert.equal(result.wordmark.size, "24px");
    assert.equal(result.wordmark.weight, "800");
    result.canvas = await page.$eval(".app-shell", (el) => getComputedStyle(el).backgroundImage);
    assert(result.canvas.includes("250, 248, 242"));
    result.pages.push({ route: "/dashboard", width: 1440, logo: sidebarLogo });
    await page.screenshot({ path: "docs/qa/logo-dashboard-1440.png" });
    assert.equal(result.errors.length, 0);
  } finally {
    await browser.close();
    fs.rmSync(profile, { recursive: true, force: true });
    fs.writeFileSync(
      "docs/qa/logo-results.json",
      JSON.stringify(result, null, 2),
    );
  }
  console.log(JSON.stringify(result, null, 2));
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
