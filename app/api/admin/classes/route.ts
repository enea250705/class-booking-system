import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const classes = await prisma.class.findMany({
      include: {
        bookings: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      },
      orderBy: {
        date: 'asc'
      }
    });

    // Ensure currentBookings matches actual booking count and sync database if needed
    const classesWithBookingCounts = await Promise.all(classes.map(async (classItem) => {
      const actualBookingCount = classItem.bookings.length;
      
      // If database currentBookings doesn't match actual count, update it
      if (classItem.currentBookings !== actualBookingCount) {
        await prisma.class.update({
          where: { id: classItem.id },
          data: { currentBookings: actualBookingCount }
        });
      }
      
      return {
        ...classItem,
        currentBookings: actualBookingCount
      };
    }));

    return NextResponse.json(classesWithBookingCounts);
  } catch (error) {
    console.error('Error fetching classes:', error);
    return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 });
  }
} 