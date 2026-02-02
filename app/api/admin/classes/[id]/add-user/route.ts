import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from "@/lib/auth-middleware";

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await auth(request);

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, sendEmailImmediately = false, forceAdd = false } = await request.json();
    const { id: classId } = await params;

    // Check if class exists and get its details
    const classItem = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        bookings: true
      }
    });

    if (!classItem) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    // Check if class is at capacity
    if (classItem.currentBookings >= classItem.capacity) {
      return NextResponse.json({ error: 'Class is at full capacity' }, { status: 400 });
    }

    // Check if user is already booked for this class
    const existingBooking = await prisma.booking.findFirst({
      where: {
        userId: userId,
        classId: classId
      }
    });

    if (existingBooking) {
      return NextResponse.json({ error: 'User is already booked for this class' }, { status: 400 });
    }

    // For enabled classes, check if user has an active package with remaining classes
    // For disabled classes, we allow pre-adding without package validation
    // forceAdd (admin override): skip package check and allow adding anyone
    let userPackage = null;
    let bookingStatus = 'confirmed';

    if (forceAdd) {
      // Admin override: add user without package requirement (pre-add style)
      bookingStatus = 'pre_added';
    } else if (classItem.enabled) {
      // Class is enabled - require active package with remaining classes
      userPackage = await prisma.package.findFirst({
        where: {
          userId: userId,
          active: true,
          classesRemaining: {
            gt: 0
          }
        }
      });

      if (!userPackage) {
        return NextResponse.json({ 
          error: 'User does not have an active package with remaining classes. Use "Add without package" to pre-add them.' 
        }, { status: 400 });
      }
    } else {
      // Class is disabled - allow pre-adding (no package required)
      userPackage = await prisma.package.findFirst({
        where: {
          userId: userId,
          active: true
        }
      });
      bookingStatus = 'pre_added';
    }

    // Get user info for response messages
    const userInfo = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true }
    });

    // Create the booking
    const booking = await prisma.booking.create({
      data: {
        userId: userId,
        classId: classId,
        status: bookingStatus
      }
    });

    // Update the booking with notification status using raw query if needed
    if (sendEmailImmediately) {
      await prisma.$executeRaw`UPDATE "Booking" SET "notified" = true WHERE "id" = ${booking.id}`;
    }

    // Update class booking count
    await prisma.class.update({
      where: { id: classId },
      data: {
        currentBookings: {
          increment: 1
        }
      }
    });

    // Only deduct from package if class is enabled
    if (classItem.enabled && userPackage) {
      await prisma.package.update({
        where: { id: userPackage.id },
        data: {
          classesRemaining: {
            decrement: 1
          }
        }
      });
    }

    // Send confirmation email only if class is enabled
    if (classItem.enabled) {
      console.log(`Sending booking confirmation to ${userInfo?.email}`);
    } else {
      console.log(`User ${userInfo?.name} pre-added to disabled class ${classItem.name}`);
    }

    const message = classItem.enabled 
      ? `User ${userInfo?.name} added to class successfully`
      : `User ${userInfo?.name} pre-added to class. They will be notified when the class is enabled.`;

    return NextResponse.json({
      success: true,
      message,
      booking,
      isPreAdded: !classItem.enabled
    });

  } catch (error) {
    console.error('Error adding user to class:', error);
    return NextResponse.json({ error: 'Failed to add user to class' }, { status: 500 });
  }
} 