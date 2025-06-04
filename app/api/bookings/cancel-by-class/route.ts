import { NextResponse } from "next/server"
import { auth } from "@/lib/auth-middleware"
import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/email"

// POST - Cancel a booking by class ID
export async function POST(request: Request) {
  try {
    const user = await auth(request)

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { classId } = await request.json()

    if (!classId) {
      return NextResponse.json(
        { error: "Class ID is required" },
        { status: 400 }
      )
    }

    // Find the booking for this user and class
    const booking = await prisma.booking.findFirst({
      where: {
        userId: user.id,
        classId,
        class: {
          date: {
            gte: new Date()
          }
        }
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
      }
    })

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found for this class" },
        { status: 404 }
      )
    }

    // Check if cancellation is allowed (at least 8 hours before class)
    const classDate = new Date(booking.class.date)
    const [hours, minutes] = booking.class.time.split(':')
    classDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)
    
    const now = new Date()
    const hoursBeforeClass = (classDate.getTime() - now.getTime()) / (1000 * 60 * 60)

    if (hoursBeforeClass < 8 && user.role !== "admin") {
      return NextResponse.json({ 
        error: "Cancellation is only allowed at least 8 hours before the class starts" 
      }, { status: 400 })
    }

    // Use a transaction to ensure all operations succeed or fail together
    await prisma.$transaction(async (tx) => {
      // Delete the booking
      await tx.booking.delete({
        where: { id: booking.id }
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
    
    // Format date for the email
    const formattedDate = new Date(booking.class.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    // Send cancellation confirmation email
    await sendEmail({
      to: user.email,
      subject: "Your GymXam Class Booking Has Been Cancelled",
      text: `
Dear ${user.name},

Your booking for ${booking.class.name} on ${formattedDate} at ${booking.class.time} has been successfully cancelled.

A class credit has been returned to your account.

Thank you for using GymXam!

Best regards,
The GymXam Team
      `,
      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>Class Booking Cancelled</h2>
  
  <p>Dear ${user.name},</p>
  
  <p>Your booking for <strong>${booking.class.name}</strong> on ${formattedDate} at ${booking.class.time} has been successfully cancelled.</p>
  
  <p>A class credit has been returned to your account.</p>
  
  <p>Thank you for using GymXam!</p>
  
  <p>Best regards,<br>
  The GymXam Team</p>
</div>
      `
    })
    
    // Return success response
    return NextResponse.json({ 
      message: "Booking cancelled successfully",
      classId,
      bookingId: booking.id
    })
  } catch (error) {
    console.error("Error cancelling booking:", error)
    return NextResponse.json(
      { error: "Failed to cancel booking", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
} 