process.env.TZ = "Europe/Berlin";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

const app = vm.createContext({ console });
vm.runInContext(fs.readFileSync(path.join(__dirname, "../app/app.js"), "utf8"), app);

for (const [input, iso] of [
  ["01.02.2026 10:00", "2026-02-01T09:00:00.000Z"],
  ["20.01.2026, 10:00", "2026-01-20T09:00:00.000Z"],
  ["1. Februar 2026 10:00", "2026-02-01T09:00:00.000Z"],
  ["So., 1. Februar 2026 10:00", "2026-02-01T09:00:00.000Z"],
  ["29.02.2024 10:00:30", "2024-02-29T09:00:30.000Z"],
  ["2026-02-01T10:00:00Z", "2026-02-01T10:00:00.000Z"],
  ["2026-02-01T10:00:00+02:00", "2026-02-01T08:00:00.000Z"],
]) {
  test("F-148 Zeitstempel " + input, () => {
    assert.equal(new Date(app.parsePegelTimestamp(input)).toISOString(), iso);
  });
}
for (const invalid of [
  "31.02.2026 10:00", "29.02.2025 10:00", "01.13.2026 10:00",
  "01.02.2026 25:00", "01.02.2026 10:99", "x 01.02.2026 10:00",
  "01/02/2026 10:00", "not-a-date", "",
]) {
  test("F-148 ungültiges/mehrdeutiges Datum nicht erraten: " + invalid, () => {
    assert.equal(app.parsePegelTimestamp(invalid), null);
  });
}
test("F-148 Februarwert bleibt aktuellster Messwert und Trend steigt", () => {
  const [station] = app.mergeStationsWithMeasurements(
    [{ pegel_id: "1", name: "Alpha", pegelonline_unit: "m" }],
    [
      { messstelle_id: "1", zeitstempel: "01.02.2026 10:00", pegelstand_in_m: 2 },
      { messstelle_id: "1", zeitstempel: "20.01.2026 10:00", pegelstand_in_m: 1 },
    ],
  );
  assert.equal(station.currentValue, 2);
  assert.equal(station.trend, "up");
  assert.equal(station.currentTimestamp, "01.02.2026 10:00");
});
for (const [input, iso] of [
  // RFC 5545 3.3.5: Ortszeit in der Umstellungslücke gilt mit dem Offset vor der Lücke.
  ["29.03.2026 02:30", "2026-03-29T01:30:00.000Z"],
  ["2026-06-12 13:45:00", "2026-06-12T11:45:00.000Z"],
  ["01.02.2026 10:00 Uhr", "2026-02-01T09:00:00.000Z"],
]) {
  test("Review-Nachtrag Zeitstempel " + input, () => {
    assert.equal(new Date(app.parsePegelTimestamp(input)).toISOString(), iso);
  });
}
