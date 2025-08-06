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

    const { userId } = await request.json();
    const classId = params.id;

    // Find the booking
    const booking = await prisma.booking.findFirst({
      where: {
        userId: userId,
        classId: classId,
        status: 'pre_added'
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
    });

    if (!booking) {
      return NextResponse.json({ error: 'Pre-added booking not found' }, { status: 404 });
    }

    // Check if already notified using raw query
    const notifiedCheck = await prisma.$queryRaw<[{notified: boolean}]>`
      SELECT "notified" FROM "Booking" WHERE "id" = ${booking.id}
    `;
    
    if (notifiedCheck[0]?.notified) {
      return NextResponse.json({ error: 'User has already been notified' }, { status: 400 });
    }

    // Update the booking to mark as notified using raw query
    await prisma.$executeRaw`UPDATE "Booking" SET "notified" = true WHERE "id" = ${booking.id}`;

    // Here you would send the actual email notification
    // For now, we'll just log it
    console.log(`Sending pre-booking notification to ${booking.user.email} for class ${booking.class.name}`);
    
    // In a real implementation, you would use an email service like:
    // await sendPreBookingNotificationEmail({
    //   to: booking.user.email,
    //   userName: booking.user.name,
    //   className: booking.class.name,
    //   classDate: booking.class.date,
    //   classTime: booking.class.time,
    //   classLocation: booking.class.location
    // });

    return NextResponse.json({
      success: true,
      message: `Notification sent to ${booking.user.name}`
    });

  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
} 