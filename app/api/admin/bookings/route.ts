import { NextResponse } from "next/server"
import { auth } from "@/lib/auth-middleware"
import { prisma } from "@/lib/prisma"
import { Booking, Class, User } from "@prisma/client"

// Define a type for the booking with its included relations
type BookingWithRelations = Booking & {
  class: Class;
  user: Pick<User, 'id' | 'name' | 'email' | 'role'>;
}

// GET all bookings with client and class information for admin
export async function GET(request: Request) {
  try {
    const user = await auth(request)

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get URL parameters
    const url = new URL(request.url)
    const classId = url.searchParams.get('classId')
    const clientId = url.searchParams.get('clientId')

    // Build query based on parameters
    const query: any = {
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        class: true
      },
      orderBy: [
        {
          class: {
            date: 'asc'
          }
        },
        {
          createdAt: 'desc'
        }
      ]
    }

    // Add filters if provided
    if (classId) {
      query.where = {
        ...query.where,
        classId
      }
    }

    if (clientId) {
      query.where = {
        ...query.where,
        userId: clientId
      }
    }

    // Fetch bookings with the built query
    const bookings = await prisma.booking.findMany(query) as unknown as BookingWithRelations[]

    // Format the data for easier consumption
    const formattedBookings = bookings.map(booking => ({
      id: booking.id,
      classId: booking.classId,
      className: booking.class.name,
      classDate: booking.class.date,
      classTime: booking.class.time,
      client: {
        id: booking.user.id,
        name: booking.user.name,
        email: booking.user.email
      },
      status: booking.status || "active",
      createdAt: booking.createdAt
    }))

    return NextResponse.json({
      bookings: formattedBookings,
      count: formattedBookings.length
    }, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    })
  } catch (error) {
    console.error("Error fetching admin bookings:", error)
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    )
  }
} 