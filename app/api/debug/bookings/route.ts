import { NextResponse } from "next/server"
import { auth } from "@/lib/auth-middleware"
import { prisma } from "@/lib/prisma"

// GET detailed booking information for debugging
export async function GET(request: Request) {
  try {
    const user = await auth(request)

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    console.log("Fetching debug booking information for user:", user.id);

    // Get all bookings without any filters
    const allBookings = await prisma.booking.findMany({
      where: {
        userId: user.id,
      },
      include: {
        class: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get active bookings (for classes that are enabled)
    const activeBookings = allBookings.filter(booking => booking.class.enabled);
    
    // Get bookings for future classes
    const now = new Date();
    const futureBookings = allBookings.filter(booking => new Date(booking.class.date) >= now && booking.class.enabled);

    // Get bookings for past classes
    const pastBookings = allBookings.filter(booking => new Date(booking.class.date) < now && booking.class.enabled);

    // Count of bookings by state
    const counts = {
      total: allBookings.length,
      active: activeBookings.length,
      future: futureBookings.length,
      past: pastBookings.length
    };

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      bookings: {
        activeCount: activeBookings.length,
        futureCount: futureBookings.length,
        pastCount: pastBookings.length,
        totalCount: allBookings.length,
        
        // Detailed booking data
        active: activeBookings,
        future: futureBookings,
        past: pastBookings,
        all: allBookings
      },
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
  } catch (error) {
    console.error("Error fetching debug booking information:", error);
    return NextResponse.json(
      { error: "Failed to fetch debug booking information" },
      { status: 500 }
    );
  }
} 