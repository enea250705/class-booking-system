import { NextResponse } from "next/server";
import { auth } from "@/lib/auth-middleware";
import { prisma } from "@/lib/prisma";
import { addDays, format, parseISO, startOfDay, endOfDay } from "date-fns";

// GET - Fetch classes grouped by week
export async function GET(request: Request) {
  try {
    const user = await auth(request);

    // Check authentication
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admin can access this endpoint
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // Get query parameters
    const url = new URL(request.url);
    const fromDate = url.searchParams.get('fromDate');
    const toDate = url.searchParams.get('toDate');
    
    // Default to fetching 10 weeks if no date range is provided
    const defaultStartDate = new Date();
    const defaultEndDate = addDays(defaultStartDate, 70); // Approximately 10 weeks
    
    // Parse date range
    const startDate = fromDate ? startOfDay(parseISO(fromDate)) : startOfDay(defaultStartDate);
    const endDate = toDate ? endOfDay(parseISO(toDate)) : endOfDay(defaultEndDate);
    
    // Fetch classes within the date range
    const classes = await prisma.class.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: [
        { date: 'asc' },
        { time: 'asc' },
      ],
    });
    
    // Group classes by week
    const weekMap = new Map();
    
    for (const cls of classes) {
      const classDate = cls.date;
      const dayOfWeek = classDate.getDay();
      
      // Calculate the Monday of this week
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const weekStartDate = addDays(classDate, mondayOffset);
      const weekStartString = format(weekStartDate, 'yyyy-MM-dd');
      
      // Get or create the week entry
      if (!weekMap.has(weekStartString)) {
        const weekEndDate = addDays(weekStartDate, 6);
        
        weekMap.set(weekStartString, {
          weekStartDate: weekStartString,
          weekStart: format(weekStartDate, 'yyyy-MM-dd'),
          weekEnd: format(weekEndDate, 'yyyy-MM-dd'),
          displayRange: `${format(weekStartDate, 'MMM d')} - ${format(weekEndDate, 'MMM d, yyyy')}`,
          classes: [],
          enabledCount: 0,
          totalCount: 0,
          hasAllEnabled: false,
          hasAllDisabled: true,
          hasPartialEnabled: false,
          days: {},
        });
      }
      
      const weekData = weekMap.get(weekStartString);
      
      // Add class to the week
      weekData.classes.push(cls);
      weekData.totalCount++;
      
      if (cls.enabled) {
        weekData.enabledCount++;
        weekData.hasAllDisabled = false;
      }
      
      // Group by day
      const dayName = cls.day.toLowerCase();
      if (!weekData.days[dayName]) {
        weekData.days[dayName] = {
          classes: [],
          enabledCount: 0,
          totalCount: 0,
        };
      }
      
      weekData.days[dayName].classes.push(cls);
      weekData.days[dayName].totalCount++;
      
      if (cls.enabled) {
        weekData.days[dayName].enabledCount++;
      }
    }
    
    // Calculate if all classes are enabled or disabled
    for (const [_, weekData] of weekMap) {
      weekData.hasAllEnabled = weekData.enabledCount === weekData.totalCount;
      weekData.hasPartialEnabled = !weekData.hasAllEnabled && !weekData.hasAllDisabled;
    }
    
    // Convert to array and sort by week start date
    const weeks = Array.from(weekMap.values()).sort((a, b) => 
      a.weekStart.localeCompare(b.weekStart)
    );

    return NextResponse.json({
      weeks,
      totalWeeks: weeks.length,
      fromDate: format(startDate, 'yyyy-MM-dd'),
      toDate: format(endDate, 'yyyy-MM-dd'),
    });
  } catch (error) {
    console.error("Error fetching weekly schedule:", error);
    return NextResponse.json(
      { error: "Failed to fetch weekly schedule" },
      { status: 500 }
    );
  }
} 