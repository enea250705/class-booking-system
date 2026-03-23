// Simulate the schedule generation logic from generate-default-schedule/route.ts
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const startDate = new Date("2025-06-02");
const endDate = new Date(startDate);
endDate.setFullYear(endDate.getFullYear() + 1);

let currentDate = new Date(startDate);
let classCount = {};

// Only look at March 2026
while (currentDate < endDate) {
  const dayOfWeek = DAYS[currentDate.getDay()];
  const dateStr = currentDate.toISOString().split('T')[0];
  const localDateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth()+1).padStart(2,'0')}-${String(currentDate.getDate()).padStart(2,'0')}`;
  
  // Focus on March-April 2026
  if (currentDate.getFullYear() === 2026 && (currentDate.getMonth() === 2 || currentDate.getMonth() === 3)) {
    // Count classes per local date
    if (!classCount[localDateStr]) {
      classCount[localDateStr] = { day: dayOfWeek, utcDate: dateStr, localDate: localDateStr, count: 0, utcHour: currentDate.getUTCHours(), localHour: currentDate.getHours() };
    }
    classCount[localDateStr].count++;
    
    if (dayOfWeek !== "Saturday" && dayOfWeek !== "Sunday") {
      console.log(`Date: ${localDateStr} (UTC: ${dateStr}) | Day: ${dayOfWeek} | UTC Hour: ${currentDate.getUTCHours()} | Local Hour: ${currentDate.getHours()}`);
    }
  }
  
  currentDate.setDate(currentDate.getDate() + 1);
}

console.log("\n--- Summary: Any duplicates or missing dates? ---");
const allDates = Object.keys(classCount).sort();
for (const d of allDates) {
  const info = classCount[d];
  if (info.count > 1) {
    console.log(`DUPLICATE: ${d} appeared ${info.count} times (${info.day})`);
  }
}

// Check for consecutive dates
for (let i = 1; i < allDates.length; i++) {
  const prev = new Date(allDates[i-1] + "T12:00:00");
  const curr = new Date(allDates[i] + "T12:00:00");
  const diff = (curr - prev) / (1000 * 60 * 60 * 24);
  if (diff > 1) {
    console.log(`GAP: Missing date(s) between ${allDates[i-1]} and ${allDates[i]} (gap of ${diff} days)`);
  }
}
