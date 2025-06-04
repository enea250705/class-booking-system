import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth-middleware";

export async function DELETE(request: Request) {
  try {
    // Check for admin authentication
    const user = await auth(request);
    
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }
    
    // First, delete all bookings since they reference classes
    const bookingsDeleted = await prisma.booking.deleteMany({});
    
    // Then delete all classes
    const classesDeleted = await prisma.class.deleteMany({});
    
    return NextResponse.json({
      success: true,
      message: "All classes and associated bookings have been deleted",
      deleted: classesDeleted.count,
      bookingsDeleted: bookingsDeleted.count
    });
    
  } catch (error) {
    console.error("Error clearing classes:", error);
    return NextResponse.json(
      { error: "Failed to clear classes" },
      { status: 500 }
    );
  }
} 
 
 
 