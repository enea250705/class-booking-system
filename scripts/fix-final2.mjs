import pg from "pg";

const DATABASE_URL =
  "postgresql://neondb_owner:npg_78aJupBVeRSF@ep-calm-bread-a8a957k8-pooler.eastus2.azure.neon.tech/neondb?sslmode=require";

const APPLY = process.argv.includes("--apply");
const client = new pg.Client({ connectionString: DATABASE_URL });
await client.connect();
console.log("✅ Connected\n");

// Find ALL classes where the day column says 'Friday' and the date is
// around 27 Mar or where there are disabled duplicates on 3 Apr

// Get IDs for Friday classes with old timestamp format (23:00 or 22:00 UTC hours)
const { rows: oldFridayClasses } = await client.query(`
  SELECT id, date, day, time, enabled,
    EXTRACT(HOUR FROM date AT TIME ZONE 'UTC') as utc_hour,
    (SELECT COUNT(*) FROM "Booking" b WHERE b."classId" = c.id) AS bookings
  FROM "Class" c
  WHERE EXTRACT(HOUR FROM date AT TIME ZONE 'UTC') != 0
  ORDER BY date, time
`);

console.log(`Found ${oldFridayClasses.length} classes with non-midnight UTC timestamps (old format):`);
for (const c of oldFridayClasses) {
  console.log(`  ${c.date.toISOString()} ${c.day.padEnd(10)} ${c.time.padEnd(10)} en=${c.enabled} bk=${c.bookings} utc_hour=${c.utc_hour}`);
}

const idsToDelete = oldFridayClasses.map(c => c.id);

console.log(`\n─────────────────────────────────────────`);
console.log(`Total to DELETE: ${idsToDelete.length} old-format classes`);
console.log(`Mode: ${APPLY ? "APPLY" : "DRY RUN"}`);
console.log(`─────────────────────────────────────────\n`);

if (!APPLY) {
  console.log("💡 Run with --apply to commit changes.");
  await client.end();
  process.exit(0);
}

if (idsToDelete.length > 0) {
  const ph = idsToDelete.map((_, i) => `$${i+1}`).join(",");
  const { rowCount: b } = await client.query(`DELETE FROM "Booking" WHERE "classId" IN (${ph})`, idsToDelete);
  const { rowCount: w } = await client.query(`DELETE FROM "Waitlist" WHERE "classId" IN (${ph})`, idsToDelete);
  const { rowCount: cl } = await client.query(`DELETE FROM "Class" WHERE id IN (${ph})`, idsToDelete);
  console.log(`🗑️  Deleted ${cl} old-format classes, ${b} bookings, ${w} waitlist`);
}

// Verify what's left
const { rows: remaining } = await client.query(`
  SELECT date, day, time, enabled,
    EXTRACT(HOUR FROM date AT TIME ZONE 'UTC') as utc_hour
  FROM "Class" c
  WHERE date >= '2026-03-20' AND date < '2026-04-10'
  ORDER BY date, time
`);
console.log(`\nRemaining classes in range: ${remaining.length}`);
let lastD = "";
for (const r of remaining) {
  const d = r.date.toISOString().split("T")[0];
  if (d !== lastD) { lastD = d; console.log(`\n--- ${d} (${r.day}) ---`); }
  console.log(`  ${r.time.padEnd(10)} en=${r.enabled}`);
}

console.log("\n🎉 Done!");
await client.end();
