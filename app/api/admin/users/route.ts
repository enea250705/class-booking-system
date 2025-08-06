import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from "@/lib/auth-middleware";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const user = await auth(request);

    if (!user || user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');

    // Get users with their package information
    const users = await prisma.user.findMany({
      where: {
        role: 'user',
        approved: true,
        // Exclude users who already have bookings for this class (if classId provided)
        ...(classId && {
          bookings: {
            none: {
              classId: classId
            }
          }
        })
      },
      select: {
        id: true,
        name: true,
        email: true,
        packages: {
          where: {
            active: true
          },
          select: {
            id: true,
            name: true,
            classesRemaining: true,
            totalClasses: true,
            endDate: true
          },
          orderBy: {
            endDate: 'desc'
          },
          take: 1
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Transform the data to match the expected format
    const transformedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      remainingClasses: user.packages[0]?.classesRemaining || 0,
      expirationDate: user.packages[0]?.endDate || new Date().toISOString(),
      packageType: user.packages[0]?.name || 'No Active Package'
    }));

    return NextResponse.json({ users: transformedUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
} 