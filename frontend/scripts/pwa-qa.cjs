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
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "habit-pwa-qa-"));
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
    userDataDir: profile,
  });
  const page = await browser.newPage();
  const result = {};
  try {
    await page.goto(origin + "/login", { waitUntil: "networkidle0" });
    const client = await page.createCDPSession();
    const manifest = await client.send("Page.getAppManifest");
    result.manifestErrors = manifest.errors;
    result.manifest = JSON.parse(manifest.data);
    assert.equal(result.manifest.id, "/dashboard");
    assert(result.manifest.icons.every((icon) => icon.src.includes("?v=20261113-logo2")));
    result.manifestCacheControl = await page.evaluate(async () => {
      const response = await fetch(document.querySelector('link[rel="manifest"]').href);
      return response.headers.get("cache-control");
    });
    assert(result.manifestCacheControl.includes("no-cache"));
    result.serviceWorker = await page.evaluate(async () => {
      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Service worker registration timeout")),
            20000,
          ),
        ),
      ]);
      return { scope: registration.scope, state: registration.active?.state };
    });
    await page.reload({ waitUntil: "networkidle0" });
    result.controlled = await page.evaluate(
      () => !!navigator.serviceWorker.controller,
    );
    await page.setCacheEnabled(false);
    const offline = {
      offline: true,
      latency: 0,
      downloadThroughput: 0,
      uploadThroughput: 0,
    };
    await client.send("Network.emulateNetworkConditions", offline);
    for (const target of browser
      .targets()
      .filter((target) => target.type() === "service_worker")) {
      const workerSession = await target.createCDPSession();
      await workerSession.send("Network.enable");
      await workerSession.send("Network.emulateNetworkConditions", offline);
    }
    try {
      const response = await page.goto(origin + "/offline-qa-check", {
        waitUntil: "networkidle2",
        timeout: 15000,
      });
      result.offlineLogin = {
        status: response?.status(),
        fromServiceWorker: response?.fromServiceWorker(),
        heading: await page.$eval("h1", (el) => el.textContent),
      };
      await page.screenshot({
        path: "docs/qa/pwa-offline.png",
        fullPage: true,
      });
    } catch (error) {
      result.offlineLogin = { error: error.message };
    }
  } catch (error) {
    result.error = error.message;
  } finally {
    await browser.close();
    fs.rmSync(profile, { recursive: true, force: true });
    fs.writeFileSync(
      "docs/qa/pwa-results.json",
      JSON.stringify(result, null, 2),
    );
  }
  console.log(JSON.stringify(result, null, 2));
  assert.equal(result.error, undefined);
  assert.equal(result.manifestErrors.length, 0);
  assert.equal(result.controlled, true);
  assert.equal(result.offlineLogin.status, 200);
  assert.equal(result.offlineLogin.heading, "Koneksi sedang terputus.");
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
