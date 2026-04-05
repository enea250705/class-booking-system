/**
 * Fix script for week April 6–10, 2026.
 *
 * Problems detected by check-week-apr6.mjs:
 *  1. All 33 classes stored at 22:00 UTC (DST/CEST timezone bug).
 *     e.g. Monday Apr 6 is stored as 2026-04-06T22:00:00Z (which is actually
 *     CEST Apr 7 00:00) — they need to shift +2 hours to 00:00 UTC of the
 *     CORRECT date: 2026-04-07T00:00:00Z for Tuesday, etc.
 *
 *     Correct target dates (midnight UTC = 00:00 CEST of the day after):
 *       Monday    Apr 6  → stored at 2026-04-06T00:00:00Z  (was 2026-04-05T22:00 but DB shows 2026-04-06T22:00)
 *       Tuesday   Apr 7  → stored at 2026-04-07T00:00:00Z  (was 2026-04-07T22:00 — one day ahead of the pattern)
 *
 *     Wait — from the diagnostic:
 *       "Monday" classes  → 2026-04-06T22:00:00Z  (UTC calendar date Apr 6)
 *       "Tuesday" classes → 2026-04-07T22:00:00Z  (UTC calendar date Apr 7)
 *       ...
 *     In CEST (UTC+2), 2026-04-06T22:00:00Z = 2026-04-07T00:00:00 CEST = Tuesday midnight.
 *     So Monday classes are stored ONE DAY EARLY in UTC date AND at 22:00 UTC.
 *
 *     The fix for CEST (UTC+2): a class "on Monday Apr 6 CEST" should be stored
 *     as 2026-04-06T00:00:00Z (midnight UTC on Apr 6), NOT 2026-04-06T22:00:00Z.
 *     The previous week's working classes (Mar 30 – Apr 3) confirm they were
 *     stored at 2026-03-30T00:00:00Z etc. after fixing.
 *
 *     So the shift needed: subtract 22 hours (or equivalently: truncate to
 *     UTC midnight of the same UTC calendar date).
 *     2026-04-06T22:00:00Z → 2026-04-06T00:00:00Z  (Monday stays Apr 6)
 *     2026-04-07T22:00:00Z → 2026-04-07T00:00:00Z  (Tuesday stays Apr 7)
 *     etc.
 *
 *  2. All classes are enabled=false → set enabled=true.
 *
 *  3. One class with day="Tuesday" stored at 2026-04-06T22:00:00Z alongside Monday
 *     classes. After the date fix it will land on 2026-04-06T00:00:00Z with
 *     day="Tuesday" — wrong day name. We fix its day to "Monday" if the time
 *     slot exists in Monday's schedule, otherwise delete it.
 *     The rogue entry has time="10:00 AM" which IS in Monday's schedule.
 *
 * Usage:
 *   node scripts/fix-week-apr6.mjs           ← dry run (no DB changes)
 *   node scripts/fix-week-apr6.mjs --apply   ← apply changes
 */

import pg from "pg";

const DATABASE_URL =
  "postgresql://neondb_owner:npg_78aJupBVeRSF@ep-calm-bread-a8a957k8-pooler.eastus2.azure.neon.tech/neondb?sslmode=require";

const APPLY = process.argv.includes("--apply");
const client = new pg.Client({ connectionString: DATABASE_URL });
await client.connect();
console.log("Connected\n");

// ── 1. Fetch all classes in the affected UTC range ────────────────────────────
const { rows } = await client.query(`
  SELECT id, date, day, time, enabled,
    (SELECT COUNT(*) FROM "Booking" b WHERE b."classId" = c.id) AS bookings
  FROM "Class" c
  WHERE date >= '2026-04-06T00:00:00Z' AND date < '2026-04-11T23:00:00Z'
  ORDER BY date, time
`);

console.log(`Found ${rows.length} classes to process in the week Apr 6–10.\n`);

// ── 2. Analyse each class and build the fix plan ──────────────────────────────
const toUpdate = [];   // { id, newDate, newDay, newTime, oldIso }
const toDelete = [];   // { id, reason }

// Expected time slots per day (using the exact strings already in the DB)
function formatTime(slot) {
  const [h, m] = slot.split(":");
  const hour = parseInt(h, 10);
  return `${hour}:${m} ${hour >= 12 ? "PM" : "AM"}`;
}

const TIME_SLOTS_24H = {
  Monday:    ["08:00","09:00","10:00","17:00","18:00","19:00","20:00"],
  Tuesday:   ["08:00","09:00","17:00","18:00","19:00","20:00"],
  Wednesday: ["08:00","09:00","10:00","17:00","18:00","19:00","20:00"],
  Thursday:  ["08:00","09:00","17:00","18:00","19:00","20:00"],
  Friday:    ["08:00","09:00","10:00","16:00","17:00","18:00"],
};

// Build set of expected time strings per day (formatted as DB stores them)
const TIME_SLOTS = {};
for (const [day, slots] of Object.entries(TIME_SLOTS_24H)) {
  TIME_SLOTS[day] = slots.map(formatTime);
}

for (const r of rows) {
  const iso = r.date.toISOString(); // e.g. 2026-04-06T22:00:00.000Z
  const utcHour = r.date.getUTCHours();
  const utcDateStr = iso.split("T")[0]; // e.g. "2026-04-06"

  // The correct stored date is midnight UTC of the same UTC calendar date
  const correctDate = new Date(utcDateStr + "T00:00:00.000Z");

  // Determine correct day name from the UTC calendar date
  const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const correctDay = DAYS[correctDate.getUTCDay()];

  const storedDay = r.day;
  const storedTime = r.time;

  // Check if the stored day name matches what we expect for the UTC calendar date
  const dayMismatch = storedDay !== correctDay;

  if (dayMismatch) {
    // Check if the time slot belongs to the correct day
    const slotsForCorrectDay = TIME_SLOTS[correctDay] || [];
    if (slotsForCorrectDay.includes(storedTime)) {
      // Fix day name and date
      toUpdate.push({
        id: r.id,
        newDate: correctDate,
        newDay: correctDay,
        newTime: storedTime,
        oldIso: iso,
        reason: `day mismatch (stored=${storedDay}, correct=${correctDay}), utcHour=${utcHour}`,
      });
    } else {
      // Time slot doesn't belong to the correct day — delete
      toDelete.push({
        id: r.id,
        reason: `day mismatch (stored=${storedDay}, correct=${correctDay}) and time ${storedTime} not in ${correctDay}'s slots`,
        oldIso: iso,
      });
    }
  } else if (utcHour !== 0) {
    // Same day name but wrong UTC hour — just fix the date/time to midnight
    toUpdate.push({
      id: r.id,
      newDate: correctDate,
      newDay: correctDay,
      newTime: storedTime,
      oldIso: iso,
      reason: `UTC hour=${utcHour} (needs to be 0)`,
    });
  }
  // If utcHour===0 and day is correct, still need to enable — handled separately below
}

// ── 3. Print the plan ─────────────────────────────────────────────────────────
console.log("=== DATE/DAY FIX PLAN ===");
if (toUpdate.length === 0 && toDelete.length === 0) {
  console.log("  No date/day fixes needed.");
} else {
  for (const u of toUpdate) {
    console.log(`  UPDATE id=${u.id.substring(0,12)}  ${u.oldIso.substring(0,19)}Z → ${u.newDate.toISOString().substring(0,19)}Z  day=${u.newDay}  [${u.reason}]`);
  }
  for (const d of toDelete) {
    console.log(`  DELETE id=${d.id.substring(0,12)}  ${d.oldIso.substring(0,19)}Z  [${d.reason}]`);
  }
}

// All classes need enabled=true
console.log(`\n=== ENABLE PLAN ===`);
const disabledCount = rows.filter(r => !r.enabled).length;
console.log(`  ${disabledCount} classes currently disabled → will set enabled=true`);

console.log(`\n─────────────────────────────────────────`);
console.log(`  To UPDATE (date fix)   : ${toUpdate.length}`);
console.log(`  To DELETE (bad entries): ${toDelete.length}`);
console.log(`  To ENABLE              : ${disabledCount}`);
console.log(`  Mode                   : ${APPLY ? "APPLY" : "DRY RUN"}`);
console.log(`─────────────────────────────────────────\n`);

if (!APPLY) {
  console.log("Run with --apply to commit changes.");
  await client.end();
  process.exit(0);
}

// ── 4. APPLY ──────────────────────────────────────────────────────────────────

// Delete bad entries first
if (toDelete.length > 0) {
  const ids = toDelete.map(d => d.id);
  const ph = ids.map((_, i) => `$${i+1}`).join(",");
  await client.query(`DELETE FROM "Booking" WHERE "classId" IN (${ph})`, ids);
  await client.query(`DELETE FROM "Waitlist" WHERE "classId" IN (${ph})`, ids);
  const { rowCount } = await client.query(`DELETE FROM "Class" WHERE id IN (${ph})`, ids);
  console.log(`Deleted ${rowCount} bad classes.`);
}

// Update date (shift to midnight UTC) + fix day name for shifted classes
for (const u of toUpdate) {
  await client.query(
    `UPDATE "Class" SET date=$1, day=$2, enabled=true, "updatedAt"=NOW() WHERE id=$3`,
    [u.newDate, u.newDay, u.id]
  );
}
console.log(`Updated ${toUpdate.length} classes (date shifted to midnight UTC, enabled=true).`);

// Enable all remaining classes that weren't in toUpdate (already at correct date)
const updatedIds = toUpdate.map(u => u.id);
const remainingToEnable = rows.filter(r =>
  !r.enabled && !updatedIds.includes(r.id) && !toDelete.find(d => d.id === r.id)
);
if (remainingToEnable.length > 0) {
  const ids = remainingToEnable.map(r => r.id);
  const ph = ids.map((_, i) => `$${i+1}`).join(",");
  const { rowCount } = await client.query(
    `UPDATE "Class" SET enabled=true, "updatedAt"=NOW() WHERE id IN (${ph})`, ids
  );
  console.log(`Enabled ${rowCount} additional classes.`);
}

console.log("\nDone!");
await client.end();
