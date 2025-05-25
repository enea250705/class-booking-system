import { NextResponse } from "next/server"
import { auth } from "@/lib/auth-middleware"
import { prisma } from "@/lib/prisma"

// GET a specific booking
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await auth(request)

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        class: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!booking) {
      return NextResponse.json({ message: "Booking not found" }, { status: 404 })
    }

    // Only admin or the booking owner can view it
    if (user.role !== "admin" && booking.userId !== user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json(booking)
  } catch (error) {
    console.error("Error fetching booking:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Cancel a booking (must be at least 8 hours before class)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await auth(request)

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const bookingId = params.id
    
    // Find the booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        class: true
      }
    })

    if (!booking) {
      return NextResponse.json({ message: "Booking not found" }, { status: 404 })
    }

    // Verify booking belongs to user or user is admin
    if (user.role !== "admin" && booking.userId !== user.id) {
      return NextResponse.json({ message: "You can only cancel your own bookings" }, { status: 403 })
    }

    // Check if cancellation is allowed (at least 8 hours before class)
    const classDate = new Date(booking.class.date)
    const [hours, minutes] = booking.class.time.split(':')
    classDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)
    
    const now = new Date()
    const hoursBeforeClass = (classDate.getTime() - now.getTime()) / (1000 * 60 * 60)

    if (hoursBeforeClass < 8 && user.role !== "admin") {
      return NextResponse.json({ 
        message: "Cancellation is only allowed at least 8 hours before the class starts" 
      }, { status: 400 })
    }

    // Use a transaction to ensure all operations succeed or fail together
    await prisma.$transaction(async (tx) => {
      // Delete the booking
      await tx.booking.delete({
        where: { id: bookingId }
      })

      // Decrement the class current bookings
      await tx.class.update({
        where: { id: booking.classId },
        data: { currentBookings: { decrement: 1 } }
      })

      // Increment the user's remaining classes in their package
      await tx.package.updateMany({
        where: {
          userId: booking.userId,
          active: true,
        },
        data: { classesRemaining: { increment: 1 } }
      })
    })
    
    // Return success response
    return NextResponse.json({ 
      message: "Booking cancelled successfully",
      bookingId
    })
  } catch (error) {
    console.error("Error cancelling booking:", error)
    return NextResponse.json(
      { error: "Failed to cancel booking" },
      { status: 500 }
    )
  }
} 