const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs"),
  path = require("node:path"),
  Module = require("node:module"),
  ts = require("typescript");
const filename = path.resolve(__dirname, "../lib/kids.ts");
const mod = new Module(filename, module);
mod.paths = Module._nodeModulePaths(path.dirname(filename));
mod._compile(
  ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText,
  filename,
);
const {
  profileSchema,
  resourcePayload,
  growthSeries,
  validKidDate,
  kidsDate,
  canManageKids,
  kidsToday,
  kidAge,
} = mod.exports;
process.env.TZ = "Asia/Jakarta";
test("kids reject invalid chronology, enums and measurements; allow future vaccine plans", () => {
  assert.ok(validKidDate("2028-02-29"));
  for (const value of ["2026-02-30", "0000-01-01", "2026-1-01", ""])
    assert.equal(validKidDate(value), false);
  const profile = {
    name: " Ani ",
    gender: "female",
    birth_date: "2020-01-01",
    notes: " Note ",
  };
  assert.equal(profileSchema.parse(profile).name, "Ani");
  for (const patch of [
    { name: " " },
    { birth_date: "2999-01-01" },
    { gender: "unknown" },
  ])
    assert.equal(
      profileSchema.safeParse({ ...profile, ...patch }).success,
      false,
    );
  const growth = {
    date: "2026-01-01",
    height_cm: "",
    weight_kg: "12.35",
    head_circumference_cm: "",
    notes: "",
  };
  assert.equal(resourcePayload("growth", growth, "2020-01-01").height_cm, null);
  for (const patch of [
    { weight_kg: "" },
    { weight_kg: "-1" },
    { weight_kg: "0" },
    { weight_kg: "NaN" },
    { weight_kg: "1000" },
    { weight_kg: "12.345" },
    { date: "2019-01-01" },
    { date: "2999-01-01" },
  ])
    assert.throws(() =>
      resourcePayload("growth", { ...growth, ...patch }, "2020-01-01"),
    );
  const vaccine = {
    vaccine_name: " Vaksin ",
    scheduled_date: "2999-01-01",
    given_date: "",
    given_by: " Klinik ",
    notes: "Note",
  };
  assert.deepEqual(resourcePayload("vaccines", vaccine, "2020-01-01"), {
    vaccine_name: "Vaksin",
    scheduled_date: "2999-01-01",
    given_date: null,
    given_by: "Klinik",
    notes: "Note",
  });
  assert.throws(() =>
    resourcePayload(
      "vaccines",
      { ...vaccine, given_date: "2999-01-01" },
      "2020-01-01",
    ),
  );
  const milestone = {
    title: "Bersepeda",
    category: "motorik",
    achieved_at: "",
    notes: "",
  };
  assert.equal(
    resourcePayload("milestones", milestone, "2020-01-01").achieved_at,
    null,
  );
  assert.throws(() =>
    resourcePayload(
      "milestones",
      { ...milestone, achieved_at: "2019-01-01" },
      "2020-01-01",
    ),
  );
  assert.throws(() =>
    resourcePayload(
      "health",
      {
        type: "invalid",
        date: "2026-01-01",
        description: "Kontrol",
        doctor: "",
        medication: "",
        notes: "",
      },
      "2020-01-01",
    ),
  );
});
test("growth retains null gaps and dates, with localized labels and adult-only access", () => {
  const rows = [
    { id: "a", date: "2026-03-01T00:00:00Z", height_cm: 91, weight_kg: null },
    { id: "b", date: "2026-01-01", height_cm: null, weight_kg: 12 },
    { id: "c", date: "2026-01-10", height_cm: 90, weight_kg: 12.2 },
  ];
  assert.deepEqual(
    growthSeries(rows, "height_cm").map((r) => [r.date, r.value]),
    [
      ["2026-01-01", null],
      ["2026-01-10", 90],
      ["2026-03-01", 91],
    ],
  );
  assert.equal(kidsDate("2026-11-13T00:00:00Z"), "13 Nov 2026");
  assert.equal(kidAge("2999-01-01"), "Usia belum tersedia");
  for (const role of ["admin", "member"])
    assert.equal(canManageKids(role), true);
  for (const role of ["child", "view_only", "", undefined])
    assert.equal(canManageKids(role), false);
  assert.match(kidsToday(), /^\d{4}-\d{2}-\d{2}$/);
});
test("WHO verified table values, month coverage, and distinct length/height at 24 months", () => {
  const data = require("../lib/data/who-growth.json");
  assert.deepEqual(data["boys_wfa_0-to-5-years"][0], [0, 2.5, 3.3, 4.4]);
  for (const sex of ["boys", "girls"]) {
    assert.equal(data[`${sex}_wfa_0-to-5-years`].length, 61);
    assert.equal(data[`${sex}_lhfa_0-to-2-years`].length, 25);
    assert.equal(data[`${sex}_lhfa_2-to-5-years`].length, 37);
    const length = data[`${sex}_lhfa_0-to-2-years`].at(-1),
      height = data[`${sex}_lhfa_2-to-5-years`][0];
    assert.equal(length[0], 24);
    assert.equal(height[0], 24);
    assert.ok(Math.abs(length[2] - height[2] - 0.7) < 0.11);
  }
});
