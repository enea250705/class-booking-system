import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from "@/lib/auth-middleware";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await auth(request);

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const classId = params.id;

    // Get all pre-added users for this class
    const preAddedBookings = await prisma.booking.findMany({
      where: {
        classId: classId,
        status: 'pre_added'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get notification status for each booking using raw query
    const bookingIds = preAddedBookings.map(b => b.id);
    const notificationStatuses = bookingIds.length > 0 
      ? await prisma.$queryRaw<{id: string, notified: boolean}[]>`
          SELECT "id", "notified" FROM "Booking" WHERE "id" = ANY(${bookingIds})
        `
      : [];

    const users = preAddedBookings.map(booking => {
      const notificationStatus = notificationStatuses.find(n => n.id === booking.id);
      return {
        id: booking.user.id,
        name: booking.user.name || 'Unknown',
        email: booking.user.email,
        avatar: booking.user.image,
        addedAt: booking.createdAt.toISOString(),
        notified: notificationStatus?.notified || false
      };
    });

    return NextResponse.json({
      success: true,
      users
    });

  } catch (error) {
    console.error('Error fetching pre-added users:', error);
    return NextResponse.json({ error: 'Failed to fetch pre-added users' }, { status: 500 });
  }
} 