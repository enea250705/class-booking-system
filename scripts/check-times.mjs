// Quick check: what time formats are actually in the DB?
import pg from "pg";
const DATABASE_URL =
  "postgresql://neondb_owner:npg_78aJupBVeRSF@ep-calm-bread-a8a957k8-pooler.eastus2.azure.neon.tech/neondb?sslmode=require";
const client = new pg.Client({ connectionString: DATABASE_URL });
await client.connect();

// Get distinct times and a sample of dates around the problem week
const { rows } = await client.query(`
  SELECT DISTINCT time, COUNT(*) as cnt
  FROM "Class"
  GROUP BY time ORDER BY time
`);
console.log("All distinct time values in DB:");
rows.forEach(r => console.log(`  "${r.time}" (${r.cnt} classes)`));

// Check what classes exist for the full range 23 Mar – 10 Apr
const { rows: week } = await client.query(`
  SELECT date, day, time, enabled
  FROM "Class"
  WHERE date >= '2026-03-23' AND date < '2026-04-10'
  ORDER BY date, time
`);
console.log("\nClasses 23 Mar – 9 Apr 2026:");
week.forEach(r => {
  const d = new Date(r.date).toISOString().split('T')[0];
  console.log(`  ${d} ${r.day.padEnd(10)} "${r.time}" enabled=${r.enabled}`);
});

await client.end();
