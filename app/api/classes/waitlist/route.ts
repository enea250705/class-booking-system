import { NextResponse } from "next/server"
import { auth } from "@/lib/auth-middleware"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { Waitlist, User } from "@prisma/client"

// Define type for waitlist entries with included user data
type WaitlistWithUser = Waitlist & {
  user: Pick<User, 'id' | 'name' | 'email'>;
}

const waitlistSchema = z.object({
  classId: z.string(),
});

// POST - Join waitlist for a class
export async function POST(request: Request) {
  try {
    const user = await auth(request)

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const data = await request.json()
    const result = waitlistSchema.safeParse(data)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      )
    }

    const { classId } = result.data

    // Get the class information
    const classInfo = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        waitlist: {
          orderBy: { position: 'desc' },
          take: 1
        }
      }
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
        { error: "This class is not available" },
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

    // Check if user already in the waitlist
    const existingWaitlist = await prisma.waitlist.findFirst({
      where: {
        userId: user.id,
        classId,
      },
    })

    if (existingWaitlist) {
      return NextResponse.json(
        { error: "You are already on the waitlist for this class" },
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
        { error: "You need an active package with remaining classes" },
        { status: 400 }
      )
    }

    // Get next position in waitlist
    const highestPosition = classInfo.waitlist[0]?.position || 0
    const nextPosition = highestPosition + 1

    // Add user to waitlist
    const waitlistEntry = await prisma.waitlist.create({
      data: {
        userId: user.id,
        classId,
        position: nextPosition
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        class: {
          select: {
            name: true,
            date: true,
            time: true
          }
        }
      }
    })

    // Create notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "waitlist_joined",
        message: `You've been added to the waitlist for ${classInfo.name} on ${classInfo.date.toLocaleDateString()} at ${classInfo.time}. Your position: ${nextPosition}.`,
      }
    })

    return NextResponse.json({
      message: "Successfully added to waitlist",
      position: nextPosition,
      waitlistEntry
    })
  } catch (error) {
    console.error("Error joining waitlist:", error)
    return NextResponse.json(
      { error: "Failed to join waitlist" },
      { status: 500 }
    )
  }
}

// GET - View current waitlist status for a class
export async function GET(request: Request) {
  try {
    const user = await auth(request)

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const url = new URL(request.url)
    const classId = url.searchParams.get('classId')

    if (!classId) {
      return NextResponse.json(
        { error: "Class ID is required" },
        { status: 400 }
      )
    }

    // Get the class information
    const classInfo = await prisma.class.findUnique({
      where: { id: classId },
      select: {
        id: true,
        name: true,
        date: true,
        time: true,
        capacity: true,
        currentBookings: true,
      }
    })

    if (!classInfo) {
      return NextResponse.json(
        { error: "Class not found" },
        { status: 404 }
      )
    }

    // Get user's position on waitlist if they're on it
    const userWaitlistEntry = await prisma.waitlist.findFirst({
      where: {
        userId: user.id,
        classId,
      }
    })

    // Get total people on waitlist
    const waitlistCount = await prisma.waitlist.count({
      where: { classId }
    })

    // Admin can see all waitlist entries
    let waitlistEntries: WaitlistWithUser[] = []
    if (user.role === "admin") {
      waitlistEntries = await prisma.waitlist.findMany({
        where: { classId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { position: 'asc' }
      }) as WaitlistWithUser[]
    }

    return NextResponse.json({
      class: classInfo,
      userWaitlistStatus: userWaitlistEntry 
        ? { position: userWaitlistEntry.position, joinedAt: userWaitlistEntry.createdAt }
        : null,
      waitlistCount,
      waitlistEntries: user.role === "admin" ? waitlistEntries : undefined
    })
  } catch (error) {
    console.error("Error fetching waitlist:", error)
    return NextResponse.json(
      { error: "Failed to fetch waitlist" },
      { status: 500 }
    )
  }
} 