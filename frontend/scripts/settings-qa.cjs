// Settings UI checks with intercepted APIs; never touches real family documents.
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
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "habit-settings-"));
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
        m.error
          ? p.reject(
              Error(
                m.error.message +
                  " " +
                  p.method +
                  " " +
                  JSON.stringify(p.params),
              ),
            )
          : p.resolve(m.result);
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
      throw Error(
        "Timed out: " +
          expression +
          "\n" +
          (await ev(
            "JSON.stringify({path:location.pathname,text:document.body?.innerText,auth:localStorage.getItem('keluarga-auth')})",
          )),
      );
    };
    const check = (name) => result.checks.push(name);
    const audit = async (name, selector) => {
      await ev(
        fs.readFileSync(
          process.env.HABIT_AXE_PATH || "/tmp/habit-settings-axe.min.js",
          "utf8",
        ) + "; true",
      );
      const violations = await ev(
        `axe.run(document.querySelector(${JSON.stringify(selector)}),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}).then(r=>r.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})))`,
      );
      (result.audits ??= []).push({ name, violations });
      assert.deepEqual(violations, [], name);
    };
    const shot = async (name) => {
      const data = await send("Page.captureScreenshot", { format: "png" });
      fs.writeFileSync(path.join(out, name), Buffer.from(data.data, "base64"));
      result.screenshots.push(name);
    };
    await send("Page.enable");
    await send("Runtime.enable");
    await send("Network.enable");
    await send("Network.setBypassServiceWorker", { bypass: true });
    on("Runtime.exceptionThrown", (p) =>
      result.runtimeErrors.push(
        p.exceptionDetails.exception?.description || p.exceptionDetails.text,
      ),
    );

    let user = {
      id: "11111111-1111-4111-8111-111111111111",
      family_id: "22222222-2222-4222-8222-222222222222",
      name: "Nadia Pratama",
      email: "nadia@example.test",
      role: "admin",
      auth_provider: "email",
      color: "sky",
      birth_date: "1990-01-01",
      avatar_url: "",
    };
    const second = {
      ...user,
      id: "33333333-3333-4333-8333-333333333333",
      name: "Bima Pratama",
      email: "bima@example.test",
      role: "member",
    };
    let family = {
      id: user.family_id,
      name: "Keluarga Pratama",
      invite_code: "ABCD-EFGH",
      invite_expires_at: "2026-11-21T10:00:00Z",
    };
    let people = [user, second],
      failMembers = false,
      failLogout = false;
    const png = fs.readFileSync(
      path.resolve(__dirname, "../public/icons/habit-v3-32.png"),
    );
    on("Fetch.requestPaused", async (p) => {
      try {
        const route = new URL(p.request.url).pathname.split("/api/v1")[1];
        let data = [],
          code = 200,
          message = "success",
          raw = null;
        if (p.request.method !== "OPTIONS") {
          if (route === "/auth/refresh")
            data = {
              access_token: "qa-token",
              refresh_token: "qa-refresh",
              member: user,
            };
          else if (route === "/auth/me") data = user;
          else if (route === "/family/members") {
            if (failMembers) {
              code = 503;
              message = "Daftar anggota gagal dimuat";
            } else data = people;
          } else if (route === "/family" && p.request.method === "PUT") {
            family.name = JSON.parse(p.request.postData).name;
            data = family;
          } else if (route === "/family")
            data = {
              ...family,
              ...(user.role === "admin" ? {} : { invite_code: undefined }),
            };
          else if (route === "/family/invite-code") {
            family.invite_code = "WXYZ-2345";
            data = family;
          } else if (route === "/family/avatar") {
            user.avatar_url = `/api/v1/family/members/${user.id}/avatar?v=new`;
            data = user;
          } else if (route?.endsWith("/avatar")) raw = png;
          else if (
            route?.startsWith("/family/members/") &&
            p.request.method === "PUT"
          ) {
            const id = route.split("/").pop(),
              body = JSON.parse(p.request.postData);
            if (id === user.id && body.role !== "admin") {
              code = 409;
              message = "Keluarga harus memiliki minimal satu admin";
            } else {
              people = people.map((m) => (m.id === id ? { ...m, ...body } : m));
              user = people.find((m) => m.id === user.id);
              data = people.find((m) => m.id === id);
            }
          } else if (
            route?.startsWith("/family/members/") &&
            p.request.method === "DELETE"
          ) {
            people = people.filter((m) => m.id !== route.split("/").pop());
          } else if (route === "/auth/password") {
            if (
              JSON.parse(p.request.postData).current_password !== "password123"
            ) {
              code = 400;
              message = "Password saat ini tidak sesuai";
            }
          } else if (route === "/auth/logout" && failLogout) {
            code = 503;
            message = "Sesi belum dapat dicabut";
          } else if (route === "/push/subscription")
            data = { subscribed: false };
        }
        await send("Fetch.fulfillRequest", {
          requestId: p.requestId,
          responseCode: p.request.method === "OPTIONS" ? 204 : code,
          responseHeaders: [
            {
              name: "Content-Type",
              value: raw ? "image/png" : "application/json",
            },
            { name: "Access-Control-Allow-Origin", value: "*" },
            { name: "Access-Control-Allow-Headers", value: "*" },
            { name: "Access-Control-Allow-Methods", value: "*" },
          ],
          body: Buffer.from(
            p.request.method === "OPTIONS"
              ? ""
              : raw || JSON.stringify({ data, message }),
          ).toString("base64"),
        });
      } catch (e) {
        result.runtimeErrors.push(String(e));
      }
    });
    await send("Fetch.enable", {
      patterns: [{ urlPattern: "*://*/api/v1/*" }],
    });
    let seedId;
    async function go() {
      if (seedId)
        await send("Page.removeScriptToEvaluateOnNewDocument", {
          identifier: seedId,
        });
      const seed = await send("Page.addScriptToEvaluateOnNewDocument", {
        source: `if(location.pathname==="/settings"){localStorage.setItem('keluarga-auth',JSON.stringify({state:{user:${JSON.stringify(user)},accessToken:'qa-token',isAuthenticated:true},version:0}));localStorage.setItem('access_token','qa-token');localStorage.setItem('refresh_token','qa-refresh');localStorage.setItem('pwa-prompt-dismissed',String(Date.now()));}`,
      });
      seedId = seed.identifier;
      await send("Network.setCookie", {
        name: "access_token",
        value: "qa-token",
        url: origin,
      });
      await send("Page.navigate", { url: origin + "/settings" });
      await wait(`!!document.querySelector('.settings-welcome')`);
      await pause(250);
    }
    const click = async (text) => {
      await ev(
        `(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(text)});if(!b)throw Error('button missing: '+${JSON.stringify(text)});b.click();return true})()`,
      );
      await pause(100);
    };
    const fill = async (selector, value) => {
      await ev(
        `(()=>{const e=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(e.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));return true})()`,
      );
    };
    const submit = async () => {
      await ev(`document.querySelector('[role=dialog] form').requestSubmit()`);
      await pause(100);
    };
    const close = async () => {
      await ev(
        `document.querySelector('[aria-label="Tutup pengaturan"]').click()`,
      );
      await pause(50);
    };
    await go();
    await wait(`document.body?.innerText.includes('ABCD-EFGH')`);
    await click("Edit profil");
    await fill(".settings-dialog input[autocomplete=name]", "Nadia Baru");
    await fill(".settings-dialog input[type=date]", "");
    await submit();
    await wait(
      `!document.querySelector('[role=dialog]') && document.body?.innerText.includes('Nadia Baru')`,
    );
    assert.equal(user.birth_date, null);
    check("self profile saves name and clears birth date");
    await click("Edit profil");
    await fill(".settings-dialog select:last-of-type", "sky"); // Color remains valid.
    await ev(
      `(()=>{const list=document.querySelectorAll('.settings-dialog select');const e=list[list.length-1];Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(e,'member');e.dispatchEvent(new Event('change',{bubbles:true}));return true})()`,
    );
    await submit();
    await wait(
      `document.querySelector('[role=alert]')?.textContent.includes('satu admin')`,
    );
    await close();
    check("last-admin error displayed without closing form");
    await click("Edit nama");
    await fill(".settings-dialog input", "Keluarga Harmoni");
    await submit();
    await wait(
      `!document.querySelector('[role=dialog]') && document.body?.innerText.includes('Keluarga Harmoni')`,
    );
    check("family rename saves");
    await ev(
      `Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>Promise.resolve()}})`,
    );
    await click("Salin");
    await wait(`document.body?.innerText.includes('Disalin')`);
    check("invite clipboard success");
    await ev(
      `Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>Promise.reject(Error('denied'))}})`,
    );
    await click("Disalin");
    await wait(`document.body?.innerText.includes('Kode belum tersalin')`);
    check("clipboard denied shows manual-copy guidance");
    await click("Ganti kode undangan");
    await click("Ganti kode");
    await wait(`document.body?.innerText.includes('WXYZ-2345')`);
    check("invite rotation confirmed and refreshed");
    await ev(
      `document.querySelector('[aria-label="Edit anggota Bima Pratama"]').click()`,
    );
    await fill(".settings-dialog input[autocomplete=name]", "Bima Baru");
    await submit();
    await wait(
      `!document.querySelector('[role=dialog]') && document.body?.innerText.includes('Bima Baru')`,
    );
    check("admin edits member");
    await ev(
      `document.querySelector('[aria-label="Keluarkan Bima Baru"]').click()`,
    );
    await click("Keluarkan anggota");
    await wait(
      `!document.querySelector('[role=dialog]') && !document.body?.innerText.includes('Bima Baru')`,
    );
    check("member removal confirmation");
    const avatar = path.join(os.tmpdir(), "habit-settings-avatar.png");
    fs.writeFileSync(avatar, png);
    const root = await send("DOM.getDocument");
    const input = await send("DOM.querySelector", {
      nodeId: root.root.nodeId,
      selector: 'input[aria-label="Pilih foto profil"]',
    });
    await send("DOM.setFileInputFiles", {
      nodeId: input.nodeId,
      files: [avatar],
    });
    await wait(`!!document.querySelector('img[src^="blob:"]')?.complete`);
    assert.ok(
      await ev(`document.querySelector('img[src^="blob:"]').naturalWidth>0`),
    );
    check("avatar upload refreshes protected image");
    await click("Ganti password");
    await fill("input[autocomplete=current-password]", "wrong");
    await fill("input[autocomplete=new-password]", "newpassword123");
    await fill(".settings-dialog label:last-of-type input", "newpassword123");
    await submit();
    await wait(
      `document.querySelector('[role=alert]')?.innerText.includes('tidak sesuai')`,
    );
    await fill("input[autocomplete=current-password]", "password123");
    await submit();
    await wait(`!document.querySelector('[role=dialog]')`);
    check("password server error and success");
    await pause(4500);
    for (const width of [375, 390, 768, 1440]) {
      await send("Emulation.setDeviceMetricsOverride", {
        width,
        height: 950,
        deviceScaleFactor: 1,
        mobile: width < 600,
      });
      await send("Emulation.setTouchEmulationEnabled", {
        enabled: width < 600,
      });
      for (const theme of ["light", "dark"]) {
        await ev(
          `document.documentElement.classList.toggle('dark',${theme === "dark"})`,
        );
        await pause(150);
        assert.equal(
          await ev("document.documentElement.scrollWidth>innerWidth"),
          false,
        );
        check(`${width} ${theme}: settings layout no overflow`);
        if (width === 390 || width === 1440) {
          await audit(`settings ${width} ${theme}`, "main");
          await shot(`settings-modern-${width}-${theme}.png`);
        }
        await click("Edit profil");
        assert.equal(
          await ev("document.documentElement.scrollWidth>innerWidth"),
          false,
        );
        assert.ok(
          await ev(
            `document.querySelector('[role=dialog]').contains(document.activeElement)`,
          ),
        );
        if (width === 390) {
          await audit(`profile dialog ${theme}`, "[role=dialog]");
          await shot(`settings-modern-profile-${theme}.png`);
        }
        await close();
        check(`${width} ${theme}: dialog width and focus`);
      }
    }
    failMembers = true;
    await go();
    await wait(`document.body?.innerText.includes('Data belum bisa dimuat')`);
    assert.equal(
      await ev(
        `document.body.innerText.includes('Belum ada anggota yang dapat ditampilkan')`,
      ),
      false,
    );
    check("member error is not empty state");
    failMembers = false;
    user.auth_provider = "google";
    await go();
    await wait(`document.body?.innerText.includes('Buka keamanan Google')`);
    assert.equal(
      await ev(
        `!![...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Ganti password')`,
      ),
      false,
    );
    check("Google account uses Google security controls");
    user.auth_provider = "email";
    user.role = "member";
    await go();
    await wait(`document.body?.innerText.includes('Hubungi admin keluarga')`);
    assert.equal(
      await ev(`document.body.innerText.includes('WXYZ-2345')`),
      false,
    );
    assert.equal(
      await ev(`!!document.querySelector('[aria-label^="Edit anggota"]')`),
      false,
    );
    check("member cannot see invite or admin controls");
    user.family_id = null;
    await go();
    await wait(`!!document.querySelector('a[href="/onboarding"]')`);
    check("unaffiliated account has onboarding action");
    failLogout = true;
    await click("Keluar dari perangkat ini");
    await click("Keluar");
    await wait(`document.body?.innerText.includes('Belum berhasil keluar')`);
    assert.ok(await ev(`localStorage.getItem('refresh_token')`));
    check("failed logout keeps local session for retry");
    failLogout = false;
    await click("Keluar dari perangkat ini");
    await click("Keluar");
    await wait(`location.pathname==='/login'`);
    assert.equal(await ev(`localStorage.getItem('refresh_token')`), null);
    check("successful logout clears auth and reaches login");
    assert.deepEqual(result.runtimeErrors, []);
  } finally {
    fs.writeFileSync(
      path.join(out, "settings-modern-results.json"),
      JSON.stringify(result, null, 2),
    );
    ws?.close();
    chrome.kill();
  }
  console.log(
    JSON.stringify({
      checks: result.checks.length,
      audits: result.audits?.length,
      errors: result.runtimeErrors,
    }),
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
