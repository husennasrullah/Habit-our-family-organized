const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const Module = require("node:module");
const path = require("node:path");
const filename = path.resolve(__dirname, "../lib/finance.ts");
const mod = new Module(filename, module);
mod._compile(
  ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText,
  filename,
);
const { financeOverview } = mod.exports;
test("budget remainder includes expenses without a category allocation", () => {
  const result = financeOverview(
    [{ category: "Makanan", amount: 100 }],
    [
      { category: "Makanan", total: 70 },
      { category: "Kesehatan", total: 50 },
    ],
  );
  assert.equal(result.allocated, 100);
  assert.equal(result.spent, 120);
  assert.equal(result.remaining, -20);
  assert.deepEqual(
    result.unallocated.map((c) => c.category),
    ["Kesehatan"],
  );
});
test("empty budgets are not fabricated and fractional currency stays accurate", () => {
  assert.deepEqual(financeOverview([], []), {
    allocated: 0,
    spent: 0,
    remaining: 0,
    unallocated: [],
  });
  assert.equal(
    financeOverview(
      [{ category: "A", amount: 0.3 }],
      [{ category: "A", total: 0.2 }],
    ).remaining,
    0.1,
  );
});

test("local date in Jakarta stays today when the UTC date is still yesterday", () => {
  const old = process.env.TZ;
  process.env.TZ = "Asia/Jakarta";
  try {
    const file = path.resolve(__dirname, "../lib/dashboard.ts"),
      localMod = new Module(file, module);
    localMod._compile(
      ts.transpileModule(fs.readFileSync(file, "utf8"), {
        compilerOptions: { module: ts.ModuleKind.CommonJS },
      }).outputText,
      file,
    );
    const nearMidnight = new Date("2026-11-12T17:30:00Z");
    assert.equal(localMod.exports.localDateKey(nearMidnight), "2026-11-13");
    assert.equal(nearMidnight.toISOString().slice(0, 10), "2026-11-12");
  } finally {
    if (old === undefined) delete process.env.TZ;
    else process.env.TZ = old;
  }
});
