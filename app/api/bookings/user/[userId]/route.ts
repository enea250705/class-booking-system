import { NextResponse } from "next/server"
import { auth } from "@/lib/auth-middleware"

// GET bookings for a specific user
export async function GET(request: Request, { params }: { params: { userId: string } }) {
  try {
    const user = await auth(request)

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { userId } = params

    // Users can only view their own bookings, admins can view any
    if (user.role !== "admin" && user.id !== userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // In a real app, this would query the database
    // const bookings = await db.booking.findMany({
    //   where: { userId },
    //   include: { class: true },
    //   orderBy: { class: { date: 'asc' } }
    // })

    // Mock for demo
    const bookings = [
      {
        id: "1",
        userId,
        classId: "1",
        bookingDate: new Date(),
        status: "active",
        class: {
          id: "1",
          name: "Morning Yoga",
          day: "Monday",
          time: "7:00 AM",
          date: new Date("2025-05-27"),
        },
      },
      {
        id: "2",
        userId,
        classId: "2",
        bookingDate: new Date(),
        status: "active",
        class: {
          id: "2",
          name: "HIIT Training",
          day: "Monday",
          time: "6:00 PM",
          date: new Date("2025-05-27"),
        },
      },
    ]

    return NextResponse.json(bookings)
  } catch (error) {
    console.error(`Error fetching bookings for user ${params.userId}:`, error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
