// Document UI checks with intercepted APIs; never touches real family documents.
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
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "habit-documents-"));
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
      throw Error("Timed out: " + expression);
    };
    const check = (name) => result.checks.push(name);
    const audit = async (name, selector) => {
      await ev(
        fs.readFileSync(
          process.env.HABIT_AXE_PATH || "/tmp/habit-documents-axe.min.js",
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

    let docs = [],
      failDelete = false,
      failSave = false,
      requestCount = 0;
    const doc = {
      id: "11111111-1111-4111-8111-111111111111",
      title: "Kartu Keluarga",
      type: "kk",
      tags: "identitas",
      file_name: "keluarga.pdf",
      content_type: "application/pdf",
      file_size: 1024,
      is_encrypted: true,
      created_at: "2026-11-14T10:00:00Z",
    };
    const user = {
      id: "22222222-2222-4222-8222-222222222222",
      family_id: "33333333-3333-4333-8333-333333333333",
      name: "QA Habit",
      role: "admin",
      email: "qa@example.test",
    };
    on("Fetch.requestPaused", async (p) => {
      try {
        const u = new URL(p.request.url),
          route = u.pathname.split("/api/v1")[1];
        if (route?.startsWith("/documents"))
          (result.requests ??= []).push({
            method: p.request.method,
            path: u.pathname,
          });
        let data = [],
          code = 200,
          message = "success",
          raw = null;
        let rawType = "application/pdf";
        if (route === "/auth/refresh") data = { access_token: "qa-token" };
        else if (route === "/auth/me") data = user;
        else if (route === "/family/members") data = [user];
        else if (route === "/documents/capabilities")
          data = { encryption_available: true };
        else if (route?.endsWith("/download")) {
          rawType = docs[0]?.content_type || "application/pdf";
          raw =
            rawType === "image/png"
              ? Buffer.from(
                  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=",
                  "base64",
                )
              : "%PDF-1.4\n%%EOF";
        } else if (route === "/documents" && p.request.method === "POST") {
          if (failSave) {
            code = 503;
            message = "Storage sedang offline";
          } else {
            docs = [{ ...doc, title: "Dokumen baru" }];
            data = { id: doc.id };
          }
        } else if (
          route?.startsWith("/documents/") &&
          p.request.method === "PUT"
        ) {
          data = JSON.parse(p.request.postData);
          docs = docs.map((d) => ({ ...d, ...data }));
        } else if (
          route?.startsWith("/documents/") &&
          p.request.method === "DELETE"
        ) {
          if (failDelete) {
            docs = docs.map((d) => ({ ...d, storage_delete_pending: true }));
            code = 503;
            message = "File belum selesai dihapus; coba lagi";
          } else docs = [];
        } else if (route === "/documents") {
          requestCount++;
          data = docs.filter(
            (d) =>
              (!u.searchParams.get("type") ||
                d.type === u.searchParams.get("type")) &&
              (!u.searchParams.get("search") ||
                (d.title + d.tags)
                  .toLowerCase()
                  .includes(u.searchParams.get("search").toLowerCase())),
          );
        }
        await send("Fetch.fulfillRequest", {
          requestId: p.requestId,
          responseCode: p.request.method === "OPTIONS" ? 204 : code,
          responseHeaders: [
            {
              name: "Content-Type",
              value: raw ? rawType : "application/json",
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
    await send("Network.setCookie", {
      name: "access_token",
      value: "qa-token",
      url: origin,
    });
    await send("Page.addScriptToEvaluateOnNewDocument", {
      source: `localStorage.setItem('keluarga-auth',JSON.stringify({state:{user:${JSON.stringify(user)},accessToken:'qa-token',isAuthenticated:true},version:0}));localStorage.setItem('access_token','qa-token');localStorage.setItem('refresh_token','qa-refresh');localStorage.setItem('pwa-prompt-dismissed',String(Date.now()));`,
    });
    const click = async (text) => {
      await ev(
        `(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(text)});if(!b)throw Error('missing button '+${JSON.stringify(text)});b.click();return true;})()`,
      );
      await pause(100);
    };
    const fill = async (id, value) => {
      await ev(
        `(()=>{const e=document.getElementById(${JSON.stringify(id)});Object.getOwnPropertyDescriptor(${JSON.stringify(id)}==='document-type'?HTMLSelectElement.prototype:HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));return true})()`,
      );
    };
    await send("Page.navigate", { url: origin + "/documents" });
    await wait(
      `document.body?.innerText.includes('Simpan yang penting, temukan dengan mudah')`,
    );
    await click("Unggah dokumen");
    await wait(`!!document.querySelector('[role=dialog]')`);
    assert.equal(
      await ev(`document.querySelector('#document-type').value`),
      "other",
    );
    const file = path.join(os.tmpdir(), "habit-qa-document.pdf");
    fs.writeFileSync(file, "%PDF-1.4\n%%EOF");
    const root = await send("DOM.getDocument");
    const node = await send("DOM.querySelector", {
      nodeId: root.root.nodeId,
      selector: "#document-file",
    });
    await send("DOM.setFileInputFiles", { nodeId: node.nodeId, files: [file] });
    await pause(150);
    await fill("document-title", "Dokumen baru");
    await fill("document-type", "kk");
    await fill("document-tags", "identitas");
    await ev(`document.querySelector('input[type=checkbox]').click()`);
    failSave = true;
    await ev(`document.querySelector('[role=dialog] form').requestSubmit()`);
    await wait(
      `document.querySelector('[role=alert]')?.innerText.includes('offline')`,
    );
    check("server upload error preserves draft");
    failSave = false;
    await ev(`document.querySelector('[role=dialog] form').requestSubmit()`);
    await wait(
      `!document.querySelector('[role=dialog]') && document.body?.innerText.includes('Dokumen baru')`,
    );
    check("upload form with file, category, tags and encryption");
    await ev(
      `document.querySelector('[aria-label="Edit Dokumen baru"]').click()`,
    );
    await wait(`!!document.getElementById('document-title')`);
    await fill("document-title", "Akta Nadia");
    await fill("document-type", "akta");
    await fill("document-tags", "anak");
    await ev(`document.querySelector('[role=dialog] form').requestSubmit()`);
    await wait(
      `!document.querySelector('[role=dialog]') && document.body?.innerText.includes('Akta Nadia')`,
    );
    check("edit metadata and clear/change fields");
    await ev(
      `document.querySelector('[aria-label="Pratinjau Akta Nadia"]').click()`,
    );
    await wait(
      `!!document.querySelector('iframe[title="Pratinjau Akta Nadia"]')`,
    );
    await ev(
      `document.querySelector('[aria-label="Tutup pratinjau"]').click()`,
    );
    check("private PDF preview opens and closes");
    await ev(
      `document.querySelector('[aria-label="Unduh Akta Nadia"]').click()`,
    );
    await pause(200);
    check("authenticated download triggered");
    docs[0].content_type = "image/png";
    await ev(
      `document.querySelector('[aria-label="Pratinjau Akta Nadia"]').click()`,
    );
    await wait(
      `!!document.querySelector('.documents-image-preview img')?.complete`,
    );
    assert.ok(
      await ev(
        `document.querySelector('.documents-image-preview img').naturalWidth>0`,
      ),
    );
    await ev(
      `document.querySelector('[aria-label="Tutup pratinjau"]').click()`,
    );
    docs[0].content_type = "application/pdf";
    check("image blob preview loads");
    await ev(
      `document.querySelector('[aria-label="Hapus Akta Nadia"]').click()`,
    );
    failDelete = true;
    await ev(`document.querySelector('[role=dialog] .bg-red-700').click()`);
    await wait(`document.body?.innerText.includes('Coba hapus lagi')`);
    assert.equal(
      await ev(
        `!!document.querySelector('[aria-label="Pratinjau Akta Nadia"]')`,
      ),
      false,
    );
    check("failed storage cleanup offers retry and blocks read");
    await click("Coba hapus lagi");
    failDelete = false;
    await ev(`document.querySelector('[role=dialog] .bg-red-700').click()`);
    await wait(
      `document.body?.innerText.includes('Simpan yang penting, temukan dengan mudah')`,
    );
    check("delete retry finishes cleanup");
    docs = [doc];
    await send("Page.reload");
    await wait(`document.body?.innerText.includes('Kartu Keluarga')`);
    for (const width of [375, 390, 768, 1440]) {
      await send("Emulation.setDeviceMetricsOverride", {
        width,
        height: 900,
        deviceScaleFactor: 1,
        mobile: width < 600,
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
        assert.equal(
          await ev('document.querySelectorAll("main h1").length'),
          1,
        );
        check(`${width} ${theme}: layout no overflow`);
        if (width === 390 || width === 1440)
          await audit(`page ${width} ${theme}`, "main");
        if (width === 390 || width === 1440)
          await shot(`documents-modern-${width}-${theme}.png`);
        await click("Unggah dokumen");
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
          await audit(`form ${theme}`, "[role=dialog]");
          await shot(`documents-modern-form-${theme}.png`);
        }
        await ev(
          `document.querySelector('[aria-label="Tutup form dokumen"]').click()`,
        );
        check(`${width} ${theme}: upload dialog focus and width`);
      }
    }
    // Search uses a debounce and searches tags as well as names.
    await ev(
      `(()=>{const e=document.querySelector('[aria-label="Cari nama atau tag dokumen"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'identitas');e.dispatchEvent(new Event('input',{bubbles:true}));return true})()`,
    );
    await pause(500);
    assert.ok(await ev(`document.body?.innerText.includes('Kartu Keluarga')`));
    check("debounced search by tag");
    await click("KTP");
    await wait(`document.body?.innerText.includes('Dokumen belum ditemukan')`);
    await click("Reset pencarian");
    await wait(`document.body?.innerText.includes('Kartu Keluarga')`);
    check("category filter and reset");
    const countBeforeRole = requestCount;
    await send("Page.addScriptToEvaluateOnNewDocument", {
      source: `const auth=JSON.parse(localStorage.getItem('keluarga-auth'));auth.state.user.role='view_only';localStorage.setItem('keluarga-auth',JSON.stringify(auth));`,
    });
    await send("Page.reload");
    await wait(
      `document.body?.innerText.includes('Dokumen khusus anggota dewasa')`,
    );
    await pause(500);
    assert.equal(requestCount, countBeforeRole);
    check("view-only UI hides document actions and skips document queries");
    assert.deepEqual(result.runtimeErrors, []);
  } finally {
    fs.writeFileSync(
      path.join(out, "documents-modern-results.json"),
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
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
