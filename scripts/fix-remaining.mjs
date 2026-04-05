/**
 * Fix remaining issues:
 * 1. Delete leftover Friday 27 Mar 2026 classes (rest of 23-27 week)
 * 2. Delete duplicate disabled Friday 3 Apr 2026 classes (keep only the enabled ones)
 *
 * Usage:
 *   node scripts/fix-remaining.mjs           ← dry run
 *   node scripts/fix-remaining.mjs --apply   ← apply
 */

import pg from "pg";

const DATABASE_URL =
  "postgresql://neondb_owner:npg_78aJupBVeRSF@ep-calm-bread-a8a957k8-pooler.eastus2.azure.neon.tech/neondb?sslmode=require";

const APPLY = process.argv.includes("--apply");
const client = new pg.Client({ connectionString: DATABASE_URL });
await client.connect();
console.log("✅ Connected\n");

// 1. Find Friday 27 Mar classes to delete
const { rows: fri27 } = await client.query(`
  SELECT id, date, day, time, enabled,
    (SELECT COUNT(*) FROM "Booking" b WHERE b."classId" = c.id) AS bookings
  FROM "Class" c
  WHERE date >= '2026-03-27' AND date < '2026-03-28'
  ORDER BY time
`);

console.log(`🗑️  Friday 27 Mar classes to DELETE: ${fri27.length}`);
for (const c of fri27) {
  console.log(`   ${new Date(c.date).toISOString().split("T")[0]} ${c.day} ${c.time} enabled=${c.enabled} bookings=${c.bookings}`);
}

// 2. Find duplicate disabled Friday 3 Apr classes
const { rows: fri3apr } = await client.query(`
  SELECT id, date, day, time, enabled,
    (SELECT COUNT(*) FROM "Booking" b WHERE b."classId" = c.id) AS bookings
  FROM "Class" c
  WHERE date >= '2026-04-03' AND date < '2026-04-04' AND enabled = false
  ORDER BY time
`);

console.log(`\n🗑️  Duplicate disabled Fri 3 Apr classes to DELETE: ${fri3apr.length}`);
for (const c of fri3apr) {
  console.log(`   ${new Date(c.date).toISOString().split("T")[0]} ${c.day} ${c.time} enabled=${c.enabled} bookings=${c.bookings}`);
}

const allToDelete = [...fri27.map(c => c.id), ...fri3apr.map(c => c.id)];

console.log(`\n─────────────────────────────────────────`);
console.log(`Total to DELETE: ${allToDelete.length} classes`);
console.log(`Mode: ${APPLY ? "APPLY" : "DRY RUN"}`);
console.log(`─────────────────────────────────────────\n`);

if (!APPLY) {
  console.log("💡 Run with --apply to commit changes.");
  await client.end();
  process.exit(0);
}

if (allToDelete.length > 0) {
  const ph = allToDelete.map((_, i) => `$${i+1}`).join(",");
  const { rowCount: b } = await client.query(`DELETE FROM "Booking" WHERE "classId" IN (${ph})`, allToDelete);
  const { rowCount: w } = await client.query(`DELETE FROM "Waitlist" WHERE "classId" IN (${ph})`, allToDelete);
  const { rowCount: cl } = await client.query(`DELETE FROM "Class" WHERE id IN (${ph})`, allToDelete);
  console.log(`🗑️  Deleted ${cl} classes, ${b} bookings, ${w} waitlist entries`);
}

console.log("\n🎉 Done!");
await client.end();
