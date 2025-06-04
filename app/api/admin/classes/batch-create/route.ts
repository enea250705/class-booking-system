import { NextResponse } from "next/server";
import { auth } from "@/lib/auth-middleware";
import { prisma } from "@/lib/prisma";
import { addDays, addWeeks, format, parseISO } from "date-fns";

// Day of week mapping
const DAY_MAP = {
  1: "Monday",
  2: "Tuesday", 
  3: "Wednesday",
  4: "Thursday",
  5: "Friday"
};

// Time slots for each day
const TIME_SLOTS = {
  Monday: {
    morning: ["08:00", "09:00", "10:00"],
    evening: ["17:00", "18:00", "19:00", "20:00"]
  },
  Tuesday: {
    morning: ["08:00", "09:00"],
    evening: ["17:00", "18:00", "19:00", "20:00"]
  },
  Wednesday: {
    morning: ["08:00", "09:00", "10:00"],
    evening: ["17:00", "18:00", "19:00", "20:00"]
  },
  Thursday: {
    morning: ["08:00", "09:00"],
    evening: ["17:00", "18:00", "19:00", "20:00"]
  },
  Friday: {
    morning: ["08:00", "09:00", "10:00"],
    evening: ["16:00", "17:00", "18:00"]
  }
};

// Find the first Monday on or after the given date
function getFirstMonday(date: Date): Date {
  const day = date.getDay();
  // If not Monday (1), add days until we reach Monday
  if (day !== 1) {
    // If Sunday (0), add 1 day, otherwise add days needed to reach next Monday
    const daysToAdd = day === 0 ? 1 : 8 - day;
    return addDays(date, daysToAdd);
  }
  return date;
}

// POST - Create a batch of classes for a full year
export async function POST(request: Request) {
  try {
    const user = await auth(request);

    // Check authentication and admin role
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // Get request data
    const data = await request.json();
    const { startDate, className, capacity = 5 } = data;

    if (!startDate || !className) {
      return NextResponse.json({ error: "Start date and class name are required" }, { status: 400 });
    }

    // Parse the start date and ensure it's a Monday
    const parsedStartDate = getFirstMonday(new Date(startDate));
    const classes = [];

    // Generate classes for 52 weeks (1 year)
    for (let week = 0; week < 52; week++) {
      const weekStart = addWeeks(parsedStartDate, week);
      
      // For each day (Monday to Friday)
      for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
        const currentDate = addDays(weekStart, dayOffset);
        const dayNumber = currentDate.getDay();
        const dayName = DAY_MAP[dayNumber as keyof typeof DAY_MAP];
        
        if (!dayName) continue; // Skip if not Mon-Fri
        
        // Get time slots for this day
        const dayTimeSlots = TIME_SLOTS[dayName as keyof typeof TIME_SLOTS];
        
        // Create morning classes
        for (const time of dayTimeSlots.morning) {
          classes.push({
            name: className,
            date: currentDate,
            day: dayName,
            time: `${time}`,
            capacity: capacity,
            currentBookings: 0,
            enabled: false,
          });
        }
        
        // Create evening classes
        for (const time of dayTimeSlots.evening) {
          classes.push({
            name: className,
            date: currentDate,
            day: dayName,
            time: `${time}`,
            capacity: capacity,
            currentBookings: 0,
            enabled: false,
          });
        }
      }
    }

    // Create all classes in the database
    const result = await prisma.class.createMany({
      data: classes,
      skipDuplicates: true, // Skip if there's already a class with the same date and time
    });

    return NextResponse.json({
      message: `Successfully created ${result.count} classes (all disabled by default)`,
      firstClassDate: format(parsedStartDate, 'yyyy-MM-dd'),
      lastClassDate: format(addWeeks(parsedStartDate, 51), 'yyyy-MM-dd'),
      totalClassesCreated: result.count,
    });
  } catch (error) {
    console.error("Error creating batch classes:", error);
    return NextResponse.json(
      { error: "Failed to create classes" },
      { status: 500 }
    );
  }
} 