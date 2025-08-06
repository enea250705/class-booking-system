import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth-middleware";

export async function POST(request: Request) {
  try {
    // Check for admin authentication
    const user = await auth(request);
    
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }
    
    // Get date for one week ago
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    // Find all classes that ended before one week ago
    const pastClasses = await prisma.class.findMany({
      where: {
        date: {
          lt: oneWeekAgo
        }
      },
      select: {
        id: true,
        name: true,
        date: true,
      }
    });
    
    if (pastClasses.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No past classes found to delete",
        deleted: 0,
        bookingsDeleted: 0
      });
    }
    
    // Extract class IDs for deletion
    const classIds = pastClasses.map(cls => cls.id);
    
    // Delete bookings for these classes first (handling foreign key constraints)
    const deletedBookings = await prisma.booking.deleteMany({
      where: {
        classId: {
          in: classIds
        }
      }
    });
    
    // Delete waitlist entries for these classes
    const deletedWaitlist = await prisma.waitlist.deleteMany({
      where: {
        classId: {
          in: classIds
        }
      }
    });
    
    // Now delete the classes
    const result = await prisma.class.deleteMany({
      where: {
        id: {
          in: classIds
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${result.count} past classes`,
      deleted: result.count,
      bookingsDeleted: deletedBookings.count,
      waitlistDeleted: deletedWaitlist.count
    });
    
  } catch (error) {
    console.error("Error deleting past classes:", error);
    return NextResponse.json(
      { error: "Failed to delete past classes" },
      { status: 500 }
    );
  }
} 