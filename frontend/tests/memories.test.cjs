const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs"),
  path = require("node:path"),
  Module = require("node:module"),
  ts = require("typescript");
const filename = path.resolve(__dirname, "../lib/memories.ts"),
  mod = new Module(filename, module);
mod.paths = Module._nodeModulePaths(path.dirname(filename));
mod._compile(
  ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText,
  filename,
);
const { memorySchema, validateMemoryFiles, localMemoryDate } = mod.exports;
test("memory metadata rejects blank titles and impossible dates and trims titles", () => {
  const good = { title: "  Piknik  ", date: "2028-02-29", content: "Cerita" };
  assert.equal(memorySchema.parse(good).title, "Piknik");
  for (const patch of [
    { title: " " },
    { title: "x".repeat(161) },
    { date: "2026-02-30" },
    { date: "2026-13-01" },
    { date: "0000-01-01" },
    { date: "2026-1-01" },
    { content: "x".repeat(20001) },
  ])
    assert.equal(
      memorySchema.safeParse({ ...good, ...patch }).success,
      false,
      JSON.stringify(patch),
    );
});
test("photo selection respects per-file, batch and album limits", () => {
  const photo = { name: "photo.PNG", size: 1024 };
  assert.equal(validateMemoryFiles([photo], 19), "");
  assert.ok(validateMemoryFiles([photo], 20));
  for (const invalid of [
    { name: "x.svg", size: 1 },
    { name: "x.jpg", size: 0 },
    { name: "x.png", size: 8 * 1024 * 1024 + 1 },
  ])
    assert.ok(validateMemoryFiles([invalid]));
  assert.ok(
    validateMemoryFiles(
      Array.from({ length: 6 }, () => ({
        name: "x.jpg",
        size: 8 * 1024 * 1024,
      })),
    ),
  );
});
test("memory default date uses Jakarta across the UTC day boundary", () => {
  const RealDate = global.Date;
  global.Date = class extends RealDate {
    constructor(...args) {
      super(...(args.length ? args : ["2026-11-15T18:30:00Z"]));
    }
  };
  try {
    assert.equal(localMemoryDate(), "2026-11-16");
  } finally {
    global.Date = RealDate;
  }
});
