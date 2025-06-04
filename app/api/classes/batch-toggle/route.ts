import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth-middleware"

// POST - Toggle enabled status for multiple classes at once (admin only)
export async function POST(request: Request) {
  try {
    const user = await auth(request);
    
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const { classIds, enabled } = await request.json();
    
    // Validate input
    if (!Array.isArray(classIds) || typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: "Invalid request. Expected 'classIds' array and 'enabled' boolean" },
        { status: 400 }
      );
    }
    
    if (classIds.length === 0) {
      return NextResponse.json(
        { error: "No class IDs provided" },
        { status: 400 }
      );
    }
    
    // Maximum number of classes to update at once (to prevent abuse)
    const MAX_CLASSES = 100;
    
    if (classIds.length > MAX_CLASSES) {
      return NextResponse.json(
        { error: `Too many classes. Maximum ${MAX_CLASSES} allowed` },
        { status: 400 }
      );
    }
    
    // Update all classes in a single transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update all classes
      const updatePromises = classIds.map(classId => 
        tx.class.update({
          where: { id: classId },
          data: { enabled }
        })
      );
      
      try {
        const updated = await Promise.all(updatePromises);
        return { 
          success: true, 
          updatedCount: updated.length 
        };
      } catch (error) {
        // If any updates fail, the transaction will be rolled back
        console.error("Error updating classes:", error);
        throw new Error("Failed to update some classes");
      }
    });
    
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("Error in batch toggle:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update classes" },
      { status: 500 }
    );
  }
} 
 
 
 