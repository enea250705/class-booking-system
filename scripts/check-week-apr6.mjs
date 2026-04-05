/**
 * Diagnostic script: check classes around April 6-10, 2026
 * Wide date range (Apr 4 – Apr 13) to catch any UTC-shifted dates
 *
 * Usage: node scripts/check-week-apr6.mjs
 */

import pg from "pg";

const DATABASE_URL =
  "postgresql://neondb_owner:npg_78aJupBVeRSF@ep-calm-bread-a8a957k8-pooler.eastus2.azure.neon.tech/neondb?sslmode=require";

const client = new pg.Client({ connectionString: DATABASE_URL });
await client.connect();
console.log("Connected\n");

const { rows } = await client.query(`
  SELECT id, date, day, time, enabled,
    (SELECT COUNT(*) FROM "Booking" b WHERE b."classId" = c.id) AS bookings
  FROM "Class" c
  WHERE date >= '2026-04-04' AND date < '2026-04-14'
  ORDER BY date, time
`);

console.log(`Total classes found in range Apr 4 – Apr 13: ${rows.length}\n`);

// ── Per-row detail ──────────────────────────────────────────────────────────
console.log("All classes (raw ISO date | day stored | time | enabled | bookings | UTC hour):");
console.log("─".repeat(90));

const utcHourCounts = {};
const calendarDateCounts = {};

for (const r of rows) {
  const iso = r.date.toISOString();          // e.g. 2026-04-05T22:00:00.000Z
  const utcHour = r.date.getUTCHours();
  const calDate = iso.split("T")[0];          // UTC calendar date

  utcHourCounts[utcHour] = (utcHourCounts[utcHour] || 0) + 1;
  calendarDateCounts[calDate] = (calendarDateCounts[calDate] || 0) + 1;

  console.log(
    `  ${iso.substring(0, 19)}Z  day=${r.day.padEnd(10)}  time=${r.time.padEnd(7)}  ` +
    `enabled=${String(r.enabled).padEnd(5)}  bk=${r.bookings}  utcHour=${utcHour}  id=${r.id.substring(0, 12)}`
  );
}

// ── UTC hour distribution ────────────────────────────────────────────────────
console.log("\n\nUTC hour distribution (how many classes start at each UTC hour):");
console.log("─".repeat(50));
for (const [hour, count] of Object.entries(utcHourCounts).sort((a, b) => Number(a[0]) - Number(b[0]))) {
  const flag = Number(hour) !== 0 ? "  ← SHIFTED (not midnight UTC)" : "";
  console.log(`  UTC hour ${String(hour).padStart(2)}: ${count} classes${flag}`);
}

// ── Count per UTC calendar date ───────────────────────────────────────────────
console.log("\n\nClass count per UTC calendar date:");
console.log("─".repeat(50));
for (const [date, count] of Object.entries(calendarDateCounts).sort()) {
  const d = new Date(date + "T00:00:00Z");
  const dayName = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getUTCDay()];
  console.log(`  ${date} (${dayName}): ${count} classes`);
}

// ── Expected vs actual per target day ─────────────────────────────────────────
console.log("\n\nExpected schedule for week Apr 6–10:");
console.log("─".repeat(50));
const expected = {
  "Monday   Apr 6":  ["08:00","09:00","10:00","17:00","18:00","19:00","20:00"],
  "Tuesday  Apr 7":  ["08:00","09:00","17:00","18:00","19:00","20:00"],
  "Wednesday Apr 8": ["08:00","09:00","10:00","17:00","18:00","19:00","20:00"],
  "Thursday Apr 9":  ["08:00","09:00","17:00","18:00","19:00","20:00"],
  "Friday   Apr 10": ["08:00","09:00","10:00","16:00","17:00","18:00"],
};
for (const [label, slots] of Object.entries(expected)) {
  console.log(`  ${label}: ${slots.length} slots expected`);
}

// ── Check which target dates actually have classes (using CEST-aware lookup) ──
// CEST = UTC+2: Apr 6 00:00 CEST = Apr 5 22:00 UTC
// So a class "on Apr 6" could be stored at Apr 5 22:00 UTC OR Apr 6 00:00 UTC
console.log("\n\nLooking up classes per target CEST date:");
console.log("─".repeat(60));

const targetDates = [
  { label: "Monday    Apr 6",  utcDates: ["2026-04-05", "2026-04-06"] },
  { label: "Tuesday   Apr 7",  utcDates: ["2026-04-06", "2026-04-07"] },
  { label: "Wednesday Apr 8",  utcDates: ["2026-04-07", "2026-04-08"] },
  { label: "Thursday  Apr 9",  utcDates: ["2026-04-08", "2026-04-09"] },
  { label: "Friday    Apr 10", utcDates: ["2026-04-09", "2026-04-10"] },
];

for (const { label, utcDates } of targetDates) {
  const matching = rows.filter(r => utcDates.includes(r.date.toISOString().split("T")[0]));
  console.log(`  ${label}: ${matching.length} classes found`);
  for (const r of matching) {
    console.log(`    → ${r.date.toISOString().substring(0, 19)}Z  day=${r.day}  time=${r.time}  enabled=${r.enabled}  bk=${r.bookings}`);
  }
}

await client.end();
console.log("\nDone.");
