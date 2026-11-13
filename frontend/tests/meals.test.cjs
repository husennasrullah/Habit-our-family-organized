const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
function load(file, api) {
  const filename = path.resolve(__dirname, file);
  const mod = new Module(filename, module);
  mod.paths = Module._nodeModulePaths(path.dirname(filename));
  const originalRequire = mod.require.bind(mod);
  mod.require = (name) => name === "@/lib/api" ? api : originalRequire(name);
  mod._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText, filename);
  return mod.exports;
}
const { mealFormSchema, isRecipeURL } = load("../lib/mealPlans.ts");
const meal = { name: " Nasi ", notes: " 4 porsi ", recipe_url: " https://example.test ", date: "2028-02-29", meal_type: "lunch" };
test("meal form normalizes input and rejects impossible dates and unsafe recipe links", () => {
  assert.equal(mealFormSchema.parse(meal).name, "Nasi");
  assert.equal(isRecipeURL("javascript:alert(1)"), false);
  assert.equal(isRecipeURL("https://example.test/resep"), true);
  for (const invalid of [{ name: " " }, { date: "2026-02-30" }, { date: "0000-01-01" }, { date: "2026-1-01" }, { recipe_url: "javascript:alert(1)" }, { recipe_url: "https://user:pass@example.test" }, { recipe_url: "not a link" }, { meal_type: "snack" }, { notes: "a".repeat(2001) }]) {
    assert.equal(mealFormSchema.safeParse({ ...meal, ...invalid }).success, false, JSON.stringify(invalid));
  }
});
test("push lifecycle confirms server persistence and never reports unavailable config as success", async () => {
  const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  const calls = [];
  let existing = null, key = "BA", failPost = false, failDelete = false;
  const subscription = { endpoint: "https://fcm.googleapis.com/test", toJSON: () => ({ keys: { p256dh: "key", auth: "secret" } }), unsubscribe: async () => { calls.push("unsubscribe"); existing = null; return true; } };
  const reg = { active: true, pushManager: { getSubscription: async () => existing, subscribe: async () => { calls.push("subscribe"); existing = subscription; return subscription; } } };
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: { serviceWorker: { getRegistration: async () => reg } } });
  globalThis.window = { atob: (value) => Buffer.from(value, "base64").toString("binary") };
  const api = { get: async (url) => ({ data: url.endsWith("vapid-key") ? { public_key: key } : { subscribed: true } }), post: async () => { calls.push("post"); if (failPost) throw new Error("server failed"); }, delete: async () => { calls.push("delete"); if (failDelete) throw new Error("server failed"); } };
  const push = load("../lib/pushNotification.ts", api);
  try {
    key = ""; await assert.rejects(push.subscribeToPush(), /dikonfigurasi/); assert.deepEqual(calls, []);
    key = "BA"; failPost = true; await assert.rejects(push.subscribeToPush(), /server failed/); assert.deepEqual(calls, ["subscribe", "post", "unsubscribe"]);
    calls.length = 0; failPost = false; await push.subscribeToPush(); assert.deepEqual(calls, ["subscribe", "post"]);
    assert.equal(await push.currentPushSubscription(), true);
    calls.length = 0; failPost = true; await assert.rejects(push.subscribeToPush(), /server failed/); assert.deepEqual(calls, ["post"]); assert.ok(existing); failPost = false;
    calls.length = 0; await push.subscribeToPush(); assert.deepEqual(calls, ["post"]);
    calls.length = 0; failDelete = true; await assert.rejects(push.unsubscribeFromPush(), /server failed/); assert.deepEqual(calls, ["delete"]); assert.ok(existing);
    calls.length = 0; failDelete = false; await push.unsubscribeFromPush(); assert.deepEqual(calls, ["delete", "unsubscribe"]);
    assert.equal(await push.currentPushSubscription(), false);
    reg.active = false; await assert.rejects(push.subscribeToPush(), /belum siap/);
  } finally {
    if (originalNavigator) Object.defineProperty(globalThis, "navigator", originalNavigator); else delete globalThis.navigator;
    delete globalThis.window;
  }
});
