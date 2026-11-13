const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');
const path = require('node:path');
const filename = path.resolve(__dirname, '../lib/trips.ts');
const mod = new Module(filename, module);
mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, filename);
const { equalShares, itineraryOverlaps, tripOverview, dayDate, tripDuration, settlementRows } = mod.exports;
test('split rounding preserves total and uses stable participant order', () => {
  const rows = equalShares(100, ['c', 'a', 'b']);
  assert.deepEqual(rows, [{member_id:'a',amount:33.34},{member_id:'b',amount:33.33},{member_id:'c',amount:33.33}]);
  assert.equal(rows.reduce((n,r) => n + Math.round(r.amount*100), 0), 10000);
  assert.deepEqual(equalShares(100, []), []);
});
test('overlap warnings exclude touching times and activities on another day', () => {
  const activity = (id,day,start,end) => ({id,day_number:day,time_start:start,time_end:end});
  assert.deepEqual([...itineraryOverlaps([
    activity('a',1,'09:00','10:00'), activity('b',1,'09:30','10:00'),
    activity('c',1,'10:00','11:00'), activity('d',2,'09:00','10:00'),
  ])].sort(), ['a','b']);
});
test('trip dates cross month boundaries and unset budgets stay explicit', () => {
  assert.equal(dayDate('2026-12-31T00:00:00Z', 2), '2027-01-01');
  assert.equal(tripDuration('2026-12-31', '2027-01-02'), 3);
  assert.equal(tripOverview({budget_estimate:0}).remaining, null);
  assert.equal(tripOverview({budget_estimate:100,expenses:[{amount:120}]}).remaining, -20);
});
test('settlement excludes payer, zero amounts and already settled shares', () => {
  const rows = settlementRows([{paid_by:'a',splits:[
    {member_id:'a',amount:10,is_settled:false},
    {member_id:'b',amount:0,is_settled:false},
    {member_id:'c',amount:10,is_settled:true},
    {member_id:'d',amount:10,is_settled:false},
  ]}]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].split.member_id, 'd');
});
