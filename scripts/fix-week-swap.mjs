/**
 * 1. Delete all classes for 23 Mar – 27 Mar 2026 (and their bookings/waitlist)
 * 2. Delete existing classes for 30 Mar – 3 Apr 2026 (to avoid duplicates)
 * 3. Re-create classes for 30 Mar – 3 Apr 2026 (ENABLED by default)
 *
 * Usage:
 *   node scripts/fix-week-swap.mjs           ← dry run
 *   node scripts/fix-week-swap.mjs --apply   ← apply
 */

import pg from "pg";

const DATABASE_URL =
  "postgresql://neondb_owner:npg_78aJupBVeRSF@ep-calm-bread-a8a957k8-pooler.eastus2.azure.neon.tech/neondb?sslmode=require";

const APPLY = process.argv.includes("--apply");

const TIME_SLOTS = {
  Monday:    ["08:00","09:00","10:00","17:00","18:00","19:00","20:00"],
  Tuesday:   ["08:00","09:00","17:00","18:00","19:00","20:00"],
  Wednesday: ["08:00","09:00","10:00","17:00","18:00","19:00","20:00"],
  Thursday:  ["08:00","09:00","17:00","18:00","19:00","20:00"],
  Friday:    ["08:00","09:00","10:00","16:00","17:00","18:00"],
};

const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

function formatTime(slot) {
  const [h, m] = slot.split(":");
  const hour = parseInt(h, 10);
  return `${hour}:${m} ${hour >= 12 ? "PM" : "AM"}`;
}

const client = new pg.Client({ connectionString: DATABASE_URL });
await client.connect();
console.log("✅ Connected to Neon PostgreSQL\n");

// ── 1. SHOW CLASSES TO DELETE (23 Mar – 27 Mar) ─────────────────────────
const deleteStart = "2026-03-23T00:00:00.000Z";
const deleteEnd   = "2026-03-28T00:00:00.000Z"; // exclusive (up to end of 27 Mar)

const { rows: toDeleteClasses } = await client.query(
  `SELECT id, date, day, time, enabled,
     (SELECT COUNT(*) FROM "Booking" b WHERE b."classId" = c.id) AS bookings
   FROM "Class" c
   WHERE date >= $1 AND date < $2
   ORDER BY date, time`,
  [deleteStart, deleteEnd]
);

console.log(`🗑️  Classes to DELETE (23 Mar – 27 Mar): ${toDeleteClasses.length}`);
for (const c of toDeleteClasses) {
  const d = new Date(c.date).toISOString().split("T")[0];
  console.log(`   ${d} ${c.day.padEnd(10)} ${c.time.padEnd(10)} enabled=${c.enabled} bookings=${c.bookings}`);
}

// ── 2. SHOW EXISTING CLASSES FOR NEXT WEEK (30 Mar – 3 Apr) ─────────────
const createStart = "2026-03-30T00:00:00.000Z";
const createEnd   = "2026-04-04T00:00:00.000Z"; // exclusive

const { rows: existingNextWeek } = await client.query(
  `SELECT id, date, day, time, enabled FROM "Class"
   WHERE date >= $1 AND date < $2 ORDER BY date, time`,
  [createStart, createEnd]
);

console.log(`\n📋 Existing classes for next week (30 Mar – 3 Apr): ${existingNextWeek.length}`);
for (const c of existingNextWeek) {
  const d = new Date(c.date).toISOString().split("T")[0];
  console.log(`   ${d} ${c.day.padEnd(10)} ${c.time.padEnd(10)} enabled=${c.enabled}`);
}

// ── 3. GENERATE NEW CLASSES FOR 30 Mar – 3 Apr ──────────────────────────
const newClasses = [];
let cursor = new Date(createStart);
const endDate = new Date(createEnd);

while (cursor < endDate) {
  const dayName = DAYS[cursor.getUTCDay()];
  const slots = TIME_SLOTS[dayName];
  if (slots) {
    for (const slot of slots) {
      newClasses.push({
        date: new Date(cursor),
        day: dayName,
        time: formatTime(slot),
      });
    }
  }
  cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
}

console.log(`\n✨ Classes to CREATE for next week: ${newClasses.length}`);
for (const c of newClasses) {
  console.log(`   ${c.date.toISOString().split("T")[0]} ${c.day.padEnd(10)} ${c.time}`);
}

// ── SUMMARY ─────────────────────────────────────────────────────────────
console.log(`\n─────────────────────────────────────────`);
console.log(`DELETE week 23–27 Mar : ${toDeleteClasses.length} classes`);
console.log(`DELETE existing 30 Mar–3 Apr : ${existingNextWeek.length} classes (replaced)`);
console.log(`CREATE week 30 Mar–3 Apr : ${newClasses.length} new classes (enabled)`);
console.log(`Mode : ${APPLY ? "APPLY" : "DRY RUN"}`);
console.log(`─────────────────────────────────────────\n`);

if (!APPLY) {
  console.log("💡 Run with --apply to commit changes.");
  await client.end();
  process.exit(0);
}

// ── APPLY ───────────────────────────────────────────────────────────────

// Delete bookings + waitlist + classes for week 23–27 Mar
const deleteIds = toDeleteClasses.map(c => c.id);
if (deleteIds.length > 0) {
  const ph = deleteIds.map((_, i) => `$${i+1}`).join(",");
  const { rowCount: b } = await client.query(`DELETE FROM "Booking" WHERE "classId" IN (${ph})`, deleteIds);
  const { rowCount: w } = await client.query(`DELETE FROM "Waitlist" WHERE "classId" IN (${ph})`, deleteIds);
  const { rowCount: cl } = await client.query(`DELETE FROM "Class" WHERE id IN (${ph})`, deleteIds);
  console.log(`🗑️  Deleted week 23–27 Mar: ${cl} classes, ${b} bookings, ${w} waitlist`);
}

// Delete existing classes for 30 Mar – 3 Apr (to replace cleanly)
const existingIds = existingNextWeek.map(c => c.id);
if (existingIds.length > 0) {
  const ph = existingIds.map((_, i) => `$${i+1}`).join(",");
  const { rowCount: b } = await client.query(`DELETE FROM "Booking" WHERE "classId" IN (${ph})`, existingIds);
  const { rowCount: w } = await client.query(`DELETE FROM "Waitlist" WHERE "classId" IN (${ph})`, existingIds);
  const { rowCount: cl } = await client.query(`DELETE FROM "Class" WHERE id IN (${ph})`, existingIds);
  console.log(`🗑️  Cleared existing next week: ${cl} classes, ${b} bookings, ${w} waitlist`);
}

// Create fresh classes for 30 Mar – 3 Apr (enabled!)
for (const c of newClasses) {
  await client.query(
    `INSERT INTO "Class" (id, name, day, date, time, capacity, "currentBookings", enabled, "paymentMethod", "createdAt", "updatedAt")
     VALUES (gen_random_uuid(), $1, $2, $3, $4, 5, 0, true, 'Cash', NOW(), NOW())`,
    ["CrossFit Class", c.day, c.date, c.time]
  );
}
console.log(`✅ Created ${newClasses.length} new classes for 30 Mar – 3 Apr (all ENABLED)`);

console.log("\n🎉 Done!");
await client.end();
