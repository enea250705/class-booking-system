import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth-middleware"
import { db } from "@/lib/db"
import { NextRequest } from "next/server"

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
export async function GET(req: NextRequest) {
  try {
    // Authenticate the user to determine their role
    const user = await auth(req);
    const isAdmin = user?.role === "admin";
    
    const searchParams = req.nextUrl.searchParams
    const count = searchParams.get('count') === 'true'
    
    // If count parameter is provided, return the count of all classes
    if (count) {
      const total = await db.class.count()
      return NextResponse.json({ count: total })
    }
    
    // Otherwise, return the list of classes
    // Get search params for filtering
    const { searchParams: urlSearchParams } = new URL(req.url);
    const day = urlSearchParams.get('day');
    const upcoming = urlSearchParams.get('upcoming') === 'true';
    console.log('GET classes - query params:', { day, upcoming });

    // Build query to fetch classes
    const query: any = {
      where: {},
      orderBy: [
        { date: 'asc' }
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

    // Regular users can only see enabled classes
    if (!isAdmin) {
      query.where.enabled = true;
    }

    // Fetch classes from database
    const classes = await prisma.class.findMany({
      ...query,
      include: {
        bookings: true
      }
    });
    console.log(`Fetched ${classes.length} classes from database${!isAdmin ? ' (enabled only)' : ''}`);

    const classesWithCount = classes.map((cls: any) => ({
      id: cls.id,
      name: cls.name,
      day: cls.day,
      date: cls.date,
      time: cls.time,
      capacity: cls.capacity || 5,
      currentBookings: Array.isArray(cls.bookings) ? cls.bookings.length : (cls.currentBookings || 0),
      enabled: cls.enabled,
      coach: cls.coach || "",
      level: cls.level || "All Levels",
    }));

    // Sort classes by date first, then by time properly handling AM/PM format
    classesWithCount.sort((a, b) => {
      // First sort by date
      const dateComparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateComparison !== 0) return dateComparison;
      
      // If same date, sort by time (properly handling AM/PM)
      const getTimeValue = (timeStr: string) => {
        const [time, period] = timeStr.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        
        // Convert to 24-hour format for proper comparison
        if (period === 'PM' && hours < 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        
        return hours * 60 + minutes;
      };
      
      return getTimeValue(a.time) - getTimeValue(b.time);
    });

    return NextResponse.json(classesWithCount, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
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
    
    const { name, day, date, time, capacity, timeHour, timeMinute, timePeriod } = await request.json();
    
    // Format the time if individual time components are provided
    let formattedTime = time;
    if (!formattedTime && timeHour && timeMinute) {
      const formattedHour = parseInt(timeHour);
      const hour24 = timePeriod === "PM" && formattedHour < 12 
        ? formattedHour + 12 
        : (timePeriod === "AM" && formattedHour === 12 ? 0 : formattedHour);
      formattedTime = `${hour24.toString().padStart(2, '0')}:${timeMinute}`;
    }
    
    // Ensure capacity is a number
    const capacityNumber = typeof capacity === 'string' 
      ? parseInt(capacity, 10) 
      : (typeof capacity === 'number' ? capacity : 5);
    
    // Create the class
    const newClass = await prisma.class.create({
      data: {
        name,
        day,
        date: new Date(date),
        time: formattedTime || "12:00",
        capacity: capacityNumber,
        currentBookings: 0,
        enabled: false,
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
