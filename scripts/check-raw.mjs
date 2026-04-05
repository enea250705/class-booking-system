import pg from "pg";

const DATABASE_URL =
  "postgresql://neondb_owner:npg_78aJupBVeRSF@ep-calm-bread-a8a957k8-pooler.eastus2.azure.neon.tech/neondb?sslmode=require";

const client = new pg.Client({ connectionString: DATABASE_URL });
await client.connect();

// Show raw timestamps for classes in the problem range
const { rows } = await client.query(`
  SELECT id, date, day, time, enabled,
    (SELECT COUNT(*) FROM "Booking" b WHERE b."classId" = c.id) AS bookings
  FROM "Class" c
  WHERE date >= '2026-03-20' AND date < '2026-04-05'
  ORDER BY date, time
`);

console.log("Raw DB timestamps:\n");
let lastDate = "";
for (const r of rows) {
  const fullTs = r.date.toISOString();
  const shortDate = fullTs.split("T")[0];
  if (shortDate !== lastDate) {
    lastDate = shortDate;
    console.log(`\n--- ${shortDate} (${r.day}) ---`);
  }
  console.log(`  id=${r.id.substring(0,8)}  ts=${fullTs}  time=${r.time.padEnd(10)} en=${r.enabled} bk=${r.bookings}`);
}

// Total count
console.log(`\nTotal classes in range: ${rows.length}`);

// Specifically check week 23-27 boundaries
console.log("\n=== Week boundaries check ===");
const { rows: weekCheck } = await client.query(`
  SELECT 
    MIN(date) as min_date, MAX(date) as max_date, COUNT(*) as cnt,
    MIN(date)::text as min_raw, MAX(date)::text as max_raw
  FROM "Class"
  WHERE day IN ('Monday','Tuesday','Wednesday','Thursday') 
    AND date >= '2026-03-22' AND date < '2026-03-27'
`);
console.log("Mon-Thu in range 22-26 Mar:", weekCheck[0]);

const { rows: friCheck } = await client.query(`
  SELECT id, date, date::text as raw_date, day, time, enabled
  FROM "Class"
  WHERE day = 'Friday' AND date >= '2026-03-26' AND date < '2026-03-29'
  ORDER BY date
`);
console.log("\nFriday classes near 27 Mar:", friCheck.length);
friCheck.forEach(r => console.log(`  ${r.raw_date} ${r.day} ${r.time} en=${r.enabled}`));

await client.end();
