import { NextResponse } from "next/server"
import { auth } from "@/lib/auth-middleware"
import { db } from "@/lib/db"
import { sendEmail } from "@/lib/email"

// PUT toggle class availability (admin only)
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await auth(request)

    if (!user || user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    const { enabled } = await request.json()

    // Update the class in the database
    const updatedClass = await db.class.update({
      where: { id },
      data: { enabled }
    })

    // If class was disabled, notify users with bookings
    if (enabled === false) {
      // Find all bookings for this class
      const classBookings = await db.booking.findMany({
        where: { classId: id, status: "active" },
        include: { user: true }
      })
      
      // Send notifications to all users with active bookings
      if (classBookings.length > 0) {
        for (const booking of classBookings) {
          // Create in-app notification
          await db.notification.create({
            data: {
              userId: booking.userId,
              type: "class_cancelled",
              message: `The class "${updatedClass.name}" on ${updatedClass.date} has been cancelled.`,
              read: false
            }
          })

          // Send email notification
          await sendEmail({
              to: booking.user.email,
              subject: "Class Cancelled",
              text: `The class "${updatedClass.name}" on ${new Date(updatedClass.date).toLocaleDateString()} has been cancelled.`,
              html: ""
          })
        }
      }
    }

    return NextResponse.json(updatedClass)
  } catch (error) {
    console.error(`Error toggling class ${params.id}:`, error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
