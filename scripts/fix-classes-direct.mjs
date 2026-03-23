/**
 * Direct DB fix script – runs against the live Neon PostgreSQL database.
 * 
 * What it does:
 *  1. Finds every pair of duplicate classes (same UTC date + same time string)
 *  2. Deletes the duplicate copies (bookings/waitlist entries on them first)
 *  3. Checks whether the week 30 Mar – 3 Apr 2026 has the expected classes;
 *     if any are missing it inserts them (disabled by default).
 *
 * Usage:
 *   node scripts/fix-classes-direct.mjs           ← dry run (no changes)
 *   node scripts/fix-classes-direct.mjs --apply   ← actually apply
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

async function main() {
  await client.connect();
  console.log("✅ Connected to Neon PostgreSQL\n");

  // ── 1. FETCH ALL CLASSES ─────────────────────────────────────────────────
  const { rows: allClasses } = await client.query(
    `SELECT c.id, c.name, c.day, c.date, c.time, c.enabled, c."createdAt",
            (SELECT COUNT(*) FROM "Booking" b WHERE b."classId" = c.id) AS booking_count
     FROM "Class" c
     ORDER BY c.date ASC, c.time ASC`
  );

  console.log(`📋 Total classes in DB: ${allClasses.length}\n`);

  // ── 2. FIND DUPLICATES ───────────────────────────────────────────────────
  const seen = new Map(); // key → [row, ...]
  for (const cls of allClasses) {
    const dateKey = new Date(cls.date).toISOString().split("T")[0];
    const key = `${dateKey}|${cls.time}`;
    if (!seen.has(key)) seen.set(key, []);
    seen.get(key).push(cls);
  }

  const dupGroups = [...seen.values()].filter(g => g.length > 1);
  console.log(`🔍 Duplicate groups found: ${dupGroups.length}`);

  const toDelete = [];
  for (const group of dupGroups) {
    // Sort: keep the one with the most bookings; ties → earliest createdAt
    group.sort((a, b) => {
      const diff = Number(b.booking_count) - Number(a.booking_count);
      if (diff !== 0) return diff;
      return new Date(a.createdAt) - new Date(b.createdAt);
    });
    const [keep, ...rest] = group;
    const dateKey = new Date(keep.date).toISOString().split("T")[0];
    console.log(`  keep  ${dateKey} ${keep.time} (${keep.booking_count} bookings, id=${keep.id})`);
    for (const dup of rest) {
      console.log(`  DELETE ${dateKey} ${dup.time} (${dup.booking_count} bookings, id=${dup.id})`);
      toDelete.push(dup.id);
    }
  }

  // ── 3. CHECK MISSING WEEK 30 Mar – 3 Apr 2026 ───────────────────────────
  console.log("\n📅 Checking week 30 Mar – 3 Apr 2026...");

  // Build set of existing (UTC-date | time) for that range
  const rangeStart = new Date("2026-03-30T00:00:00.000Z");
  const rangeEnd   = new Date("2026-04-04T00:00:00.000Z");

  const existingKeys = new Set();
  for (const cls of allClasses) {
    const d = new Date(cls.date);
    if (d >= rangeStart && d < rangeEnd) {
      existingKeys.add(`${d.toISOString().split("T")[0]}|${cls.time}`);
    }
  }

  const toCreate = [];
  let cursor = new Date(rangeStart);
  while (cursor < rangeEnd) {
    const dayName = DAYS[cursor.getUTCDay()];
    const slots = TIME_SLOTS[dayName];
    if (slots) {
      for (const slot of slots) {
        const ft = formatTime(slot);
        const dk = cursor.toISOString().split("T")[0];
        if (!existingKeys.has(`${dk}|${ft}`)) {
          toCreate.push({ date: new Date(cursor), day: dayName, time: ft });
        }
      }
    }
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
  }

  if (toCreate.length === 0) {
    console.log("  ✅  All expected classes for 30 Mar – 3 Apr already exist.");
  } else {
    console.log(`  ⚠️  Missing ${toCreate.length} classes:`);
    for (const c of toCreate) {
      console.log(`     ${c.date.toISOString().split("T")[0]} ${c.day} ${c.time}`);
    }
  }

  // ── 4. SUMMARY ───────────────────────────────────────────────────────────
  console.log("\n─────────────────────────────────────────");
  console.log(`To DELETE : ${toDelete.length} duplicate classes`);
  console.log(`To CREATE : ${toCreate.length} missing classes`);
  console.log(`Mode      : ${APPLY ? "APPLY (writing to DB)" : "DRY RUN (no changes)"}`);
  console.log("─────────────────────────────────────────\n");

  if (!APPLY) {
    console.log("💡 Run with --apply to commit changes.");
    await client.end();
    return;
  }

  // ── 5. APPLY ─────────────────────────────────────────────────────────────
  if (toDelete.length > 0) {
    const placeholders = toDelete.map((_, i) => `$${i + 1}`).join(", ");
    
    const { rowCount: wb } = await client.query(
      `DELETE FROM "Booking" WHERE "classId" IN (${placeholders})`, toDelete
    );
    console.log(`🗑️  Deleted ${wb} bookings from duplicates`);

    const { rowCount: ww } = await client.query(
      `DELETE FROM "Waitlist" WHERE "classId" IN (${placeholders})`, toDelete
    );
    console.log(`🗑️  Deleted ${ww} waitlist entries from duplicates`);

    const { rowCount: wc } = await client.query(
      `DELETE FROM "Class" WHERE id IN (${placeholders})`, toDelete
    );
    console.log(`🗑️  Deleted ${wc} duplicate classes`);
  }

  if (toCreate.length > 0) {
    for (const c of toCreate) {
      await client.query(
        `INSERT INTO "Class" (id, name, day, date, time, capacity, "currentBookings", enabled, "paymentMethod", "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, 5, 0, false, 'Cash', NOW(), NOW())`,
        ["CrossFit Class", c.day, c.date, c.time]
      );
    }
    console.log(`✅ Created ${toCreate.length} missing classes (disabled by default)`);
  }

  console.log("\n🎉 Done!");
  await client.end();
}

main().catch(err => {
  console.error("❌ Error:", err);
  process.exit(1);
});
