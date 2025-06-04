import { NextResponse } from "next/server";
import { auth } from "@/lib/auth-middleware";
import { prisma } from "@/lib/prisma";

// Function to calculate days remaining
function calculateDaysRemaining(endDate: Date): number {
  const today = new Date();
  const end = new Date(endDate);
  const diffTime = end.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}

// GET client details (admin only)
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = decodeURIComponent(params.id);
    console.log(`Admin API: Fetching client with ID: "${userId}"`);
    
    const user = await auth(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the client data
    const clientData = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        packages: {
          where: { active: true },
          select: {
            id: true,
            name: true,
            classesRemaining: true,
            totalClasses: true,
            endDate: true
          },
          take: 1
        },
        bookings: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            class: true
          }
        }
      }
    });

    if (!clientData) {
      console.log(`Admin API: Client not found with ID: "${userId}"`);
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Format the response
    return NextResponse.json({
      client: {
        id: clientData.id,
        name: clientData.name,
        email: clientData.email,
        package: clientData.packages.length > 0 ? {
          id: clientData.packages[0].id,
          name: clientData.packages[0].name,
          classesRemaining: clientData.packages[0].classesRemaining,
          totalClasses: clientData.packages[0].totalClasses,
          endDate: clientData.packages[0].endDate
        } : null,
        recentBookings: clientData.bookings.map(booking => ({
          id: booking.id,
          classId: booking.classId,
          status: booking.status || 'active',
          createdAt: booking.createdAt,
          class: {
            id: booking.class.id,
            name: booking.class.name,
            date: booking.class.date,
            time: booking.class.time,
            day: booking.class.day
          }
        }))
      }
    }, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
  } catch (error) {
    console.error("Admin API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch client details" },
      { status: 500 }
    );
  }
} 