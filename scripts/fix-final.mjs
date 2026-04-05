/**
 * Final fix:
 * 1. Delete the 6 Friday classes stored at 2026-03-27T23:00:00Z (leftover from week 23-27)
 * 2. Delete the 6 duplicate disabled Friday classes at 2026-04-03T22:00:00Z
 *
 * Usage:
 *   node scripts/fix-final.mjs           ← dry run
 *   node scripts/fix-final.mjs --apply   ← apply
 */

import pg from "pg";

const DATABASE_URL =
  "postgresql://neondb_owner:npg_78aJupBVeRSF@ep-calm-bread-a8a957k8-pooler.eastus2.azure.neon.tech/neondb?sslmode=require";

const APPLY = process.argv.includes("--apply");
const client = new pg.Client({ connectionString: DATABASE_URL });
await client.connect();
console.log("✅ Connected\n");

// 1. Friday 27 Mar leftover (stored at 23:00 UTC on Mar 27)
const { rows: fri27 } = await client.query(`
  SELECT id, date, day, time, enabled,
    (SELECT COUNT(*) FROM "Booking" b WHERE b."classId" = c.id) AS bookings
  FROM "Class" c
  WHERE date = '2026-03-27 23:00:00+00'
  ORDER BY time
`);
console.log(`🗑️  Friday 27 Mar leftover classes: ${fri27.length}`);
fri27.forEach(c => console.log(`   ${c.date.toISOString()} ${c.day} ${c.time} en=${c.enabled} bk=${c.bookings}`));

// 2. Duplicate disabled Friday Apr 3 (stored at 22:00 UTC on Apr 3)
const { rows: fri3dup } = await client.query(`
  SELECT id, date, day, time, enabled,
    (SELECT COUNT(*) FROM "Booking" b WHERE b."classId" = c.id) AS bookings
  FROM "Class" c
  WHERE date = '2026-04-03 22:00:00+00'
  ORDER BY time
`);
console.log(`\n🗑️  Duplicate disabled Fri 3 Apr classes: ${fri3dup.length}`);
fri3dup.forEach(c => console.log(`   ${c.date.toISOString()} ${c.day} ${c.time} en=${c.enabled} bk=${c.bookings}`));

const allIds = [...fri27.map(c => c.id), ...fri3dup.map(c => c.id)];

console.log(`\n─────────────────────────────────────────`);
console.log(`Total to DELETE: ${allIds.length} classes`);
console.log(`Mode: ${APPLY ? "APPLY" : "DRY RUN"}`);
console.log(`─────────────────────────────────────────\n`);

if (!APPLY) {
  console.log("💡 Run with --apply to commit changes.");
  await client.end();
  process.exit(0);
}

if (allIds.length > 0) {
  const ph = allIds.map((_, i) => `$${i+1}`).join(",");
  await client.query(`DELETE FROM "Booking" WHERE "classId" IN (${ph})`, allIds);
  await client.query(`DELETE FROM "Waitlist" WHERE "classId" IN (${ph})`, allIds);
  const { rowCount } = await client.query(`DELETE FROM "Class" WHERE id IN (${ph})`, allIds);
  console.log(`🗑️  Deleted ${rowCount} classes`);
}

console.log("\n🎉 Done!");
await client.end();
