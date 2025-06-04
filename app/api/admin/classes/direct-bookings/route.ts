import { NextResponse } from "next/server"
import { auth } from "@/lib/auth-middleware"
import { prisma } from "@/lib/prisma"

// GET all bookings for a specific class (admin only)
// This is a workaround route that accepts class ID as a query parameter
export async function GET(request: Request) {
  try {
    // Get the class ID from the URL query parameter
    const url = new URL(request.url);
    const classId = url.searchParams.get('classId');
    
    console.log(`Admin API: Direct bookings route with class ID: "${classId}"`);
    
    if (!classId) {
      return NextResponse.json({ error: "Missing class ID" }, { status: 400 });
    }
    
    const user = await auth(request)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // First, check if the class exists
    const classData = await prisma.class.findUnique({
      where: { id: classId },
    })

    if (!classData) {
      console.log(`Admin API: Class not found with ID: "${classId}"`);
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    // Get all bookings for this class
    const bookings = await prisma.booking.findMany({
      where: { classId },
      include: {
        user: {
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
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Format the response to include all necessary details
    const formattedBookings = bookings.map(booking => ({
      id: booking.id,
      userId: booking.userId,
      status: booking.status || 'active',
      createdAt: booking.createdAt,
      user: {
        id: booking.user.id,
        name: booking.user.name,
        email: booking.user.email,
        package: booking.user.packages.length > 0 ? {
          id: booking.user.packages[0].id,
          name: booking.user.packages[0].name,
          classesRemaining: booking.user.packages[0].classesRemaining,
          totalClasses: booking.user.packages[0].totalClasses,
          endDate: booking.user.packages[0].endDate
        } : null
      }
    }))

    // Return the bookings with the class details
    return NextResponse.json({
      class: {
        id: classData.id,
        name: classData.name,
        date: classData.date,
        time: classData.time,
        day: classData.day,
        capacity: classData.capacity,
        currentBookings: classData.currentBookings,
        enabled: classData.enabled
      },
      bookings: formattedBookings,
      totalBookings: formattedBookings.length
    }, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    })
  } catch (error) {
    console.error("Admin API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch class bookings" },
      { status: 500 }
    )
  }
} 