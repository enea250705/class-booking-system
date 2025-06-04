import { NextResponse } from "next/server";
import { auth } from "@/lib/auth-middleware";
import { prisma } from "@/lib/prisma";

// GET - Debug endpoint for checking booking status
export async function GET(request: Request) {
  try {
    const user = await auth(request);

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get URL parameters
    const url = new URL(request.url);
    const classId = url.searchParams.get('classId');

    if (!classId) {
      return NextResponse.json(
        { error: "Class ID is required" },
        { status: 400 }
      );
    }

    // Get the class
    const classData = await prisma.class.findUnique({
      where: { id: classId }
    });

    if (!classData) {
      return NextResponse.json(
        { error: "Class not found" },
        { status: 404 }
      );
    }

    // Check if user has a booking for this class
    const booking = await prisma.booking.findFirst({
      where: {
        userId: user.id,
        classId,
        class: {
          date: {
            gte: new Date()
          }
        }
      }
    });

    // Get all user's bookings
    const allBookings = await prisma.booking.findMany({
      where: {
        userId: user.id,
        class: {
          date: {
            gte: new Date()
          }
        }
      },
      include: {
        class: true
      }
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      requestedClass: {
        id: classId,
        name: classData.name,
        date: classData.date,
        time: classData.time,
        hasBooking: !!booking,
        booking: booking || null
      },
      allBookings: allBookings.map(b => ({
        id: b.id,
        classId: b.classId,
        className: b.class.name,
        classDate: b.class.date,
        classTime: b.class.time
      })),
      bookingsCount: allBookings.length
    }, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
  } catch (error) {
    console.error("Error in debug booking status endpoint:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch booking status debug data",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 