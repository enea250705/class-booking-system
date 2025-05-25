import { NextResponse } from "next/server"
import { auth } from "@/lib/auth-middleware"

// PUT toggle class availability (admin only)
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await auth(request)

    if (!user || user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    const { enabled } = await request.json()

    // In a real app, this would update the class in the database
    // const updatedClass = await db.class.update({
    //   where: { id },
    //   data: { enabled }
    // })

    // Mock for demo
    const updatedClass = {
      id,
      name: "Morning Yoga",
      day: "Monday",
      time: "7:00 AM",
      date: new Date("2025-05-27"),
      description: "Start your day with a rejuvenating yoga session focusing on flexibility and mindfulness.",
      enabled,
      capacity: 20,
      currentBookings: 12,
      updatedAt: new Date(),
    }

    // If class was disabled, notify users with bookings
    if (enabled === false) {
      // In a real app, this would find all bookings for this class and notify users
      // const bookings = await db.booking.findMany({
      //   where: { classId: id, status: "active" },
      //   include: { user: true }
      // })
      // Send notifications to all users with active bookings
      // for (const booking of bookings) {
      //   await db.notification.create({
      //     data: {
      //       userId: booking.userId,
      //       type: "class_cancelled",
      //       message: `The class "${updatedClass.name}" on ${updatedClass.date} has been cancelled.`,
      //       read: false
      //     }
      //   })
      //
      //   // Send email notification
      //   await sendEmail({
      //     to: booking.user.email,
      //     subject: "Class Cancelled",
      //     text: `The class "${updatedClass.name}" on ${updatedClass.date} has been cancelled.`
      //   })
      // }
    }

    return NextResponse.json(updatedClass)
  } catch (error) {
    console.error(`Error toggling class ${params.id}:`, error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
