import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth-middleware";

// POST - Activate a specific package by ID
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await auth(request);
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const packageId = params.id;
    
    // Check if the package exists and belongs to the user
    const packageToActivate = await prisma.package.findFirst({
      where: {
        id: packageId,
        userId: user.id,
      },
    });
    
    if (!packageToActivate) {
      return NextResponse.json(
        { error: "Package not found" },
        { status: 404 }
      );
    }
    
    // First, deactivate any existing active packages for this user
    await prisma.package.updateMany({
      where: {
        userId: user.id,
        active: true,
      },
      data: {
        active: false,
      },
    });
    
    // Then activate the requested package
    const activatedPackage = await prisma.package.update({
      where: {
        id: packageId,
      },
      data: {
        active: true,
      },
    });
    
    // Calculate days remaining
    const now = new Date();
    const endDate = new Date(activatedPackage.endDate);
    const daysRemaining = Math.max(
      0,
      Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );
    
    console.log(`Activated package ${packageId} for user ${user.email}`);
    
    return NextResponse.json({
      package: {
        ...activatedPackage,
        daysRemaining,
      },
      message: "Package activated successfully",
    });
  } catch (error) {
    console.error("Error activating package:", error);
    return NextResponse.json(
      { error: "Failed to activate package" },
      { status: 500 }
    );
  }
} 