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
const now = new Date("2026-11-13T00:30:00+07:00");
const deviceTimezones = [
  "UTC",
  "Asia/Jakarta",
  "America/Los_Angeles",
  "Asia/Tokyo",
  "Pacific/Kiritimati",
];
function inDeviceTimezones(check) {
  const originalTimezone = process.env.TZ;
  try {
    for (const timezone of deviceTimezones) {
      process.env.TZ = timezone;
      check(timezone);
    }
  } finally {
    if (originalTimezone === undefined) delete process.env.TZ;
    else process.env.TZ = originalTimezone;
  }
}
const task = (id, due_date, status = "pending") => ({ id, due_date, status });

test("date columns retain their calendar date and invalid dates are rejected", () => {
  assert.equal(dateKey("2026-11-13T00:00:00Z"), "2026-11-13");
  for (const value of [null, "", "invalid", "2026-02-30", "2026-13-01"])
    assert.equal(dateKey(value), null);
});
test("dashboard day boundaries use Jakarta midnight independently of device timezone", () => {
  inDeviceTimezones((timezone) => {
    const { start, end, from, to } = dayRange(now);
    assert.equal(localDateKey(start), "2026-11-13", timezone);
    assert.equal(from, "2026-11-12T17:00:00.000Z", timezone);
    assert.equal(to, "2026-11-13T17:00:00.000Z", timezone);
    assert.equal(start.toISOString(), from, timezone);
    assert.equal(end.toISOString(), to, timezone);
    assert.equal(
      end.getTime() - start.getTime(),
      24 * 60 * 60 * 1000,
      timezone,
    );
    assert.equal(localDateKey(end), "2026-11-14", timezone);
    assert.equal(
      localDateKey(new Date("2026-11-12T16:59:59.999Z")),
      "2026-11-12",
      timezone,
    );
    assert.equal(
      localDateKey(new Date("2026-11-12T17:00:00Z")),
      "2026-11-13",
      timezone,
    );
  });
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
test("agenda uses WIB boundaries across device timezones, including exclusive midnight ends", () => {
  const event = (id, start_at, end_at) => ({ id, start_at, end_at });
  inDeviceTimezones((timezone) => {
    const events = eventsForDay(
      [
        event(
          "ongoing",
          "2026-11-12T23:00:00+07:00",
          "2026-11-13T01:00:00+07:00",
        ),
        event(
          "multi",
          "2026-11-11T00:00:00+07:00",
          "2026-11-15T00:00:00+07:00",
        ),
        event(
          "tomorrow",
          "2026-11-14T00:00:00+07:00",
          "2026-11-14T02:00:00+07:00",
        ),
        event(
          "ends-at-midnight",
          "2026-11-12T23:00:00+07:00",
          "2026-11-13T00:00:00+07:00",
        ),
        event(
          "point",
          "2026-11-13T00:00:00+07:00",
          "2026-11-13T00:00:00+07:00",
        ),
        event(
          "reversed",
          "2026-11-13T02:00:00+07:00",
          "2026-11-13T01:00:00+07:00",
        ),
        event("invalid", "bad", "bad"),
      ],
      now,
    );
    assert.deepEqual(
      events.map((e) => e.id),
      ["multi", "ongoing", "point"],
      timezone,
    );
    assert.deepEqual(
      eventsForDay(
        [event("utc", "2026-11-12T17:00:00Z", "2026-11-12T18:00:00Z")],
        now,
      ).map((e) => e.id),
      ["utc"],
      timezone,
    );
  });
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
