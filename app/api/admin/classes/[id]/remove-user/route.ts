import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from "@/lib/auth-middleware";

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await auth(request);

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookingId } = await request.json();
    const classId = params.id;

    // Get the booking details
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.classId !== classId) {
      return NextResponse.json({ error: 'Booking does not belong to this class' }, { status: 400 });
    }

    // Only refund classes for confirmed bookings, not pre-added ones
    let shouldRefundClass = booking.status === 'confirmed';
    let userPackage = null;

    if (shouldRefundClass) {
      // Get user's active package to refund the class
      userPackage = await prisma.package.findFirst({
        where: {
          userId: booking.userId,
          active: true
        }
      });

      if (!userPackage) {
        return NextResponse.json({ 
          error: 'User does not have an active package to refund class to' 
        }, { status: 400 });
      }
    }

    // Delete the booking
    await prisma.booking.delete({
      where: { id: bookingId }
    });

    // Update class booking count
    await prisma.class.update({
      where: { id: classId },
      data: {
        currentBookings: {
          decrement: 1
        }
      }
    });

    // Only refund class if it was a confirmed booking
    if (shouldRefundClass && userPackage) {
      await prisma.package.update({
        where: { id: userPackage.id },
        data: {
          classesRemaining: {
            increment: 1
          }
        }
      });
    }

    const message = shouldRefundClass 
      ? `User ${booking.user.name} removed from class and class refunded to their package`
      : `User ${booking.user.name} removed from pre-added list`;

    return NextResponse.json({
      success: true,
      message
    });

  } catch (error) {
    console.error('Error removing user from class:', error);
    return NextResponse.json({ error: 'Failed to remove user from class' }, { status: 500 });
  }
} 