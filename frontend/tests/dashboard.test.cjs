const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const Module = require("node:module");
const path = require("node:path");
const filename = path.resolve(__dirname, "../lib/dashboard.ts");
const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const mod = new Module(filename, module);
mod._compile(compiled, filename);
const {
  dateKey,
  localDateKey,
  dayRange,
  groupTasks,
  eventsForDay,
  budgetOverview,
} = mod.exports;
const now = new Date(2026, 10, 13, 0, 30);
const task = (id, due_date, status = "pending") => ({ id, due_date, status });

test("date columns retain their calendar date and invalid dates are rejected", () => {
  assert.equal(dateKey("2026-11-13T00:00:00Z"), "2026-11-13");
  for (const value of [null, "", "invalid", "2026-02-30", "2026-13-01"])
    assert.equal(dateKey(value), null);
});
test("local day boundaries are generated from local midnight", () => {
  const { start, end } = dayRange(now);
  assert.equal(localDateKey(start), "2026-11-13");
  assert.equal(start.getHours(), 0);
  assert.equal(localDateKey(end), "2026-11-14");
});
test("tasks distinguish yesterday, today, tomorrow, completed and unscheduled", () => {
  const groups = groupTasks(
    [
      task("old", "2026-11-12"),
      task("today", "2026-11-13T00:00:00Z"),
      task("future", "2026-11-14"),
      task("done", "2026-11-12", "done"),
      task("unscheduled", null),
      task("invalid", "bad"),
    ],
    now,
  );
  assert.deepEqual(
    groups.today.map((t) => t.id),
    ["today"],
  );
  assert.deepEqual(
    groups.overdue.map((t) => t.id),
    ["old"],
  );
  assert.deepEqual(
    groups.unscheduled.map((t) => t.id),
    ["unscheduled", "invalid"],
  );
});
test("agenda includes ongoing and multi-day events but excludes adjacent days and invalid intervals", () => {
  const event = (id, start_at, end_at) => ({ id, start_at, end_at });
  const events = eventsForDay(
    [
      event("ongoing", "2026-11-12T23:00:00", "2026-11-13T01:00:00"),
      event("multi", "2026-11-11T00:00:00", "2026-11-15T00:00:00"),
      event("tomorrow", "2026-11-14T00:00:00", "2026-11-14T02:00:00"),
      event("ends-at-midnight", "2026-11-12T23:00:00", "2026-11-13T00:00:00"),
      event("point", "2026-11-13T00:00:00", "2026-11-13T00:00:00"),
      event("invalid", "bad", "bad"),
    ],
    now,
  );
  assert.deepEqual(
    events.map((e) => e.id),
    ["multi", "ongoing", "point"],
  );
});
test("zero or missing budget has no fabricated percentage or remaining value", () => {
  for (const budgets of [[], [{ amount: 0, month: 11, year: 2026 }]]) {
    const summary = budgetOverview(budgets, 50000, 11, 2026);
    assert.equal(summary.hasBudget, false);
    assert.equal(summary.percentage, null);
    assert.equal(summary.remaining, null);
    assert.equal(summary.barPercentage, 0);
  }
});
test("budget uses selected month and real category totals; over-budget label remains above 100%", () => {
  const budgets = [
    { amount: 200000, month: 11, year: 2026 },
    { amount: 300000, month: 11, year: 2026 },
    { amount: 900000, month: 10, year: 2026 },
  ];
  const summary = budgetOverview(budgets, 650000, 11, 2026);
  assert.equal(summary.total, 500000);
  assert.equal(summary.remaining, -150000);
  assert.equal(summary.percentage, 130);
  assert.equal(summary.barPercentage, 100);
  assert.equal(budgetOverview(budgets, 0, 11, 2026).percentage, 0);
});
