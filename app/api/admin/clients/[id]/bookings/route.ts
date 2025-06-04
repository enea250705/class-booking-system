import { NextResponse } from "next/server"
import { auth } from "@/lib/auth-middleware"
import { prisma } from "@/lib/prisma"

// GET all bookings for a specific client (admin only)
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = decodeURIComponent(params.id);
    console.log(`Admin API: Fetching bookings for user ID: "${userId}"`);
    
    const user = await auth(request)
    if (!user || user.role !== "admin") {
      console.log(`Admin API: Unauthorized access attempt for user bookings`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // First, check if the client exists
    console.log(`Admin API: Checking if client exists: "${userId}"`);
    const clientData = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        packages: {
          where: { active: true },
          select: {
            id: true,
            name: true,
            classesRemaining: true,
            totalClasses: true,
            endDate: true
          },
          take: 1
        }
      }
    })

    if (!clientData) {
      console.log(`Admin API: Client not found with ID: "${userId}"`);
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }
    
    console.log(`Admin API: Client found: "${clientData.name}"`);

    // Get all bookings for this client
    console.log(`Admin API: Fetching bookings for client: "${clientData.name}"`);
    const bookings = await prisma.booking.findMany({
      where: { userId },
      include: {
        class: true
      },
      orderBy: { 
        createdAt: 'desc' 
      }
    })
    
    console.log(`Admin API: Found ${bookings.length} bookings for client: "${clientData.name}"`);

    // Format the response to include all necessary details
    const formattedBookings = bookings.map(booking => ({
      id: booking.id,
      classId: booking.classId,
      status: booking.status || 'active',
      createdAt: booking.createdAt,
      class: {
        id: booking.class.id,
        name: booking.class.name,
        date: booking.class.date,
        time: booking.class.time,
        day: booking.class.day,
        capacity: booking.class.capacity,
        currentBookings: booking.class.currentBookings
      }
    }))

    // Return the bookings with the client details
    const response = {
      client: {
        id: clientData.id,
        name: clientData.name,
        email: clientData.email,
        package: clientData.packages.length > 0 ? {
          id: clientData.packages[0].id,
          name: clientData.packages[0].name,
          classesRemaining: clientData.packages[0].classesRemaining,
          totalClasses: clientData.packages[0].totalClasses,
          endDate: clientData.packages[0].endDate
        } : null
      },
      bookings: formattedBookings,
      totalBookings: formattedBookings.length
    };
    
    console.log(`Admin API: Sending response with ${formattedBookings.length} bookings`);
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    })
  } catch (error) {
    console.error("Admin API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch client bookings" },
      { status: 500 }
    )
  }
} 