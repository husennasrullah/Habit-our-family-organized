const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const filename = path.resolve(__dirname, "../lib/calendarUtils.ts");
const mod = new Module(filename, module);
mod.paths = Module._nodeModulePaths(path.dirname(filename));
mod._compile(
  ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText,
  filename,
);
const { layoutDayEvents } = mod.exports;
process.env.TZ = "Asia/Jakarta";
const day = new Date("2026-11-13T00:00:00+07:00");
const event = (id, start, end, allDay = false) => ({
  id,
  start_at: start,
  end_at: end,
  is_all_day: allDay,
});
test("time grid clips overnight events to each day and keeps all-day events outside time slots", () => {
  const rows = layoutDayEvents(
    [
      event(
        "overnight",
        "2026-11-12T23:00:00+07:00",
        "2026-11-13T01:30:00+07:00",
      ),
      event("late", "2026-11-13T23:00:00+07:00", "2026-11-14T02:00:00+07:00"),
      event(
        "all",
        "2026-11-13T00:00:00+07:00",
        "2026-11-13T23:59:59+07:00",
        true,
      ),
      event("ended", "2026-11-12T23:00:00+07:00", "2026-11-13T00:00:00+07:00"),
    ],
    day,
  );
  assert.equal(rows.length, 2);
  assert.deepEqual(
    rows.map((r) => [r.startMinute, r.endMinute]),
    [
      [0, 90],
      [1380, 1440],
    ],
  );
});
test("simultaneous events use separate lanes and adjacent events reuse a lane", () => {
  const rows = layoutDayEvents(
    [
      event("a", "2026-11-13T08:00:00+07:00", "2026-11-13T09:00:00+07:00"),
      event("b", "2026-11-13T08:30:00+07:00", "2026-11-13T10:00:00+07:00"),
      event("c", "2026-11-13T09:00:00+07:00", "2026-11-13T10:00:00+07:00"),
    ],
    day,
  );
  assert.notEqual(rows[0].lane, rows[1].lane);
  assert.equal(rows[0].lane, rows[2].lane);
  assert.equal(rows[0].lanes, 2);
});
