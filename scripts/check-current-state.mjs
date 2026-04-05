import pg from "pg";

const DATABASE_URL =
  "postgresql://neondb_owner:npg_78aJupBVeRSF@ep-calm-bread-a8a957k8-pooler.eastus2.azure.neon.tech/neondb?sslmode=require";

const client = new pg.Client({ connectionString: DATABASE_URL });
await client.connect();

// Check ALL classes from March 16 to April 10 to see the full picture
const { rows } = await client.query(`
  SELECT date, day, time, enabled,
    (SELECT COUNT(*) FROM "Booking" b WHERE b."classId" = c.id) AS bookings
  FROM "Class" c
  WHERE date >= '2026-03-16' AND date < '2026-04-11'
  ORDER BY date, time
`);

console.log("Current DB state – classes from 16 Mar to 10 Apr 2026:\n");

let currentWeek = "";
for (const r of rows) {
  const d = new Date(r.date).toISOString().split("T")[0];
  const dayNum = new Date(r.date).getUTCDay(); // 0=Sun
  // Calculate Monday of this week
  const dateObj = new Date(r.date);
  const mondayOffset = dayNum === 0 ? -6 : 1 - dayNum;
  const monday = new Date(dateObj.getTime() + mondayOffset * 86400000);
  const weekLabel = monday.toISOString().split("T")[0];
  
  if (weekLabel !== currentWeek) {
    currentWeek = weekLabel;
    const friday = new Date(monday.getTime() + 4 * 86400000);
    console.log(`\n━━━ WEEK: ${monday.toISOString().split("T")[0]} to ${friday.toISOString().split("T")[0]} ━━━`);
  }
  console.log(`  ${d} ${r.day.padEnd(10)} ${r.time.padEnd(10)} enabled=${r.enabled} bookings=${r.bookings}`);
}

// Count per week
const { rows: weekCounts } = await client.query(`
  SELECT 
    date_trunc('week', date + interval '1 day')::date - interval '1 day' as week_start,
    COUNT(*) as class_count
  FROM "Class"
  WHERE date >= '2026-03-16' AND date < '2026-04-11'
  GROUP BY week_start
  ORDER BY week_start
`);
console.log("\n\nSummary by week:");
for (const w of weekCounts) {
  const d = new Date(w.week_start).toISOString().split("T")[0];
  console.log(`  Week starting ${d}: ${w.class_count} classes`);
}

await client.end();
