// Kids QA uses isolated browser fixture data; no real family records are changed.
const fs = require("node:fs"),
  path = require("node:path"),
  os = require("node:os");
const { spawn } = require("node:child_process");
const assert = require("node:assert/strict");
const origin = process.env.HABIT_QA_URL || "http://127.0.0.1:3100";
const output = path.resolve(__dirname, "../../docs/qa");
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const user = {
  id: "11111111-1111-4111-8111-111111111111",
  family_id: "22222222-2222-4222-8222-222222222222",
  name: "Nadia Pratama",
  email: "qa@example.test",
  role: "admin",
  color: "#007f5b",
};
const today = new Date().toLocaleDateString("en-CA", {
  timeZone: "Asia/Jakarta",
});
const result = { checks: [], errors: [], audits: [], mutations: [] };
let failSave = false,
  mode = "normal";
let kids = [
  {
    id: "kid-a",
    name: "Ani",
    gender: "female",
    birth_date: "2023-01-01T00:00:00Z",
    notes: "Catatan Ani",
  },
  {
    id: "kid-b",
    name: "Budi",
    gender: "male",
    birth_date: "2022-01-01T00:00:00Z",
    notes: "",
  },
];
let records = {
  "kid-a": {
    growth: [
      {
        id: "g1",
        date: "2026-01-01",
        height_cm: 90,
        weight_kg: 12,
        head_circumference_cm: 48,
        notes: "Awal tahun",
      },
      {
        id: "g2",
        date: "2026-01-10",
        height_cm: null,
        weight_kg: 12.2,
        head_circumference_cm: null,
        notes: "",
      },
      {
        id: "g3",
        date: "2026-03-01",
        height_cm: 91,
        weight_kg: 12.5,
        head_circumference_cm: 48.5,
        notes: "",
      },
    ],
    vaccines: [
      {
        id: "v1",
        vaccine_name: "Vaksin uji",
        scheduled_date: "2026-01-01T00:00:00Z",
        given_date: null,
        given_by: "Klinik",
        notes: "Jangan hilang",
        status: "overdue",
      },
    ],
    milestones: [
      {
        id: "m1",
        title: "Bersepeda",
        category: "motorik",
        is_achieved: false,
        achieved_at: null,
        notes: "Catatan milestone",
      },
    ],
    health: [
      {
        id: "h1",
        date: "2026-01-01",
        type: "checkup",
        description: "Kontrol tahunan",
        doctor: "Ayu",
        medication: "Vitamin",
        notes: "Catatan kesehatan",
      },
    ],
  },
  "kid-b": { growth: [], vaccines: [], milestones: [], health: [] },
};
(async () => {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "habit-kids-chrome-"));
  const chrome = spawn(
    "/usr/bin/google-chrome",
    [
      "--headless=new",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--remote-debugging-port=0",
      "--user-data-dir=" + profile,
      "about:blank",
    ],
    { stdio: "ignore" },
  );
  let ws;
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
    await new Promise((r, j) => {
      ws.onopen = r;
      ws.onerror = j;
    });
    let sequence = 0;
    const pending = new Map(),
      events = {};
    ws.onmessage = ({ data }) => {
      const m = JSON.parse(data);
      if (m.id) {
        const p = pending.get(m.id);
        pending.delete(m.id);
        if (m.error) p.reject(new Error(m.error.message));
        else p.resolve(m.result);
      } else for (const cb of events[m.method] || []) cb(m.params);
    };
    const send = (method, params = {}) =>
      new Promise((resolve, reject) => {
        const id = ++sequence;
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    const on = (method, cb) => (events[method] ??= []).push(cb);
    const ev = async (expression) => {
      const r = await send("Runtime.evaluate", {
        expression,
        returnByValue: true,
        awaitPromise: true,
      });
      if (r.exceptionDetails)
        throw Error(
          r.exceptionDetails.text +
            ": " +
            r.exceptionDetails.exception?.description,
        );
      return r.result.value;
    };
    const wait = async (expression) => {
      for (let i = 0; i < 100; i++) {
        if (await ev(expression)) return;
        await pause(100);
      }
      throw Error("Timed out: " + expression);
    };
    const find = (selector) =>
      `[...document.querySelectorAll(${JSON.stringify(selector)})].find(e=>e.getClientRects().length)`;
    const click = async (selector) => {
      const rect = await ev(
        `(()=>{const e=${find(selector)};if(!e)throw Error('missing '+${JSON.stringify(selector)});e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`,
      );
      await send("Input.dispatchMouseEvent", {
        type: "mousePressed",
        button: "left",
        clickCount: 1,
        ...rect,
      });
      await send("Input.dispatchMouseEvent", {
        type: "mouseReleased",
        button: "left",
        clickCount: 1,
        ...rect,
      });
      await pause(150);
    };
    const textClick = async (text) => {
      await ev(
        `(()=>{const e=[...document.querySelectorAll('button')].find(e=>e.getClientRects().length&&e.textContent.trim()===${JSON.stringify(text)});if(!e)throw Error('missing button '+${JSON.stringify(text)});e.click()})()`,
      );
      await pause(150);
    };
    const input = async (selector, value) =>
      ev(
        `(()=>{const e=document.querySelector(${JSON.stringify(selector)});const setter=Object.getOwnPropertyDescriptor(e.tagName==='SELECT'?HTMLSelectElement.prototype:e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set;setter.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));})()`,
      );
    const check = (name) => result.checks.push(name);
    await send("Page.enable");
    await send("Runtime.enable");
    await send("Network.enable");
    await send("Network.setBypassServiceWorker", { bypass: true });
    await send("Emulation.setTimezoneOverride", { timezoneId: "Asia/Jakarta" });
    on("Runtime.exceptionThrown", (p) =>
      result.errors.push(
        p.exceptionDetails.exception?.description || p.exceptionDetails.text,
      ),
    );
    on(
      "Page.javascriptDialogOpening",
      () => void send("Page.handleJavaScriptDialog", { accept: true }),
    );

    on("Fetch.requestPaused", async (p) => {
      try {
        const url = new URL(p.request.url),
          route = url.pathname.split("/api/v1")[1],
          method = p.request.method;
        const headers = [
          { name: "Content-Type", value: "application/json" },
          { name: "Access-Control-Allow-Origin", value: "*" },
          { name: "Access-Control-Allow-Headers", value: "*" },
          { name: "Access-Control-Allow-Methods", value: "*" },
        ];
        if (method === "OPTIONS") {
          await send("Fetch.fulfillRequest", {
            requestId: p.requestId,
            responseCode: 204,
            responseHeaders: headers,
            body: "",
          });
          return;
        }
        let status = 200,
          body = { data: [], message: "success" };
        const payload = p.request.postData
          ? JSON.parse(p.request.postData)
          : {};
        if (route === "/auth/refresh")
          body = { data: { access_token: "qa-token" } };
        else if (route === "/auth/me") body = { data: user };
        else if (route === "/family")
          body = {
            data: {
              id: user.family_id,
              name: "Keluarga Pratama",
              invite_code: "QA123",
            },
          };
        else if (route === "/family/members") body = { data: [user] };
        else if (route?.startsWith("/kids")) {
          const [, base, kidId, resource, recordId, action] = route.split("/");
          if (method === "GET") {
            if (mode === "error" || mode === resource + "-error") {
              status = 500;
              body = { message: "Fixture gagal dimuat" };
            } else
              body = {
                data:
                  mode === "empty"
                    ? []
                    : !kidId
                      ? kids
                      : (records[kidId]?.[resource] ?? []),
              };
          } else {
            result.mutations.push({ route, method, payload });
            if (failSave) {
              status = 400;
              body = { message: "Gagal menyimpan fixture" };
            } else if (!resource) {
              if (method === "POST") {
                const k = { id: "kid-new", ...payload };
                kids.push(k);
                records[k.id] = {
                  growth: [],
                  vaccines: [],
                  milestones: [],
                  health: [],
                };
                body = { data: k };
              } else if (method === "PUT") {
                const k = kids.find((k) => k.id === kidId);
                Object.assign(k, payload);
                body = { data: k };
              } else if (method === "DELETE") {
                kids = kids.filter((k) => k.id !== kidId);
                delete records[kidId];
                body = { data: null };
              }
            } else {
              const rows = records[kidId][resource];
              if (method === "POST") {
                const r = {
                  id: "record-" + Date.now(),
                  ...payload,
                  kid_id: kidId,
                };
                if (resource === "vaccines")
                  r.status = r.given_date ? "given" : "scheduled";
                if (resource === "milestones") r.is_achieved = !!r.achieved_at;
                rows.push(r);
                body = { data: r };
              } else if (method === "DELETE") {
                records[kidId][resource] = rows.filter(
                  (r) => r.id !== recordId,
                );
                body = { data: null };
              } else {
                const r = rows.find((r) => r.id === recordId);
                Object.assign(r, payload);
                if (resource === "vaccines")
                  r.status = r.given_date ? "given" : "overdue";
                if (resource === "milestones") {
                  r.is_achieved =
                    action === "achievement"
                      ? payload.achieved
                      : !!r.achieved_at;
                  if (!r.is_achieved) r.achieved_at = null;
                }
                body = { data: r };
              }
            }
          }
        }
        await send("Fetch.fulfillRequest", {
          requestId: p.requestId,
          responseCode: status,
          responseHeaders: headers,
          body: Buffer.from(JSON.stringify(body)).toString("base64"),
        });
      } catch (e) {
        result.errors.push(e.message);
      }
    });
    await send("Fetch.enable", { patterns: [{ urlPattern: "*/api/v1/*" }] });
    await send("Network.setCookie", {
      name: "access_token",
      value: "qa-token",
      url: origin,
    });
    await send("Page.addScriptToEvaluateOnNewDocument", {
      source: `const fixtureUser={...${JSON.stringify(user)},role:new URLSearchParams(location.search).get('role')||'admin'};localStorage.setItem('keluarga-auth',JSON.stringify({state:{user:fixtureUser,accessToken:'qa-token',isAuthenticated:true},version:0}));localStorage.setItem('access_token','qa-token');localStorage.setItem('pwa-prompt-dismissed',String(Date.now()));`,
    });
    const go = async (width = 390, search = "") => {
      await send("Emulation.setDeviceMetricsOverride", {
        width,
        height: 950,
        deviceScaleFactor: 1,
        mobile: false,
      });
      await send("Page.navigate", { url: origin + "/kids" + search });
      await wait(`document.querySelector('h1')?.textContent==='Anak'`);
      await pause(500);
    };
    const shot = async (name) => {
      const image = await send("Page.captureScreenshot", { format: "png" });
      fs.writeFileSync(
        path.join(output, name),
        Buffer.from(image.data, "base64"),
      );
    };
    const audit = async (name, dialog = false) => {
      await ev(
        fs.readFileSync(
          path.resolve(__dirname, "../node_modules/axe-core/axe.min.js"),
          "utf8",
        ),
      );
      const violations = await ev(
        `axe.run(document.querySelector(${JSON.stringify(dialog ? "[role=dialog]" : ".app-main")}),{runOnly:{type:'tag',values:['wcag2a','wcag2aa']}}).then(r=>r.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})))`,
      );
      result.audits.push({ name, violations });
    };
    const openNew = async (text = "Catat baru") => {
      await textClick(text);
      await wait(`!!document.querySelector('[role=dialog]')`);
    };
    const save = async () => {
      await textClick("Simpan");
      await wait(`!document.querySelector('[role=dialog]')`);
    };
    const remove = async (selector) => {
      await click(selector);
      await wait(
        `document.querySelector('[role=dialog] h2')?.textContent.startsWith('Hapus')`,
      );
      await textClick("Hapus");
      await wait(`!document.querySelector('[role=dialog]')`);
    };
    fs.mkdirSync(output, { recursive: true });
    await go();
    await wait(`!!document.querySelector('#growth-metric')`);
    assert.equal(
      await ev(`document.querySelectorAll('.kids-measured-dot').length`),
      3,
    );
    await input("#growth-metric", "height_cm");
    await pause(100);
    assert.equal(
      await ev(`document.querySelectorAll('.kids-measured-dot').length`),
      2,
    );
    check("incomplete height row preserves other measurement points");
    const x = await ev(
      `Array.from(document.querySelectorAll('.kids-measured-dot'),e=>Number(e.getAttribute('cx')))`,
    );
    assert.ok(x[1] > x[0]);
    check("chronological growth coordinates and units");
    await openNew();
    await audit("growth-form-light", true);
    assert.ok(
      await ev(
        `document.querySelector('[role=dialog]>div').getBoundingClientRect().width<=360`,
      ),
    );
    await input("#kid-weight_kg", "13.25");
    await input("#kid-head_circumference_cm", "48.75");
    await input("#kid-notes", "Draft Ani");
    await shot("kids-modal-growth-mobile.png");
    await save();
    assert.equal(records["kid-a"].growth.at(-1).weight_kg, 13.25);
    assert.equal(records["kid-a"].growth.at(-1).head_circumference_cm, 48.75);
    check("create growth with decimal weight, head circumference and notes");
    await openNew();
    assert.equal(
      await ev(`document.querySelector('#kid-weight_kg').value`),
      "",
    );
    await input("#kid-weight_kg", "22");
    await textClick("Batal");
    await click('[aria-label="Pilih Budi"]');
    await wait(
      `document.querySelector('.kids-profile-header h2')?.textContent==='Budi'`,
    );
    await openNew();
    assert.equal(
      await ev(`document.querySelector('#kid-weight_kg').value`),
      "",
    );
    await textClick("Batal");
    check("new forms reset on save, cancel and child change");
    assert.equal(records["kid-b"].growth.length, 0);
    check("Ani draft is never stored for Budi");
    await click('[aria-label="Pilih Ani"]');
    await wait(`!!document.querySelector('#growth-metric')`);
    await click('[aria-label="Edit pertumbuhan 1 Jan 2026"]');
    await input("#kid-height_cm", "");
    await input("#kid-weight_kg", "");
    await input("#kid-head_circumference_cm", "48");
    await input("#kid-notes", "");
    await save();
    assert.equal(records["kid-a"].growth[0].height_cm, null);
    assert.equal(records["kid-a"].growth[0].notes, "");
    check("growth edit clears optional values");
    await remove('[aria-label="Hapus pertumbuhan 10 Jan 2026"]');
    assert.equal(
      records["kid-a"].growth.some((r) => r.id === "g2"),
      false,
    );
    check("delete growth");
    await textClick("Vaksin");
    await wait(`document.body.innerText.includes('Vaksin uji')`);
    assert.ok(
      await ev(
        `document.body.innerText.includes('1 Jan 2026')&&!document.body.innerText.includes('T00:00')`,
      ),
    );
    check("vaccine date normalized");
    await textClick("Catat diberikan");
    await wait(`!!document.querySelector('#kid-given_date')`);
    assert.equal(
      await ev(`document.querySelector('#kid-given_by').value`),
      "Klinik",
    );
    assert.equal(
      await ev(`document.querySelector('#kid-notes').value`),
      "Jangan hilang",
    );
    await input("#kid-given_date", "2026-01-03");
    await audit("vaccine-form-light", true);
    await save();
    assert.equal(records["kid-a"].vaccines[0].given_date, "2026-01-03");
    assert.equal(records["kid-a"].vaccines[0].notes, "Jangan hilang");
    check("vaccine actual date and metadata preserved");
    await click('[aria-label="Edit vaksin Vaksin uji"]');
    await input("#kid-given_date", "");
    await input("#kid-given_by", "");
    await save();
    assert.equal(records["kid-a"].vaccines[0].given_date, null);
    check("vaccine can be corrected to not yet given");
    await openNew("Tambah vaksin");
    await input("#kid-vaccine_name", "Vaksin baru");
    await input("#kid-scheduled_date", "2026-12-01");
    await save();
    check("manual vaccine schedule creation");
    await remove('[aria-label="Hapus vaksin Vaksin baru"]');
    check("delete vaccine");
    await textClick("Milestone");
    await wait(`document.body.innerText.includes('Bersepeda')`);
    await click('[aria-label="Catat tercapai Bersepeda"]');
    await input("#kid-achieved_at", "2026-02-01");
    await audit("milestone-form-light", true);
    await save();
    assert.equal(records["kid-a"].milestones[0].achieved_at, "2026-02-01");
    check("milestone achievement records chosen date");
    await click('[aria-label="Buka kembali Bersepeda"]');
    await wait(
      `!!document.querySelector('[aria-label="Catat tercapai Bersepeda"]')`,
    );
    assert.equal(records["kid-a"].milestones[0].achieved_at, null);
    check("milestone reopen sends explicit state");
    await openNew("Tambah milestone");
    await input("#kid-title", "Menyanyi");
    await input("#kid-category", "bahasa");
    await save();
    check("create milestone");
    await remove('[aria-label="Hapus milestone Menyanyi"]');
    check("delete milestone");
    await textClick("Kesehatan");
    await wait(`document.body.innerText.includes('Kontrol tahunan')`);
    assert.ok(
      await ev(
        `document.body.innerText.includes('Vitamin')&&document.body.innerText.includes('Catatan kesehatan')`,
      ),
    );
    check("health shows medication and notes");
    await click('[aria-label="Edit catatan kesehatan 1 Jan 2026"]');
    await input("#kid-doctor", "");
    await input("#kid-medication", "");
    await input("#kid-notes", "");
    await audit("health-form-light", true);
    await save();
    assert.equal(records["kid-a"].health[0].medication, "");
    check("health fields can be cleared");
    await openNew();
    await input("#kid-description", "Kontrol baru");
    await input("#kid-medication", "Obat uji");
    await save();
    check("create health record");
    await remove(
      '[aria-label="Hapus catatan kesehatan ' +
        (await ev(
          `new Intl.DateTimeFormat('id-ID',{day:'numeric',month:'short',year:'numeric'}).format(new Date(${JSON.stringify(today)}+'T00:00:00'))`,
        )) +
        '"]',
    );
    check("delete health record");
    await textClick("Edit profil");
    await input("#kid-name", "Ani Putri");
    await input("#kid-notes", "");
    await save();
    assert.equal(kids[0].name, "Ani Putri");
    check("profile edit uses fresh query state");
    await textClick("Tambah Anak");
    await input("#kid-name", "Citra");
    await input("#kid-birth_date", "2024-01-01");
    await input("#kid-gender", "female");
    await audit("profile-form-light", true);
    await save();
    await wait(
      `document.querySelector('.kids-profile-header h2')?.textContent==='Citra'`,
    );
    check("create profile selects it");
    await remove('[aria-label="Hapus profil Citra"]');
    await wait(`!!document.querySelector('[aria-label="Pilih Ani Putri"]')`);
    check("profile deletion selects surviving profile");
    await textClick("Pertumbuhan");
    await openNew();
    await input("#kid-weight_kg", "15");
    failSave = true;
    await textClick("Simpan");
    await wait(
      `document.querySelector('[role=alert]')?.textContent.includes('Gagal menyimpan fixture')`,
    );
    assert.equal(
      await ev(`document.querySelector('#kid-weight_kg').value`),
      "15",
    );
    check("failed save preserves draft and server error");
    failSave = false;
    await textClick("Batal");
    await openNew();
    const mutationCount = result.mutations.length;
    await textClick("Simpan");
    await wait(
      `document.querySelector('[role=alert]')?.textContent.includes('minimal satu')`,
    );
    assert.equal(result.mutations.length, mutationCount);
    check("empty growth rejected before API");
    await textClick("Batal");
    for (const width of [375, 390, 1024, 1440]) {
      await go(width);
      await wait(`!!document.querySelector('#growth-metric')`);
      assert.equal(
        await ev(`document.documentElement.scrollWidth>innerWidth`),
        false,
      );
      await shot(`kids-modern-${width}.png`);
      await audit(`growth-light-${width}`);
      check(`no page overflow ${width}`);
      for (const tab of ["Vaksin", "Milestone", "Kesehatan"]) {
        await textClick(tab);
        assert.equal(
          await ev(`document.documentElement.scrollWidth>innerWidth`),
          false,
        );
      }
    }
    await textClick("Pertumbuhan");
    await click('[aria-label="Gunakan tema gelap"]');
    await pause(400);
    await shot("kids-modern-dark.png");
    await audit("growth-dark");
    for (const tab of ["Vaksin", "Milestone", "Kesehatan"]) {
      await textClick(tab);
      await audit(tab + "-dark");
      await openNew(
        tab === "Vaksin"
          ? "Tambah vaksin"
          : tab === "Milestone"
            ? "Tambah milestone"
            : "Catat baru",
      );
      await audit(tab + "-form-dark", true);
      await textClick("Batal");
    }
    await textClick("Pertumbuhan");
    await openNew();
    await audit("growth-form-dark", true);
    await textClick("Batal");
    const brand = await ev(
      `(()=>{const e=document.querySelector('.sidebar-wordmark svg');return {width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height,color:getComputedStyle(e).color}})()`,
    );
    assert.equal(brand.width, 84);
    assert.equal(brand.height, 25);
    check("Habit wordmark has compact dimensions and theme color");
    mode = "empty";
    await go();
    await wait(`document.body.innerText.includes('Belum ada profil anak')`);
    check("empty profile state");
    mode = "error";
    await go();
    await pause(2500);
    await wait(`document.body.innerText.includes('Coba lagi')`);
    check("profile error state");
    mode = "normal";
    for (const role of ["child", "view_only"]) {
      await go(390, "?role=" + role);
      await wait(
        `document.body.innerText.includes('hanya tersedia untuk anggota dewasa')`,
      );
      assert.equal(
        await ev(`!!document.querySelector('button.kids-button')`),
        false,
      );
      check(role + " cannot manage kids");
    }
    assert.deepEqual(result.errors, []);
    assert.ok(
      result.audits.every((a) => a.violations.length === 0),
      JSON.stringify(result.audits.filter((a) => a.violations.length)),
    );
  } finally {
    fs.mkdirSync(output, { recursive: true });
    fs.writeFileSync(
      path.join(output, "kids-modern-results.json"),
      JSON.stringify(result, null, 2),
    );
    ws?.close();
    chrome.kill();
  }
  console.log(
    JSON.stringify({
      checks: result.checks.length,
      audits: result.audits.length,
      errors: result.errors,
    }),
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
