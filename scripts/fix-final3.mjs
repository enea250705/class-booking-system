import pg from "pg";

const DATABASE_URL =
  "postgresql://neondb_owner:npg_78aJupBVeRSF@ep-calm-bread-a8a957k8-pooler.eastus2.azure.neon.tech/neondb?sslmode=require";

const APPLY = process.argv.includes("--apply");
const client = new pg.Client({ connectionString: DATABASE_URL });
await client.connect();
console.log("✅ Connected\n");

// The old classes have IDs starting with "cmbs" (Prisma cuid format from the batch generation)
// The new classes have shorter UUIDs (from gen_random_uuid())
// Let me verify this theory:

const { rows: all } = await client.query(`
  SELECT id, date, day, time, enabled,
    (SELECT COUNT(*) FROM "Booking" b WHERE b."classId" = c.id) AS bookings
  FROM "Class" c
  WHERE date >= '2026-03-20' AND date < '2026-04-10'
  ORDER BY date, time
`);

console.log("Analyzing class IDs in the range:\n");
let oldCount = 0, newCount = 0;
for (const c of all) {
  const isOld = c.id.startsWith("cmbs");
  if (isOld) oldCount++; else newCount++;
  const d = c.date.toISOString();
  console.log(`  ${isOld ? "OLD" : "NEW"} ${d.substring(0,19)} ${c.day.padEnd(10)} ${c.time.padEnd(10)} en=${c.enabled} bk=${c.bookings} id=${c.id.substring(0,12)}`);
}
console.log(`\nOLD (cmbs*): ${oldCount}, NEW (uuid): ${newCount}`);

// The problem: we need to delete OLD classes from week 23-27 Mar
// but they were shifted +1 day by comprehensive fix, so they're now at dates like
// 2026-03-23 through 2026-03-28 (but with 23:00 UTC or similar)

// Let me find all OLD classes that fall in the user's "week 23-27" range
// (which in the DB is anything from ~Mar 22 23:00 to ~Mar 28 23:00 UTC)
console.log("\n=== OLD classes to DELETE (week 23-27 Mar) ===");
const toDelete = all.filter(c => {
  const isOld = c.id.startsWith("cmbs");
  const dateUTC = c.date.toISOString().split("T")[0];
  // These are the old classes from the original generation, now shifted
  // They should be in the range covering Mon 23 - Fri 27 Mar
  return isOld && dateUTC >= "2026-03-23" && dateUTC <= "2026-03-28";
});

console.log(`Found ${toDelete.length}:`);
for (const c of toDelete) {
  console.log(`  ${c.date.toISOString()} ${c.day} ${c.time} en=${c.enabled} bk=${c.bookings}`);
}

// Also find OLD duplicate classes on the same dates as NEW classes
console.log("\n=== OLD duplicate classes overlapping with NEW week 30 Mar - 3 Apr ===");
const toDeleteDups = all.filter(c => {
  const isOld = c.id.startsWith("cmbs");
  const dateUTC = c.date.toISOString().split("T")[0];
  return isOld && dateUTC >= "2026-03-30" && dateUTC <= "2026-04-05";
});

console.log(`Found ${toDeleteDups.length}:`);
for (const c of toDeleteDups) {
  console.log(`  ${c.date.toISOString()} ${c.day} ${c.time} en=${c.enabled} bk=${c.bookings}`);
}

const allToDelete = [...toDelete, ...toDeleteDups];
const allIds = allToDelete.map(c => c.id);

console.log(`\n─────────────────────────────────────────`);
console.log(`Total OLD classes to DELETE: ${allIds.length}`);
console.log(`Mode: ${APPLY ? "APPLY" : "DRY RUN"}`);
console.log(`─────────────────────────────────────────\n`);

if (!APPLY) {
  console.log("💡 Run with --apply to commit changes.");
  await client.end();
  process.exit(0);
}

if (allIds.length > 0) {
  const ph = allIds.map((_, i) => `$${i+1}`).join(",");
  const { rowCount: b } = await client.query(`DELETE FROM "Booking" WHERE "classId" IN (${ph})`, allIds);
  const { rowCount: w } = await client.query(`DELETE FROM "Waitlist" WHERE "classId" IN (${ph})`, allIds);
  const { rowCount: cl } = await client.query(`DELETE FROM "Class" WHERE id IN (${ph})`, allIds);
  console.log(`🗑️  Deleted ${cl} old classes, ${b} bookings, ${w} waitlist`);
}

console.log("\n🎉 Done!");
await client.end();
