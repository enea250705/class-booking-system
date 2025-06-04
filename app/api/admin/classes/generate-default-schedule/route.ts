import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth-middleware";

// Time slots for each day of the week
const TIME_SLOTS = {
  // Monday: Morning (3) + Evening (4)
  Monday: ["08:00", "09:00", "10:00", "17:00", "18:00", "19:00", "20:00"],
  // Tuesday: Morning (2) + Evening (4)
  Tuesday: ["08:00", "09:00", "17:00", "18:00", "19:00", "20:00"],
  // Wednesday: Morning (3) + Evening (4)
  Wednesday: ["08:00", "09:00", "10:00", "17:00", "18:00", "19:00", "20:00"],
  // Thursday: Morning (2) + Evening (4)
  Thursday: ["08:00", "09:00", "17:00", "18:00", "19:00", "20:00"],
  // Friday: Morning (3) + Evening (3)
  Friday: ["08:00", "09:00", "10:00", "16:00", "17:00", "18:00"],
};

// Day name mapping
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Create a type for valid weekdays
type Weekday = keyof typeof TIME_SLOTS;

export async function POST(request: Request) {
  try {
    // Check for admin authentication
    const user = await auth(request);
    
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }
    
    // Start date is June 2, 2025 (a Monday)
    const startDate = new Date("2025-06-02");
    const className = "CrossFit Class";
    const capacity = 5;
    
    // End date is one year from start date
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1);
    
    // Generate classes for each day in the year
    const classes = [];
    let currentDate = new Date(startDate);
    
    // Loop through dates until we reach the end date
    while (currentDate < endDate) {
      const dayOfWeek = DAYS[currentDate.getDay()];
      
      // Only create classes for weekdays (Monday to Friday)
      if (dayOfWeek !== "Saturday" && dayOfWeek !== "Sunday") {
        const timeSlots = TIME_SLOTS[dayOfWeek as Weekday];
        
        // Create a class for each time slot on this day
        for (const timeSlot of timeSlots) {
          const [hours, minutes] = timeSlot.split(':');
          const formattedTime = `${parseInt(hours, 10)}:${minutes} ${parseInt(hours, 10) >= 12 ? 'PM' : 'AM'}`;
          
          classes.push({
            name: className,
            day: dayOfWeek,
            date: new Date(currentDate),
            time: formattedTime,
            capacity: capacity,
            enabled: false,
            currentBookings: 0,
          });
        }
      }
      
      // Move to the next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Batch create classes in the database
    await prisma.class.createMany({
      data: classes,
      skipDuplicates: true,
    });
    
    return NextResponse.json({
      success: true,
      message: "Year-long schedule generated successfully (all classes disabled by default)",
      totalClassesCreated: classes.length,
      firstClassDate: startDate.toISOString().split('T')[0],
      lastClassDate: endDate.toISOString().split('T')[0],
    });
    
  } catch (error) {
    console.error("Error generating schedule:", error);
    return NextResponse.json(
      { error: "Failed to generate schedule" },
      { status: 500 }
    );
  }
} 