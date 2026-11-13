// Browser brand/PWA checks with fixture APIs. No production data or real notifications.
const fs = require("node:fs"),
  path = require("node:path"),
  os = require("node:os"),
  vm = require("node:vm");
const { spawn } = require("node:child_process");
const assert = require("node:assert/strict");
const origin = process.env.HABIT_QA_URL || "http://127.0.0.1:3100",
  out = path.resolve(__dirname, "../../docs/qa");
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const result = {
  checks: [],
  screenshots: [],
  runtimeErrors: [],
  manifest: null,
};
const user = {
  id: "11111111-1111-4111-8111-111111111111",
  family_id: "22222222-2222-4222-8222-222222222222",
  name: "Nadia Pratama",
  role: "admin",
  email: "qa@example.test",
  color: "#007f5b",
};
(async () => {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "habit-brand-v3-"));
  const chrome = spawn(
    "/usr/bin/google-chrome",
    [
      "--headless=new",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--remote-debugging-port=0",
      "--user-data-dir=" + profile,
      "about:blank",
    ],
    { stdio: "ignore" },
  );
  let ws;
  fs.mkdirSync(out, { recursive: true });
  try {
    for (
      let i = 0;
      i < 100 && !fs.existsSync(path.join(profile, "DevToolsActivePort"));
      i++
    )
      await pause(100);
    const port = fs
      .readFileSync(path.join(profile, "DevToolsActivePort"), "utf8")
      .split("\n")[0];
    const target = await (
      await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, {
        method: "PUT",
      })
    ).json();
    ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });
    let sequence = 0;
    const pending = new Map(),
      events = {};
    ws.onmessage = ({ data }) => {
      const m = JSON.parse(data);
      if (m.id) {
        const p = pending.get(m.id);
        pending.delete(m.id);
        m.error ? p.reject(Error(m.error.message)) : p.resolve(m.result);
      } else for (const cb of events[m.method] || []) cb(m.params);
    };
    const send = (method, params = {}) =>
      new Promise((resolve, reject) => {
        const id = ++sequence;
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    const on = (name, fn) => (events[name] ??= []).push(fn);
    const ev = async (expression) => {
      const r = await send("Runtime.evaluate", {
        expression,
        awaitPromise: true,
        returnByValue: true,
      });
      if (r.exceptionDetails)
        throw Error(
          r.exceptionDetails.exception?.description || r.exceptionDetails.text,
        );
      return r.result.value;
    };
    const wait = async (expression) => {
      for (let i = 0; i < 120; i++) {
        if (await ev(expression)) return;
        await pause(100);
      }
      throw Error("Timed out: " + expression);
    };
    const check = (name) => result.checks.push(name);
    const shot = async (name) => {
      const data = await send("Page.captureScreenshot", { format: "png" });
      fs.writeFileSync(path.join(out, name), Buffer.from(data.data, "base64"));
      result.screenshots.push(name);
    };
    await send("Page.enable");
    await send("Runtime.enable");
    await send("Network.enable");
    on("Runtime.exceptionThrown", (p) =>
      result.runtimeErrors.push(
        p.exceptionDetails.exception?.description || p.exceptionDetails.text,
      ),
    );
    on("Fetch.requestPaused", async (p) => {
      const u = new URL(p.request.url),
        route = u.pathname.split("/api/v1")[1];
      let data = [];
      if (route === "/auth/refresh") data = { access_token: "qa-token" };
      if (route === "/auth/me") data = user;
      if (route === "/family")
        data = {
          id: user.family_id,
          name: "Keluarga Pratama",
          invite_code: "QA123",
        };
      if (route === "/family/members") data = [user];
      await send("Fetch.fulfillRequest", {
        requestId: p.requestId,
        responseCode: p.request.method === "OPTIONS" ? 204 : 200,
        responseHeaders: [
          { name: "Content-Type", value: "application/json" },
          { name: "Access-Control-Allow-Origin", value: "*" },
          { name: "Access-Control-Allow-Headers", value: "*" },
          { name: "Access-Control-Allow-Methods", value: "*" },
        ],
        body: Buffer.from(
          p.request.method === "OPTIONS"
            ? ""
            : JSON.stringify({ data, message: "success" }),
        ).toString("base64"),
      });
    });
    await send("Fetch.enable", { patterns: [{ urlPattern: "*/api/v1/*" }] });
    async function go(route, width, theme = "light") {
      await send("Emulation.setDeviceMetricsOverride", {
        width,
        height: 900,
        deviceScaleFactor: 1,
        mobile: false,
      });
      await send("Page.navigate", { url: origin + route });
      await wait(`document.readyState==='complete'`);
      await ev(
        `localStorage.setItem('theme',${JSON.stringify(theme)});document.documentElement.classList.toggle('dark',${theme === "dark"})`,
      );
      await pause(350);
    }
    for (const route of ["/login", "/register", "/onboarding"])
      for (const width of [390, 1440]) {
        await go(route, width);
        await wait(`document.querySelectorAll('.habit-brand-mark').length===2`);
        assert.equal(
          await ev("document.title"),
          "Habit — Keluarga lebih dekat",
        );
        assert.equal(
          await ev("document.documentElement.scrollWidth>innerWidth"),
          false,
        );
        assert.equal(
          await ev(
            `Array.from(document.querySelectorAll('.habit-wordmark circle'),e=>e.getAttribute('fill')).every(v=>v==='currentColor')`,
          ),
          true,
        );
        assert.equal(
          await ev(
            `Array.from(document.images).some(i=>i.src.includes('habit-v2')||i.src.includes('habit-mark-v2'))`,
          ),
          false,
        );
        check(
          `${route} ${width}: approved symbol, lettering, title and no overflow`,
        );
        await shot(`brand-v3-${route.slice(1)}-${width}.png`);
      }
    await go("/login", 1440, "dark");
    assert.equal(
      await ev(
        `getComputedStyle(document.querySelector('.habit-brand-mark')).color`,
      ),
      "rgb(147, 226, 191)",
    );
    check("dark brand uses approved mint");
    await shot("brand-v3-login-dark.png");
    await go("/login", 1440);
    const metadata = await ev(
      `({title:document.title,application:document.querySelector('meta[name="application-name"]')?.content,apple:document.querySelector('meta[name="apple-mobile-web-app-title"]')?.content,icons:Array.from(document.querySelectorAll('link[rel="icon"],link[rel="apple-touch-icon"]'),e=>e.href)})`,
    );
    assert.equal(metadata.application, "Habit");
    assert.equal(metadata.apple, "Habit");
    assert.ok(metadata.icons.some((x) => x.includes("habit-v3-32")));
    assert.ok(metadata.icons.some((x) => x.includes("habit-v3-180")));
    result.metadata = metadata;
    check("browser and Apple metadata match Habit v3");
    const manifestResult = await send("Page.getAppManifest");
    assert.equal(manifestResult.errors.length, 0);
    result.manifest = JSON.parse(manifestResult.data);
    assert.equal(result.manifest.id, "/dashboard");
    assert.equal(result.manifest.start_url, "/dashboard");
    assert.equal(result.manifest.name, "Habit");
    assert.equal(result.manifest.short_name, "Habit");
    assert.ok(
      result.manifest.icons.every(
        (icon) =>
          icon.src.includes("habit-v3-") &&
          icon.src.includes("20261113-hadir3"),
      ),
    );
    assert.equal(
      result.manifest.icons.filter((icon) => icon.purpose === "maskable")
        .length,
      2,
    );
    check("manifest keeps app identity and serves v3 any/maskable icons");
    const urls = [
      ...result.manifest.icons.map((i) => i.src),
      "/icons/habit-v3-32.png",
      "/icons/habit-v3-48.png",
      "/icons/habit-v3-180.png",
      "/icons/habit-v3-badge-96.png",
      "/icons/habit-lockup-v3.svg",
      "/icons/habit-lockup-v3-dark.svg",
      "/favicon.ico",
      "/sw-push.js",
      "/manifest.json?v=20261113-hadir3",
    ];
    result.assets = await ev(
      `Promise.all(${JSON.stringify(urls)}.map(async url=>{const r=await fetch(url);return {url,status:r.status,type:r.headers.get('content-type'),cache:r.headers.get('cache-control'),size:(await r.arrayBuffer()).byteLength}}))`,
    );
    assert.ok(result.assets.every((x) => x.status === 200 && x.size > 0));
    assert.ok(
      result.assets
        .find((x) => x.url.startsWith("/manifest"))
        .cache.includes("no-cache"),
    );
    check("all platform assets return 200; manifest is revalidated");
    await wait(
      `navigator.serviceWorker.getRegistration().then(r=>!!r?.active)`,
    );
    await send("Page.reload");
    await wait(`!!navigator.serviceWorker.controller`);
    check("production worker controls the page");
    await send("Network.setBypassServiceWorker", { bypass: true });
    await send("Network.setCookie", {
      name: "access_token",
      value: "qa-token",
      url: origin,
    });
    await send("Page.addScriptToEvaluateOnNewDocument", {
      source: `if(!['/login','/register','/onboarding'].includes(location.pathname)){localStorage.setItem('keluarga-auth',JSON.stringify({state:{user:${JSON.stringify(user)},accessToken:'qa-token',isAuthenticated:true},version:0}));localStorage.setItem('access_token','qa-token');}`,
    });
    await go("/dashboard", 1440);
    await wait(`!!document.querySelector('.sidebar-brand .habit-brand-mark')`);
    assert.equal(await ev("document.title"), "Habit — Keluarga lebih dekat");
    assert.equal(
      await ev(
        `document.querySelector('.sidebar-brand .habit-wordmark').getBoundingClientRect().width`,
      ),
      84,
    );
    check("dashboard sidebar retains compact balanced wordmark");
    await shot("brand-v3-dashboard.png");
    await go("/dashboard", 390);
    await ev(
      `document.querySelector('button[aria-label="Buka navigasi"]')?.click()`,
    );
    await pause(200);
    await shot("brand-v3-sidebar-mobile.png");
    check("mobile drawer brand");
    await ev(`localStorage.removeItem('pwa-prompt-dismissed')`);
    await send("Page.reload");
    await wait(`document.readyState==='complete'`);
    await pause(500);
    await ev(
      `(()=>{const e=new Event('beforeinstallprompt');e.prompt=async()=>{};e.userChoice=Promise.resolve({outcome:'dismissed'});window.dispatchEvent(e)})()`,
    );
    await wait(`document.body?.innerText.includes('Pasang Habit')`);
    assert.equal(
      await ev(
        `Array.from(document.images).find(i=>i.src.includes('habit-v3-192'))?.complete`,
      ),
      true,
    );
    check("install banner uses Habit and new app icon");
    const eventsPush = {};
    let notification;
    vm.runInNewContext(
      fs.readFileSync(path.resolve(__dirname, "../public/sw-push.js"), "utf8"),
      {
        self: {
          addEventListener: (type, fn) => (eventsPush[type] = fn),
          registration: {
            showNotification: async (title, options) =>
              (notification = { title, options }),
          },
        },
        clients: {},
      },
    );
    await eventsPush.push({
      data: {
        text: () =>
          JSON.stringify({
            title: "Uji Habit",
            body: "Menu hari ini",
            url: "/meals",
          }),
      },
      waitUntil: (promise) => promise,
    });
    assert.equal(notification.options.icon, "/icons/habit-v3-192.png");
    assert.equal(notification.options.badge, "/icons/habit-v3-badge-96.png");
    check("push notifications use v3 icon and monochrome badge");
    await send("Network.setBypassServiceWorker", { bypass: false });
    // CDP's page offline emulation does not automatically affect worker network requests.
    const { targetInfos } = await send("Target.getTargets");
    for (const target of targetInfos.filter(t => t.type === "service_worker")) {
      const { sessionId } = await send("Target.attachToTarget", { targetId: target.targetId, flatten: false });
      await send("Target.sendMessageToTarget", { sessionId, message: JSON.stringify({ id: 1, method: "Network.enable" }) });
      await send("Target.sendMessageToTarget", { sessionId, message: JSON.stringify({ id: 2, method: "Network.emulateNetworkConditions", params: { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 } }) });
    }
    on("Network.responseReceived", ({response}) => { if (response.url.includes("/brand-offline-check")) result.offlineResponse = {status:response.status, fromServiceWorker:response.fromServiceWorker}; });
    await send("Network.emulateNetworkConditions", {
      offline: true,
      latency: 0,
      downloadThroughput: 0,
      uploadThroughput: 0,
    });
    await send("Page.navigate", { url: origin + "/brand-offline-check" });
    await wait(`document.body?.innerText.includes('Koneksi sedang terputus')`);
    await wait(`document.querySelector('.brand img')?.complete`);
    assert.equal(await ev("document.title"), "Habit — Sedang offline");
    assert.ok(await ev(`document.querySelector('.brand img').naturalWidth>0`));
    await shot("brand-v3-offline.png");
    check("offline fallback includes new lockup and title");
    assert.equal(result.offlineResponse.status, 200);
    assert.equal(result.offlineResponse.fromServiceWorker, true);
    await send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 0,
      downloadThroughput: -1,
      uploadThroughput: -1,
    });
    assert.deepEqual(result.runtimeErrors, []);
  } finally {
    fs.writeFileSync(
      path.join(out, "brand-v3-results.json"),
      JSON.stringify(result, null, 2),
    );
    ws?.close();
    chrome.kill();
  }
  console.log(
    JSON.stringify({
      checks: result.checks.length,
      errors: result.runtimeErrors,
    }),
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
