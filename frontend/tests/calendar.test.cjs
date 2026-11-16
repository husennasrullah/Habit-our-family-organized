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

test("calendar uses WIB for timed and all-day entries across device timezones", () => {
  const before = process.env.TZ;
  try {
    for (const zone of ["UTC", "America/Los_Angeles", "Asia/Tokyo"]) {
      process.env.TZ = zone;
      const visibleDay = new Date(2026, 10, 16, 0, 0, 0);
      const rows = mod.exports.layoutDayEvents(
        [event("a", "2026-11-16T09:00:00+07:00", "2026-11-16T10:00:00+07:00")],
        visibleDay,
      );
      assert.equal(rows[0].startMinute, 540, zone);
      assert.equal(
        mod.exports.getEventsForDay(
          [event("all", "2026-11-15T17:00:00Z", "2026-11-16T16:59:59Z", true)],
          visibleDay,
        ).length,
        1,
        zone,
      );
      assert.equal(
        mod.exports.getApiDateRange(visibleDay, "day").from,
        "2026-11-15T17:00:00.000Z",
        zone,
      );
    }
  } finally {
    process.env.TZ = before;
  }
});
const formFilename = path.resolve(__dirname, "../lib/calendarForm.ts");
const formMod = new Module(formFilename, module);
formMod.paths = Module._nodeModulePaths(path.dirname(formFilename));
formMod._compile(
  ts.transpileModule(fs.readFileSync(formFilename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText,
  formFilename,
);
const { eventSchema, eventDateToISO, eventLocalValue } = formMod.exports;
test("calendar form preserves all-day dates, validates real dates and rejects reversed times", () => {
  const value = {
    title: "  Piknik  ",
    description: "",
    start_at: "2026-11-16",
    end_at: "2026-11-16",
    is_all_day: true,
    type: "general",
    color: "sky",
    is_recurring: false,
    reminder_minutes: 0,
  };
  assert.equal(eventSchema.parse(value).title, "Piknik");
  assert.equal(
    eventDateToISO(value.start_at, true),
    "2026-11-15T17:00:00.000Z",
  );
  assert.equal(
    eventDateToISO(value.end_at, true, true),
    "2026-11-16T16:59:59.000Z",
  );
  assert.equal(eventLocalValue("2026-11-15T17:00:00Z", true), "2026-11-16");
  assert.equal(eventLocalValue("2026-11-16T02:00:00Z"), "2026-11-16T09:00");
  for (const patch of [
    { start_at: "2026-02-30" },
    { start_at: "0000-01-01" },
    { end_at: "2026-11-15" },
    { title: " " },
    {
      is_all_day: false,
      start_at: "2026-11-16T10:00",
      end_at: "2026-11-16T09:00",
    },
    {
      is_all_day: false,
      start_at: "2026-11-16T24:60",
      end_at: "2026-11-17T09:00",
    },
  ])
    assert.equal(
      eventSchema.safeParse({ ...value, ...patch }).success,
      false,
      JSON.stringify(patch),
    );
});
