/**
 * Fix all future classes (date > 2026-04-10) with UTC timezone bug.
 *
 * Bug: Classes were stored at 22:00 UTC (or 23:00 UTC) instead of 00:00 UTC.
 * In CEST (UTC+2): 2026-04-12T22:00:00Z = 2026-04-13T00:00:00 CEST
 * But correct storage should be midnight UTC of the same UTC calendar date.
 *
 * Fix logic (same as fix-week-apr6.mjs):
 *   For any class NOT stored at hour 0 UTC:
 *   → truncate to midnight UTC of the same UTC calendar date
 *   e.g. 2026-04-12T22:00:00Z → 2026-04-12T00:00:00Z
 *        2026-04-19T22:00:00Z → 2026-04-19T00:00:00Z
 *
 * Does NOT change enabled status (keeps whatever is stored).
 * Does NOT change time slots or day names (only fixes the date column).
 *
 * Usage:
 *   node scripts/fix-all-future-weeks.mjs           ← dry run
 *   node scripts/fix-all-future-weeks.mjs --apply   ← apply changes
 */

import pg from "pg";

const DATABASE_URL =
  "postgresql://neondb_owner:npg_78aJupBVeRSF@ep-calm-bread-a8a957k8-pooler.eastus2.azure.neon.tech/neondb?sslmode=require";

const APPLY = process.argv.includes("--apply");
const client = new pg.Client({ connectionString: DATABASE_URL });
await client.connect();
console.log("Connected\n");

// ── 1. Fetch all classes after Apr 10, 2026 ───────────────────────────────────
const { rows } = await client.query(`
  SELECT id, date, day, time, enabled,
    (SELECT COUNT(*) FROM "Booking" b WHERE b."classId" = c.id) AS bookings
  FROM "Class" c
  WHERE date > '2026-04-10T23:59:59Z'
  ORDER BY date, time
`);

console.log(`Found ${rows.length} total classes after 2026-04-10.\n`);

// ── 2. Group by ISO week (Monday-based) ───────────────────────────────────────
function getISOWeekKey(date) {
  // Returns "YYYY-Www" e.g. "2026-W16"
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  // ISO week: Thursday of the week
  const dayOfWeek = d.getUTCDay() || 7; // Mon=1 .. Sun=7
  d.setUTCDate(d.getUTCDate() + 4 - dayOfWeek);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function getWeekMonday(date) {
  const d = new Date(date);
  const day = d.getUTCDay() || 7; // Mon=1 .. Sun=7
  d.setUTCDate(d.getUTCDate() - day + 1);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function formatDateShort(date) {
  return date.toISOString().split("T")[0];
}

// ── 3. Analyse each class ─────────────────────────────────────────────────────
const toUpdate = [];   // classes with wrong UTC hour
const alreadyOk = []; // classes already at midnight UTC

for (const r of rows) {
  const iso = r.date.toISOString();
  const utcHour = r.date.getUTCHours();
  const utcDateStr = iso.split("T")[0];

  if (utcHour !== 0) {
    // Fix: truncate to midnight UTC of same UTC calendar date
    const correctDate = new Date(utcDateStr + "T00:00:00.000Z");
    toUpdate.push({
      id: r.id,
      oldDate: r.date,
      oldIso: iso,
      newDate: correctDate,
      newIso: correctDate.toISOString(),
      utcHour,
      day: r.day,
      time: r.time,
      enabled: r.enabled,
      bookings: parseInt(r.bookings, 10),
    });
  } else {
    alreadyOk.push(r);
  }
}

// ── 4. Group affected classes by week ─────────────────────────────────────────
const weekMap = new Map(); // weekKey → { monday, classes[] }

for (const u of toUpdate) {
  const monday = getWeekMonday(u.oldDate);
  const weekKey = getISOWeekKey(u.oldDate);
  if (!weekMap.has(weekKey)) {
    weekMap.set(weekKey, { monday, classes: [] });
  }
  weekMap.get(weekKey).classes.push(u);
}

// Also note how many total classes per week (including already-ok)
const allWeekMap = new Map();
for (const r of rows) {
  const monday = getWeekMonday(r.date);
  const weekKey = getISOWeekKey(r.date);
  if (!allWeekMap.has(weekKey)) {
    allWeekMap.set(weekKey, { monday, total: 0, needsFix: 0 });
  }
  allWeekMap.get(weekKey).total++;
}
for (const u of toUpdate) {
  const weekKey = getISOWeekKey(u.oldDate);
  if (allWeekMap.has(weekKey)) {
    allWeekMap.get(weekKey).needsFix++;
  }
}

// ── 5. Print summary by week ──────────────────────────────────────────────────
console.log("=== WEEK SUMMARY ===");
console.log(
  `${"Week".padEnd(10)} ${"Mon (UTC)".padEnd(12)} ${"Total".padEnd(8)} ${"Needs Fix".padEnd(12)} ${"Already OK"}`
);
console.log("─".repeat(60));

const sortedWeeks = [...allWeekMap.entries()].sort((a, b) =>
  a[1].monday - b[1].monday
);

for (const [weekKey, info] of sortedWeeks) {
  const mondayStr = formatDateShort(info.monday);
  const ok = info.total - info.needsFix;
  console.log(
    `${weekKey.padEnd(10)} ${mondayStr.padEnd(12)} ${String(info.total).padEnd(8)} ${String(info.needsFix).padEnd(12)} ${ok}`
  );
}

console.log("─".repeat(60));
console.log(`Total classes after Apr 10: ${rows.length}`);
console.log(`  Need fix (UTC hour ≠ 0) : ${toUpdate.length}`);
console.log(`  Already at midnight UTC  : ${alreadyOk.length}`);
console.log(`  Weeks with broken classes: ${weekMap.size}`);

// ── 6. Print dry-run detail ───────────────────────────────────────────────────
if (toUpdate.length > 0) {
  console.log("\n=== DRY RUN — CHANGES TO BE MADE ===");
  let currentWeek = null;
  for (const u of toUpdate) {
    const weekKey = getISOWeekKey(u.oldDate);
    if (weekKey !== currentWeek) {
      currentWeek = weekKey;
      const info = allWeekMap.get(weekKey);
      console.log(`\n  Week ${weekKey} (Mon ${formatDateShort(info.monday)}):`);
    }
    const bookingNote = u.bookings > 0 ? ` [${u.bookings} booking(s)]` : "";
    const enabledNote = u.enabled ? " [enabled]" : " [disabled]";
    console.log(
      `    id=${u.id.substring(0, 12)}  ${u.oldIso.substring(0, 19)}Z → ${u.newIso.substring(0, 19)}Z` +
      `  day=${u.day.padEnd(10)}  time=${u.time}${enabledNote}${bookingNote}`
    );
  }
  console.log();
} else {
  console.log("\nNo classes need fixing.");
}

console.log(`─────────────────────────────────────────`);
console.log(`  To UPDATE : ${toUpdate.length}`);
console.log(`  Mode      : ${APPLY ? "APPLY" : "DRY RUN"}`);
console.log(`─────────────────────────────────────────\n`);

if (!APPLY) {
  console.log("Run with --apply to commit changes.");
  await client.end();
  process.exit(0);
}

// ── 7. APPLY ──────────────────────────────────────────────────────────────────
console.log("Applying fixes...\n");

let updatedCount = 0;
let errorCount = 0;

for (const u of toUpdate) {
  try {
    const { rowCount } = await client.query(
      `UPDATE "Class" SET date=$1, "updatedAt"=NOW() WHERE id=$2`,
      [u.newDate, u.id]
    );
    if (rowCount === 1) {
      updatedCount++;
    } else {
      console.warn(`  WARNING: UPDATE affected ${rowCount} rows for id=${u.id}`);
      errorCount++;
    }
  } catch (err) {
    console.error(`  ERROR updating id=${u.id}: ${err.message}`);
    errorCount++;
  }
}

console.log(`Updated ${updatedCount} classes (date shifted to midnight UTC).`);
if (errorCount > 0) {
  console.log(`Errors: ${errorCount}`);
}

// ── 8. Post-apply verification ────────────────────────────────────────────────
console.log("\n=== POST-APPLY VERIFICATION ===");
const { rows: verifyRows } = await client.query(`
  SELECT COUNT(*) AS cnt
  FROM "Class"
  WHERE date > '2026-04-10T23:59:59Z'
    AND date::time AT TIME ZONE 'Europe/Berlin' AT TIME ZONE 'UTC' != '00:00:00'
`);
const remaining = parseInt(verifyRows[0].cnt, 10);
console.log(`Classes after Apr 10 still NOT at midnight UTC: ${remaining}`);
if (remaining === 0) {
  console.log("All future classes are now correctly stored at midnight UTC.");
} else {
  console.log(`WARNING: ${remaining} classes still have wrong UTC hour — investigate manually.`);
}

console.log("\nDone!");
await client.end();
