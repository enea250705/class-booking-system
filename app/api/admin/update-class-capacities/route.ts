import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth-middleware";

// POST - Update all classes to have capacity of 5 (admin only)
export async function POST(request: Request) {
  try {
    const user = await auth(request);

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }
    
    // Update all classes to have a capacity of 5
    const updatedClasses = await prisma.class.updateMany({
      data: {
        capacity: 5,
      },
    });

    return NextResponse.json({ 
      message: `Successfully updated ${updatedClasses.count} classes to have capacity of 5`,
      count: updatedClasses.count
    });
  } catch (error) {
    console.error("Error updating class capacities:", error);
    return NextResponse.json(
      { error: "Failed to update class capacities" },
      { status: 500 }
    );
  }
} 