// Auth layout and form checks in Chrome. No API writes or real accounts.
const fs = require("node:fs"),
  path = require("node:path"),
  os = require("node:os");
const { spawn } = require("node:child_process");
const assert = require("node:assert/strict");
const origin = process.env.HABIT_QA_URL || "http://127.0.0.1:3100",
  out = path.resolve(__dirname, "../../docs/qa");
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const result = {
  checks: [],
  screenshots: [],
  runtimeErrors: [],
};
(async () => {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "habit-auth-welcome-"));
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
        m.error ? p.reject(Error(m.error.message + " " + p.method + " " + JSON.stringify(p.params))) : p.resolve(m.result);
      } else for (const cb of events[m.method] || []) cb(m.params);
    };
    const send = (method, params = {}) =>
      new Promise((resolve, reject) => {
        const id = ++sequence;
        pending.set(id, { resolve, reject, method, params });
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
    for (const width of [360,390,768,1440]) {
      await send("Emulation.setDeviceMetricsOverride", {width,height:900,deviceScaleFactor:1,mobile:width<600});
      for (const page of ["login","register","onboarding"]) {
        await send("Page.navigate", {url:origin+"/"+page});
        await wait("document.querySelector('.auth-form-card') && document.querySelector('.auth-family')?.complete");
        await ev("document.fonts.ready.then(()=>true)");
        if(page!=="onboarding") await wait("!!document.querySelector('form') && Object.keys(document.querySelector('form')).some(k=>k.startsWith('__reactProps'))");
        await pause(500);
        for (const theme of ["light","dark"]) {
          await ev(`document.documentElement.classList.toggle('dark',${theme==='dark'})`);
          await pause(100);
          assert.equal(await ev("document.documentElement.scrollWidth > innerWidth"),false,`${page} ${width} overflow`);
          assert.equal(await ev("document.querySelectorAll('h1').length"),1);
          assert.equal(await ev("getComputedStyle(document.querySelector('.auth-story h2')).color"),"rgb(255, 249, 235)");
          assert.ok(await ev("document.querySelector('.auth-family').naturalWidth>0"));
          check(`${page} ${width} ${theme}: image, heading, no overflow`);
          if(width===390 || width===1440) await shot(`auth-welcome-${page}-${width}-${theme}.png`);
        }
        if(page!=="onboarding") {
          await ev("document.querySelector('form').requestSubmit()");
          await wait("!!document.querySelector('[aria-invalid=true]')");
          assert.ok(await ev("document.querySelector('[aria-invalid=true]').getAttribute('aria-describedby')"));
          await ev("document.querySelector('.auth-password-toggle').click()");
          assert.equal(await ev("document.querySelector('input[autocomplete$=password]').type"),"text");
          assert.equal(await ev("document.querySelector('.auth-password-toggle').getAttribute('aria-pressed')"),"true");
          check(`${page} ${width}: validation and password visibility`);
        }
      }
    }
    assert.deepEqual(result.runtimeErrors, []);
  } finally {
    fs.writeFileSync(path.join(out,"auth-welcome-results.json"),JSON.stringify(result,null,2));
    ws?.close(); chrome.kill();
  }
  console.log(JSON.stringify({checks:result.checks.length,errors:result.runtimeErrors}));
})().catch(error=>{console.error(error);process.exitCode=1;});
