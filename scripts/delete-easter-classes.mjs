/**
 * Delete all classes for Easter holidays: Thursday Apr 9 and Friday Apr 10, 2026.
 *
 * The fix-week-apr6.mjs script stores classes at midnight UTC (00:00:00Z), so:
 *   Thursday Apr 9  → 2026-04-09T00:00:00Z
 *   Friday   Apr 10 → 2026-04-10T00:00:00Z
 *
 * Also covers any residual 22:00 UTC variants from the previous timezone bug:
 *   Thu: 2026-04-08T22:00:00Z  (CEST midnight Apr 9)
 *   Fri: 2026-04-09T22:00:00Z  (CEST midnight Apr 10)
 *
 * Usage:
 *   node scripts/delete-easter-classes.mjs           ← dry run (no DB changes)
 *   node scripts/delete-easter-classes.mjs --apply   ← apply deletions
 */

import pg from "pg";

const DATABASE_URL =
  "postgresql://neondb_owner:npg_78aJupBVeRSF@ep-calm-bread-a8a957k8-pooler.eastus2.azure.neon.tech/neondb?sslmode=require";

const APPLY = process.argv.includes("--apply");
const client = new pg.Client({ connectionString: DATABASE_URL });
await client.connect();
console.log("Connected\n");

// ── 1. Find all classes for Apr 9 and Apr 10 ─────────────────────────────────
// Wide range: from start of Apr 8 22:00 UTC (CEST midnight Apr 9) through end
// of Apr 10 23:59:59 UTC to catch both correctly-stored (00:00Z) and
// timezone-bugged (22:00Z) variants.
const { rows } = await client.query(`
  SELECT c.id, c.date, c.day, c.time, c.enabled,
    (SELECT COUNT(*) FROM "Booking" b WHERE b."classId" = c.id)   AS bookings,
    (SELECT COUNT(*) FROM "Waitlist" w WHERE w."classId" = c.id)  AS waitlist
  FROM "Class" c
  WHERE c.date >= '2026-04-08T22:00:00Z'
    AND c.date <  '2026-04-11T00:00:00Z'
  ORDER BY c.date, c.time
`);

console.log(`Found ${rows.length} classes in the Apr 9–10 Easter window.\n`);

if (rows.length === 0) {
  console.log("Nothing to delete. Exiting.");
  await client.end();
  process.exit(0);
}

// ── 2. Print what will be deleted ────────────────────────────────────────────
console.log("Classes that will be deleted:");
console.log("─".repeat(90));

let totalBookings  = 0;
let totalWaitlist  = 0;
const thu = [];
const fri = [];

for (const r of rows) {
  const iso      = r.date.toISOString();
  const calDate  = iso.split("T")[0];
  const bk       = Number(r.bookings);
  const wl       = Number(r.waitlist);
  totalBookings += bk;
  totalWaitlist += wl;

  const line = `  ${iso.substring(0, 19)}Z  day=${r.day.padEnd(10)}  time=${r.time.padEnd(7)}  enabled=${String(r.enabled).padEnd(5)}  bookings=${bk}  waitlist=${wl}  id=${r.id.substring(0, 12)}`;
  console.log(line);

  if (calDate === "2026-04-09" || calDate === "2026-04-08") thu.push(r);
  else fri.push(r);
}

console.log("─".repeat(90));
console.log(`  Thursday Apr 9  classes : ${thu.length}`);
console.log(`  Friday   Apr 10 classes : ${fri.length}`);
console.log(`  Total classes           : ${rows.length}`);
console.log(`  Total bookings affected : ${totalBookings}`);
console.log(`  Total waitlist affected : ${totalWaitlist}`);
console.log(`  Mode                    : ${APPLY ? "APPLY — WILL DELETE" : "DRY RUN — no changes"}`);
console.log("─".repeat(90));

if (!APPLY) {
  console.log("\nDry run complete. Run with --apply to execute deletions.");
  await client.end();
  process.exit(0);
}

// ── 3. APPLY: delete cascade then classes ────────────────────────────────────
console.log("\nApplying deletions...\n");

const ids = rows.map(r => r.id);
const ph  = ids.map((_, i) => `$${i + 1}`).join(", ");

// Delete bookings first
const { rowCount: bkDeleted } = await client.query(
  `DELETE FROM "Booking" WHERE "classId" IN (${ph})`, ids
);
console.log(`  Deleted ${bkDeleted} booking(s).`);

// Delete waitlist entries
const { rowCount: wlDeleted } = await client.query(
  `DELETE FROM "Waitlist" WHERE "classId" IN (${ph})`, ids
);
console.log(`  Deleted ${wlDeleted} waitlist entry/entries.`);

// Delete the classes themselves
const { rowCount: clDeleted } = await client.query(
  `DELETE FROM "Class" WHERE id IN (${ph})`, ids
);
console.log(`  Deleted ${clDeleted} class(es).`);

// ── 4. Verify: confirm Apr 9 & 10 are empty ──────────────────────────────────
const { rows: remaining } = await client.query(`
  SELECT id, date, day, time, enabled
  FROM "Class"
  WHERE date >= '2026-04-08T22:00:00Z'
    AND date <  '2026-04-11T00:00:00Z'
  ORDER BY date, time
`);
console.log(`\nVerification — classes remaining for Apr 9–10: ${remaining.length}`);
if (remaining.length > 0) {
  for (const r of remaining) {
    console.log(`  STILL EXISTS: ${r.date.toISOString()}  day=${r.day}  time=${r.time}`);
  }
} else {
  console.log("  Confirmed: no classes remain for Apr 9 (Thursday) or Apr 10 (Friday).");
}

// ── 5. Show what remains for the full week Mon–Wed ───────────────────────────
const { rows: weekRows } = await client.query(`
  SELECT date, day, time, enabled,
    (SELECT COUNT(*) FROM "Booking" b WHERE b."classId" = c.id) AS bookings
  FROM "Class" c
  WHERE date >= '2026-04-05T22:00:00Z'
    AND date <  '2026-04-09T00:00:00Z'
  ORDER BY date, time
`);

console.log(`\nRemaining classes for the week (Mon Apr 6 – Wed Apr 8): ${weekRows.length}`);
console.log("─".repeat(80));
for (const r of weekRows) {
  const iso = r.date.toISOString();
  console.log(
    `  ${iso.substring(0, 19)}Z  day=${r.day.padEnd(10)}  time=${r.time.padEnd(7)}  enabled=${String(r.enabled).padEnd(5)}  bookings=${Number(r.bookings)}`
  );
}
console.log("─".repeat(80));

console.log("\nDone! Easter holiday deletion complete.");
await client.end();
