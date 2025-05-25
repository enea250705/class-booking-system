import { NextResponse } from "next/server"
import { auth } from "@/lib/auth-middleware"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { sendEmail } from "@/lib/email"

const bookingSchema = z.object({
  classId: z.string(),
});

// GET all bookings for the current user
export async function GET(request: Request) {
  try {
    const user = await auth(request)

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Fetch all bookings for the current user
    const bookings = await prisma.booking.findMany({
      where: {
        userId: user.id,
        // Only include active bookings for classes in the future
        class: {
          date: {
            gte: new Date()
          },
          enabled: true
        }
      },
      include: {
        class: true
      },
      orderBy: {
        class: {
          date: 'asc'
        }
      }
    })

    return NextResponse.json(bookings)
  } catch (error) {
    console.error("Error fetching bookings:", error)
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    )
  }
}

// POST create a new booking
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

    // Get the class information
    const classInfo = await prisma.class.findUnique({
      where: { id: classId },
    })

    if (!classInfo) {
      return NextResponse.json(
        { error: "Class not found" },
        { status: 404 }
      )
    }
    
    // Check if class is enabled
    if (!classInfo.enabled) {
      return NextResponse.json(
        { error: "This class is not available for booking" },
        { status: 400 }
      )
    }

    // Check if class is full
    if (classInfo.currentBookings >= classInfo.capacity) {
      return NextResponse.json(
        { error: "This class is fully booked" },
        { status: 400 }
      )
    }

    // Check if user already has a booking for this class
    const existingBooking = await prisma.booking.findFirst({
      where: {
        userId: user.id,
        classId,
      },
    })

    if (existingBooking) {
      return NextResponse.json(
        { error: "You have already booked this class" },
        { status: 400 }
      )
    }

    // Check if user has an active package with remaining classes
    const userPackage = await prisma.package.findFirst({
      where: {
        userId: user.id,
        active: true,
        classesRemaining: { gt: 0 },
        endDate: { gte: new Date() },
      },
    })
    
    if (!userPackage) {
      return NextResponse.json(
        { error: "You need an active package with remaining classes to book" },
        { status: 400 }
      )
    }
    
    // Start a transaction to create booking, decrement classes remaining, and update class capacity
    const booking = await prisma.$transaction(async (tx) => {
    // Create the booking
      const newBooking = await tx.booking.create({
        data: {
      userId: user.id,
      classId,
        },
      })
      
      // Update the class's current bookings
      await tx.class.update({
        where: { id: classId },
        data: {
          currentBookings: {
            increment: 1,
          },
        },
      })
      
      // Decrement the user's remaining classes
      await tx.package.update({
        where: { id: userPackage.id },
        data: {
          classesRemaining: {
            decrement: 1,
          },
        },
      })
      
      return newBooking
    })

    // Format date and time for email using native JavaScript
    const classDate = new Date(classInfo.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Send booking confirmation email
    await sendEmail({
      to: user.email,
      subject: "Your GymXam Class Booking Confirmation",
      text: `Thank you for booking ${classInfo.name}!
      
Class Details:
- Class: ${classInfo.name}
- Date: ${classDate}
- Time: ${classInfo.time}
- Classes Remaining: ${userPackage.classesRemaining - 1}

You can cancel this booking up to 8 hours before the class starts.
      
Thank you for choosing GymXam!`,
      html: `
        <h2>Thank you for booking ${classInfo.name}!</h2>
        <p>Your class has been successfully booked.</p>
        
        <h3>Class Details:</h3>
        <ul>
          <li><strong>Class:</strong> ${classInfo.name}</li>
          <li><strong>Date:</strong> ${classDate}</li>
          <li><strong>Time:</strong> ${classInfo.time}</li>
          <li><strong>Classes Remaining:</strong> ${userPackage.classesRemaining - 1}</li>
        </ul>
        
        <p>You can cancel this booking up to 8 hours before the class starts.</p>
        
        <p>Thank you for choosing GymXam!</p>
      `
    });

    return NextResponse.json(booking, { status: 201 })
  } catch (error) {
    console.error("Error creating booking:", error)
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    )
  }
}
