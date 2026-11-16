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
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "habit-memories-"));
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
          process.env.HABIT_AXE_PATH ||
            path.resolve(__dirname, "../node_modules/axe-core/axe.min.js"),
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

    const user = {
      id: "11111111-1111-4111-8111-111111111111",
      family_id: "22222222-2222-4222-8222-222222222222",
      name: "Nadia Pratama",
      email: "qa@example.test",
      role: "admin",
      color: "sky",
    };
    const photo = (id, memory_id) => ({
      id,
      memory_id,
      url: `/api/v1/memories/${memory_id}/photos/${id}/serve`,
      caption: "",
      order: 0,
    });
    let memories = [
      {
        id: "m1",
        title: "Piknik keluarga",
        date: "2026-11-15",
        content: "Cerita lengkap ".repeat(30) + "AKHIR CERITA",
        is_favorite: true,
        photos: [photo("p1", "m1"), photo("p2", "m1"), photo("p3", "m1")],
      },
      {
        id: "m2",
        title: "Cerita tanpa foto",
        date: "2019-01-02",
        content: "Hari pertama masuk sekolah.",
        is_favorite: false,
        photos: [],
      },
    ];
    let failList = false,
      failSave = false,
      failUpload = false,
      failPhoto = false,
      failDelete = false,
      photo401 = false,
      created = 0,
      uploads = 0;
    const png = fs.readFileSync(
      path.resolve(__dirname, "../public/icons/habit-v3-192.png"),
    );
    on("Fetch.requestPaused", async (p) => {
      try {
        const route = new URL(p.request.url).pathname.split("/api/v1")[1];
        let data = [],
          code = 200,
          message = "success",
          raw = null;
        const method = p.request.method;
        const body = () => JSON.parse(p.request.postData || "{}");
        if (method !== "OPTIONS") {
          if (route === "/auth/refresh")
            data = {
              access_token: "qa-token",
              refresh_token: "qa-refresh",
              member: user,
            };
          else if (route === "/auth/me") data = user;
          else if (route === "/family")
            data = { id: user.family_id, name: "Keluarga Pratama" };
          else if (route === "/family/members") data = [user];
          else if (route?.endsWith("/serve")) {
            if (photo401) {
              photo401 = false;
              code = 401;
            } else if (failPhoto) {
              code = 503;
              message = "Storage offline";
            } else raw = png;
          } else if (route === "/memories" && method === "GET") {
            if (failList) {
              code = 503;
              message = "Gagal memuat";
            } else data = memories;
          } else if (route === "/memories" && method === "POST") {
            if (failSave) {
              code = 400;
              message = "Gagal menyimpan simulasi";
            } else {
              data = {
                ...body(),
                id: "new" + ++created,
                photos: [],
                is_favorite: false,
              };
              memories.unshift(data);
            }
          } else if (
            route?.match(/^\/memories\/[^/]+\/photos$/) &&
            method === "POST"
          ) {
            uploads++;
            if (failUpload) {
              code = 503;
              message = "Foto gagal diunggah simulasi";
            } else {
              const m = memories.find((m) => m.id === route.split("/")[2]);
              m.photos.push(photo("newp" + uploads, m.id));
              data = m.photos;
            }
          } else if (
            route?.match(/^\/memories\/[^/]+\/photos\/[^/]+$/) &&
            method === "DELETE"
          ) {
            const m = memories.find((m) => m.id === route.split("/")[2]);
            m.photos = m.photos.filter((x) => x.id !== route.split("/")[4]);
          } else if (route?.match(/^\/memories\/[^/]+$/)) {
            const id = route.split("/")[2],
              m = memories.find((m) => m.id === id);
            if (method === "PUT") {
              if (failSave) {
                code = 400;
                message = "Gagal menyimpan simulasi";
              } else {
                Object.assign(m, body());
                data = m;
              }
            } else if (method === "DELETE") {
              if (failDelete) {
                code = 503;
                message = "File belum selesai dihapus";
                m.storage_delete_pending = true;
              } else memories = memories.filter((x) => x.id !== id);
            } else data = m;
          }
        }
        await send("Fetch.fulfillRequest", {
          requestId: p.requestId,
          responseCode: code,
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
            method === "OPTIONS"
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
    await send("Page.addScriptToEvaluateOnNewDocument", {
      source: `if(location.pathname==='/memories'){localStorage.setItem('keluarga-auth',JSON.stringify({state:{user:${JSON.stringify(user)},accessToken:'qa-token',isAuthenticated:true},version:0}));localStorage.setItem('access_token','qa-token');localStorage.setItem('refresh_token','qa-refresh');localStorage.setItem('pwa-prompt-dismissed',String(Date.now()));}`,
    });
    await send("Network.setCookie", {
      name: "access_token",
      value: "qa-token",
      url: origin,
    });
    const go = async () => {
      await send("Page.navigate", { url: origin + "/memories" });
      await wait(`document.querySelector('h1')?.textContent==='Kenangan'`);
      await pause(600);
    };
    const click = async (text) => {
      await ev(
        `(()=>{const scope=[...document.querySelectorAll('[role=dialog]')].at(-1)||document;const b=[...scope.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(text)});if(!b)throw Error('missing '+${JSON.stringify(text)});b.click()})()`,
      );
      await pause(150);
    };
    const select = async (selector, value) => {
      await ev(
        `(()=>{const e=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(e.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));})()`,
      );
      await pause(150);
    };
    const named = async (name) => {
      await ev(`document.querySelector('[aria-label="${name}"]').click()`);
      await pause(150);
    };
    const overflow = async () =>
      assert.equal(
        await ev("document.documentElement.scrollWidth>innerWidth"),
        false,
      );
    for (const width of [375, 390, 768, 1440]) {
      await send("Emulation.setDeviceMetricsOverride", {
        width,
        height: 900,
        deviceScaleFactor: 1,
        mobile: width < 500,
      });
      await go();
      await wait(`document.querySelectorAll('article').length===2`);
      await overflow();
      check(`gallery ${width}, full count and old year`);
      assert.equal(
        await ev(`document.body.innerText.includes('3 foto')`),
        true,
      );
      if (width === 390 || width === 1440)
        await shot(`memories-modern-${width}-light.png`);
      if (width === 390 || width === 1440)
        await audit(`gallery light ${width}`, ".app-main");
    }
    await named("Baca kenangan Cerita tanpa foto");
    await wait(`!!document.querySelector('[role=dialog]')`);
    assert.equal(
      await ev(
        `document.querySelector('[role=dialog]').innerText.includes('Hari pertama masuk sekolah.')`,
      ),
      true,
    );
    check("text-only detail");
    await named("Tutup cerita");
    await named("Baca kenangan Piknik keluarga");
    await wait(
      `document.querySelector('[role=dialog]')?.innerText.includes('AKHIR CERITA')`,
    );
    assert.equal(
      await ev(
        `document.querySelectorAll('[aria-label^="Perbesar foto"]').length`,
      ),
      3,
    );
    await named("Perbesar foto 1");
    await wait(`document.querySelectorAll('[role=dialog]').length===2`);
    await named("Berikutnya");
    assert.equal(
      await ev(`document.body.innerText.includes('2 dari 3 foto')`),
      true,
    );
    await named("Tutup");
    await named("Tutup cerita");
    check("full story and all photos in lightbox");
    await named("Edit Piknik keluarga");
    await wait(`!!document.querySelector('#mem-title')`);
    assert.equal(
      await ev(
        `document.querySelectorAll('[aria-label^="Hapus foto"]').length`,
      ),
      3,
    );
    await wait(`document.querySelectorAll('[role=dialog] img').length===3`);
    await shot("memories-modern-edit-1440.png");
    await audit("edit light", "[role=dialog]");
    await overflow();
    check("edit all authenticated photos");
    await send("Page.handleJavaScriptDialog", { accept: true }).catch(() => {});
    const dialogHandler = (p) =>
      send("Page.handleJavaScriptDialog", { accept: true });
    on("Page.javascriptDialogOpening", dialogHandler);
    await named("Hapus foto 2");
    await wait(
      `document.querySelectorAll('[aria-label^="Hapus foto"]').length===2`,
    );
    check("delete photo refreshes editor");
    await click("Batal");
    await click("Tambah kenangan");
    await select("#mem-title", "Draft batal");
    await click("Batal");
    await click("Tambah kenangan");
    assert.equal(await ev(`document.querySelector('#mem-title').value`), "");
    check("new form resets after cancel");
    await click("Simpan kenangan");
    assert.equal(
      await ev(`document.body.innerText.includes('Judul wajib diisi')`),
      true,
    );
    check("blank form validation");
    await select("#mem-title", "Kenangan baru");
    failSave = true;
    await click("Simpan kenangan");
    await wait(
      `document.querySelector('[role=alert]')?.innerText.includes('simulasi')`,
    );
    assert.equal(
      await ev(`document.querySelector('#mem-title').value`),
      "Kenangan baru",
    );
    check("save failure retains draft");
    failSave = false;
    await ev(
      `(()=>{const f=new File([Uint8Array.from(atob('${png.toString("base64")}'),c=>c.charCodeAt(0))],'foto.png',{type:'image/png'});const dt=new DataTransfer();dt.items.add(f);const e=document.querySelector('input[type=file]');e.files=dt.files;e.dispatchEvent(new Event('change',{bubbles:true}));})()`,
    );
    failUpload = true;
    await click("Simpan kenangan");
    await wait(
      `document.querySelector('[role=alert]')?.innerText.includes('Foto gagal')`,
    );
    assert.equal(created, 1);
    failUpload = false;
    await click("Simpan kenangan");
    await wait(`!document.querySelector('#mem-title')`);
    assert.equal(created, 1);
    check("upload retry does not duplicate journal");
    await select('[aria-label="Cari kenangan"]', "sekolah");
    assert.equal(await ev(`document.querySelectorAll('article').length`), 1);
    await select('[aria-label="Cari kenangan"]', "tidak ditemukan");
    assert.equal(
      await ev(
        `document.body.innerText.includes('Belum ada cerita di pilihan ini')`,
      ),
      true,
    );
    await click("Reset filter");
    check("search and empty filter reset");
    await select('[aria-label="Tahun kenangan"]', "2019");
    assert.equal(await ev(`document.querySelectorAll('article').length`), 1);
    await select('[aria-label="Tahun kenangan"]', "");
    await select('[aria-label="Bulan kenangan"]', "01");
    assert.equal(await ev(`document.querySelectorAll('article').length`), 1);
    await select('[aria-label="Bulan kenangan"]', "");
    check("dynamic year and month filters");
    await named("Hapus Cerita tanpa foto");
    await click("Hapus kenangan");
    await wait(`!document.querySelector('[role=dialog]')`);
    check("delete confirmation");
    failDelete = true;
    await named("Hapus Piknik keluarga");
    await click("Hapus kenangan");
    await wait(
      `document.querySelector('[role=alert]')?.innerText.includes('File belum')`,
    );
    failDelete = false;
    await click("Coba hapus lagi");
    await wait(`!document.querySelector('[role=dialog]')`);
    check("storage delete failure and retry");
    failPhoto = true;
    await go();
    await wait(`document.body.innerText.includes('Coba muat foto lagi')`);
    failPhoto = false;
    await click("Coba muat foto lagi");
    await wait(`!!document.querySelector('article img')`);
    check("photo read failure and retry");
    photo401 = true;
    await go();
    await wait(`!!document.querySelector('article img')`);
    check("photo 401 uses shared refresh");
    // Dark theme is set through the persisted theme, then reloaded.
    await ev(`localStorage.setItem('theme','dark')`);
    await go();
    await wait(`document.documentElement.classList.contains('dark')`);
    await shot("memories-modern-1440-dark.png");
    await audit("gallery dark", ".app-main");
    await overflow();
    check("dark gallery");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true,
    });
    await click("Tambah kenangan");
    await overflow();
    await shot("memories-modern-form-390-dark.png");
    await audit("form dark", "[role=dialog]");
    check("mobile dark compact form");
    await click("Batal");
    failList = true;
    await go();
    await wait(`document.body.innerText.includes('Coba lagi')`);
    check("list error");
    failList = false;
    await go();
    memories = [];
    await go();
    await wait(
      `document.body.innerText.includes('Cerita pertama dimulai di sini')`,
    );
    check("empty album");
    assert.deepEqual(result.runtimeErrors, []);
    console.log(
      JSON.stringify({
        checks: result.checks.length,
        runtimeErrors: result.runtimeErrors,
      }),
    );
  } finally {
    if (ws) ws.close();
    chrome.kill("SIGTERM");
    fs.writeFileSync(
      path.join(out, "memories-modern-results.json"),
      JSON.stringify(result, null, 2),
    );
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
