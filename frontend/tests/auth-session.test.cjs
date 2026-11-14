const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
function load(post, state) {
  const file = path.resolve(__dirname, "../lib/authSession.ts");
  const mod = new Module(file, module);
  mod.paths = Module._nodeModulePaths(path.dirname(file));
  mod.require = (name) => {
    if (name === "axios") return { post };
    if (name === "@/stores/authStore")
      return { useAuthStore: { getState: () => state } };
    throw Error(name);
  };
  mod._compile(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        esModuleInterop: true,
      },
    }).outputText,
    file,
  );
  return mod.exports;
}
test("refresh is single-flight, syncs member/token and cannot resurrect a logged-out session", async () => {
  const values = new Map([["refresh_token", "refresh-1"]]);
  global.localStorage = {
    getItem: (k) => values.get(k) || null,
    setItem: (k, v) => values.set(k, v),
  };
  try {
    let resolve,
      calls = 0;
    const state = {
      authVersion: 1,
      setAccessToken: (t) => {
        state.access = t;
      },
      setUser: (m) => {
        state.member = m;
      },
    };
    const auth = load(() => {
      calls++;
      return new Promise((r) => {
        resolve = r;
      });
    }, state);
    const a = auth.refreshSession(),
      b = auth.refreshSession();
    assert.equal(a, b);
    assert.equal(calls, 1);
    resolve({
      data: {
        data: {
          access_token: "access-2",
          refresh_token: "refresh-2",
          member: { name: "Updated" },
        },
      },
    });
    await a;
    assert.equal(state.access, "access-2");
    assert.equal(state.member.name, "Updated");
    assert.equal(values.get("refresh_token"), "refresh-2");
    const stale = auth.refreshSession();
    state.authVersion++;
    resolve({
      data: {
        data: { access_token: "must-not-restore", member: { name: "Old" } },
      },
    });
    await assert.rejects(stale, /Sesi telah berubah/);
    assert.equal(state.access, "access-2");
    assert.equal(auth.isInvalidSession({ response: { status: 401 } }), true);
    assert.equal(auth.isInvalidSession({ response: { status: 503 } }), false);
  } finally {
    delete global.localStorage;
  }
});
