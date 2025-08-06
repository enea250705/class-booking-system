import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-middleware';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const user = await auth(request);
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get all bookings for this user
    const allBookings = await prisma.booking.findMany({
      where: { userId: user.id },
      include: {
        class: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate stats
    const totalClassesBooked = allBookings.length;
    const totalClassesAttended = allBookings.filter(booking => 
      booking.status === 'CONFIRMED' && new Date(booking.class.date) < new Date()
    ).length;
    const totalClassesMissed = allBookings.filter(booking => 
      booking.status === 'NO_SHOW'
    ).length;
    const totalClassesCancelled = allBookings.filter(booking => 
      booking.status === 'CANCELLED'
    ).length;

    const attendanceRate = totalClassesBooked > 0 
      ? Math.round((totalClassesAttended / (totalClassesBooked - totalClassesCancelled)) * 100)
      : 0;

    // Find favorite class time
    const timeFrequency: { [key: string]: number } = {};
    allBookings.forEach(booking => {
      const time = booking.class.time;
      timeFrequency[time] = (timeFrequency[time] || 0) + 1;
    });

    const favoriteClassTime = Object.keys(timeFrequency).length > 0
      ? Object.keys(timeFrequency).reduce((a, b) => 
          timeFrequency[a] > timeFrequency[b] ? a : b
        )
      : 'Not available';

    // Get member since date (first booking)
    const firstBooking = await prisma.booking.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' }
    });

    const memberSince = firstBooking?.createdAt || new Date();

    const stats = {
      totalClassesBooked,
      totalClassesAttended,
      totalClassesMissed,
      attendanceRate,
      favoriteClassTime,
      memberSince: memberSince.toISOString(),
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: "Failed to fetch user statistics" },
      { status: 500 }
    );
  }
} 