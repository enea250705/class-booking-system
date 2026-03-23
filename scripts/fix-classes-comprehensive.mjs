/**
 * COMPREHENSIVE FIX – direct DB patch
 *
 * The problem: Classes were generated with new Date("YYYY-MM-DD") which
 * creates UTC midnight timestamps. On the CET server (UTC+1), these dates
 * look like the correct day locally, but the *stored UTC date* is one day
 * behind. This means in the database:
 *
 *   "Monday 23 Mar 2026" is stored as date = 2026-03-22T00:00:00Z  ← WRONG
 *
 * The UI groups by UTC date, so it shows the class on Sunday 22 Mar.
 *
 * FIX: Shift every class date forward by 1 day (i.e. add 1 day to the
 * stored UTC timestamp). This puts them on the correct UTC calendar date
 * matching the `day` column.
 *
 * ALSO: After DST (Mar 29 CET→CEST), the offset changes from +1 to +2,
 * so classes from Mar 30 onward are stored 2 days behind their day name.
 * We must check each class's stored date against its `day` field and
 * correct accordingly.
 *
 * Usage:
 *   node scripts/fix-classes-comprehensive.mjs           ← dry run
 *   node scripts/fix-classes-comprehensive.mjs --apply   ← apply fix
 */

import pg from "pg";

const DATABASE_URL =
  "postgresql://neondb_owner:npg_78aJupBVeRSF@ep-calm-bread-a8a957k8-pooler.eastus2.azure.neon.tech/neondb?sslmode=require";

const APPLY = process.argv.includes("--apply");
const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

const client = new pg.Client({ connectionString: DATABASE_URL });
await client.connect();
console.log("✅ Connected to Neon PostgreSQL\n");

// Fetch all classes
const { rows: allClasses } = await client.query(
  `SELECT id, name, day, date, time, enabled FROM "Class" ORDER BY date, time`
);
console.log(`📋 Total classes: ${allClasses.length}\n`);

// For each class, determine what the correct calendar date should be
// by comparing the stored UTC date's day-of-week with the 'day' column
const toUpdate = [];
let correct = 0;

for (const cls of allClasses) {
  const storedDate = new Date(cls.date); // UTC
  const storedUTCDay = storedDate.getUTCDay(); // 0=Sun, 1=Mon, ...
  const expectedDayName = cls.day; // e.g. "Monday"
  const expectedDayIdx = DAY_NAMES.indexOf(expectedDayName);

  if (expectedDayIdx === -1) {
    console.log(`⚠️  Unknown day name "${cls.day}" for class id=${cls.id}`);
    continue;
  }

  if (storedUTCDay === expectedDayIdx) {
    correct++;
    continue; // Already correct
  }

  // Calculate the offset needed (how many days to add)
  let offset = expectedDayIdx - storedUTCDay;
  if (offset < 0) offset += 7; // Wrap around (shouldn't happen but just in case)

  // Compute the corrected date
  const correctedDate = new Date(storedDate.getTime() + offset * 24 * 60 * 60 * 1000);

  toUpdate.push({
    id: cls.id,
    originalDate: storedDate.toISOString().split("T")[0],
    correctedDate: correctedDate.toISOString().split("T")[0],
    day: cls.day,
    time: cls.time,
    offset,
    correctedDateObj: correctedDate,
  });
}

console.log(`✅ Classes with correct date: ${correct}`);
console.log(`⚠️  Classes with wrong date:  ${toUpdate.length}\n`);

if (toUpdate.length > 0) {
  // Group by offset to summarize
  const byOffset = {};
  for (const u of toUpdate) {
    if (!byOffset[u.offset]) byOffset[u.offset] = [];
    byOffset[u.offset].push(u);
  }
  for (const [off, items] of Object.entries(byOffset)) {
    console.log(`  Offset +${off} day(s): ${items.length} classes`);
    // Show a sample
    const sample = items.slice(0, 3);
    for (const s of sample) {
      console.log(`    ${s.originalDate} (${DAY_NAMES[new Date(s.originalDate+"T00:00:00Z").getUTCDay()]}) → ${s.correctedDate} (${s.day}) [${s.time}]`);
    }
    if (items.length > 3) console.log(`    ... and ${items.length - 3} more`);
  }
}

console.log(`\n─────────────────────────────────────────`);
console.log(`To UPDATE : ${toUpdate.length} class dates`);
console.log(`Mode      : ${APPLY ? "APPLY (writing to DB)" : "DRY RUN (no changes)"}`);
console.log(`─────────────────────────────────────────\n`);

if (!APPLY) {
  console.log("💡 Run with --apply to commit changes.");
  await client.end();
  process.exit(0);
}

// Apply all updates
console.log("Applying updates...");
let updated = 0;
for (const u of toUpdate) {
  await client.query(
    `UPDATE "Class" SET date = $1, "updatedAt" = NOW() WHERE id = $2`,
    [u.correctedDateObj, u.id]
  );
  updated++;
  if (updated % 50 === 0) process.stdout.write(`  ${updated}/${toUpdate.length}...\r`);
}
console.log(`\n✅ Updated ${updated} classes successfully!`);
console.log("\n🎉 Done! Classes are now on the correct calendar dates.");
await client.end();
