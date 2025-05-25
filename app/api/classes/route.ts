import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth-middleware"

// Mock classes for demo
const MOCK_CLASSES = [
  {
    id: "1",
    name: "Morning Yoga",
    day: "Monday",
    time: "7:00 AM",
    date: new Date("2025-05-27"),
    description: "Start your day with a rejuvenating yoga session focusing on flexibility and mindfulness.",
    enabled: true,
    capacity: 20,
    currentBookings: 12,
  },
  {
    id: "2",
    name: "HIIT Training",
    day: "Monday",
    time: "6:00 PM",
    date: new Date("2025-05-27"),
    description: "High-intensity interval training to boost your metabolism and build strength.",
    enabled: true,
    capacity: 15,
    currentBookings: 15,
  },
  {
    id: "3",
    name: "Pilates",
    day: "Tuesday",
    time: "9:00 AM",
    date: new Date("2025-05-28"),
    description: "Core-strengthening exercises that improve posture, balance, and overall body awareness.",
    enabled: true,
    capacity: 12,
    currentBookings: 8,
  },
  {
    id: "4",
    name: "Spin Class",
    day: "Tuesday",
    time: "5:30 PM",
    date: new Date("2025-05-28"),
    description: "High-energy indoor cycling class with motivating music and varying intensity levels.",
    enabled: false,
    capacity: 20,
    currentBookings: 0,
  },
  {
    id: "5",
    name: "Zumba",
    day: "Wednesday",
    time: "7:00 PM",
    date: new Date("2025-05-29"),
    description: "Dance-based fitness class that's fun, energetic, and makes you feel amazing.",
    enabled: true,
    capacity: 25,
    currentBookings: 18,
  },
]

// Set up response cache for 60 seconds
const CACHE_MAX_AGE = 60;

// GET all classes
export async function GET(request: Request) {
  try {
    // Get search params for filtering
    const { searchParams } = new URL(request.url);
    const day = searchParams.get('day');
    const upcoming = searchParams.get('upcoming') === 'true';

    // Build query to fetch classes
    const query: any = {
      where: {},
      orderBy: [
        { date: 'asc' },
        { time: 'asc' }
      ]
    };

    // Filter by day if provided
    if (day) {
      query.where.day = day;
    }

    // Only include upcoming classes if requested
    if (upcoming) {
      query.where.date = {
        gte: new Date()
      };
    }

    // Fetch classes from database
    const classes = await prisma.class.findMany(query);

    // Return classes with cache control headers
    return NextResponse.json(classes, {
      headers: {
        'Cache-Control': `public, max-age=${CACHE_MAX_AGE}, stale-while-revalidate=60`
      }
    });
  } catch (error) {
    console.error("Error fetching classes:", error);
    return NextResponse.json(
      { error: "Failed to fetch classes" },
      { status: 500 }
    );
  }
}

// POST - Create a new class (admin only)
export async function POST(request: Request) {
  try {
    const user = await auth(request);
    
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const { name, day, date, timeHour, timeMinute, timePeriod, capacity } = await request.json();
    
    // Format the time
    const formattedHour = parseInt(timeHour);
    const hour24 = timePeriod === "PM" && formattedHour < 12 
      ? formattedHour + 12 
      : (timePeriod === "AM" && formattedHour === 12 ? 0 : formattedHour);
    const time = `${hour24.toString().padStart(2, '0')}:${timeMinute}`;
    
    // Create the class
    const newClass = await prisma.class.create({
      data: {
        name,
        day,
        date: new Date(date),
        time,
        capacity,
        currentBookings: 0,
        enabled: true,
      },
    });
    
    return NextResponse.json(newClass, { 
      status: 201,
      headers: {
        // No caching for POST responses
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    console.error("Error creating class:", error);
    return NextResponse.json(
      { error: "Failed to create class" },
      { status: 500 }
    );
  }
}
