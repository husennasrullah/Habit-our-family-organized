const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const Module = require("node:module");
const original = Module._extensions[".ts"];
Module._extensions[".ts"] = (mod, file) =>
  mod._compile(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText,
    file,
  );
const { filterTasks, taskOverview } = require("../lib/tasks.ts");
Module._extensions[".ts"] = original;
process.env.TZ = "Asia/Jakarta";
const now = new Date("2026-11-13T00:30:00+07:00");
const tasks = [
  {
    id: "a",
    title: "Cuci piring",
    description: "Setelah makan",
    status: "pending",
    assigned_to: "a",
    due_date: "2026-11-13T00:00:00Z",
  },
  {
    id: "b",
    title: "Belanja",
    status: "in_progress",
    assigned_to: "b",
    due_date: "2026-11-12",
  },
  {
    id: "c",
    title: "Merapikan mainan",
    status: "done",
    assigned_to: "a",
    due_date: "2026-11-12",
  },
  {
    id: "d",
    title: "Siram tanaman",
    status: "pending",
    assigned_to: null,
    due_date: null,
  },
  {
    id: "e",
    title: "Jalan pagi",
    status: "pending",
    assigned_to: "b",
    due_date: "2026-11-15",
  },
  {
    id: "f",
    title: "Baca buku",
    status: "pending",
    assigned_to: "b",
    due_date: "2026-11-16",
  },
];
test("overview counts active, due today and overdue without counting done as overdue", () => {
  assert.deepEqual(taskOverview(tasks, now), {
    active: 5,
    today: 1,
    overdue: 1,
    done: 1,
  });
});
test("search, member and due filters combine and handle database date strings", () => {
  const filter = (search = "", member = "", due = "all") =>
    filterTasks(tasks, { search, member, due }, now).map((t) => t.id);
  assert.deepEqual(filter(" MAKAN ", "a", "today"), ["a"]);
  assert.deepEqual(filter("", "", "overdue"), ["b"]);
  assert.deepEqual(filter("", "unassigned"), ["d"]);
  assert.deepEqual(filter("", "", "none"), ["d"]);
  assert.deepEqual(filter("", "", "week"), ["a", "e"]);
  assert.deepEqual(filter("", "b", "today"), []);
});
test("week filters use the Jakarta weekday across device timezones", () => {
  const before = process.env.TZ;
  const instant = new Date("2026-11-15T18:30:00Z");
  const entries = [
    {
      id: "sunday",
      title: "Minggu",
      status: "pending",
      due_date: "2026-11-22",
      assigned_to: null,
    },
    {
      id: "next",
      title: "Senin berikut",
      status: "pending",
      due_date: "2026-11-23",
      assigned_to: null,
    },
  ];
  try {
    for (const zone of ["UTC", "America/Los_Angeles", "Pacific/Pago_Pago"]) {
      process.env.TZ = zone;
      assert.deepEqual(
        filterTasks(
          entries,
          { search: "", member: "", due: "week" },
          instant,
        ).map((t) => t.id),
        ["sunday"],
        zone,
      );
    }
  } finally {
    process.env.TZ = before;
  }
});
