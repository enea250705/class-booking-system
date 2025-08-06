import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth-middleware';

export async function GET(request: Request) {
  try {
    const user = await auth(request);
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get booking history for this user
    const bookingHistory = await prisma.booking.findMany({
      where: { userId: user.id },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            date: true,
            time: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to last 50 bookings
    });

    // Format the response
    const formattedHistory = bookingHistory.map(booking => ({
      id: booking.id,
      className: booking.class.name,
      date: booking.class.date.toISOString(),
      time: booking.class.time,
      status: booking.status === 'CONFIRMED' 
        ? (new Date(booking.class.date) < new Date() ? 'completed' : 'upcoming')
        : booking.status === 'CANCELLED' 
        ? 'cancelled' 
        : 'no-show'
    }));

    return NextResponse.json(formattedHistory);

  } catch (error) {
    console.error('Error fetching booking history:', error);
    return NextResponse.json(
      { error: "Failed to fetch booking history" },
      { status: 500 }
    );
  }
} 