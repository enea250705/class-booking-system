import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth-middleware";

// GET user's active package
export async function GET(request: Request) {
  try {
    const user = await auth(request);
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    console.log(`Fetching active package for user: ${user.email}`);
    
    // Find the user's active package
    const userPackage = await prisma.package.findFirst({
      where: {
        userId: user.id,
        active: true,
      },
      orderBy: {
        endDate: "desc",
      },
    });
    
    if (!userPackage) {
      console.log(`No active package found for user: ${user.email}`);
      return NextResponse.json({ package: null }, {
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
    }
    
    // Calculate days remaining
    const now = new Date();
    const endDate = new Date(userPackage.endDate);
    const daysRemaining = Math.max(
      0,
      Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );
    
    console.log(`Found active package for user ${user.email}: ${userPackage.name}, ${userPackage.classesRemaining}/${userPackage.totalClasses} classes remaining`);
    
    return NextResponse.json({
      package: {
        ...userPackage,
        daysRemaining,
      },
    }, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
  } catch (error) {
    console.error("Error fetching user package:", error);
    return NextResponse.json(
      { error: "Failed to fetch user package" },
      { status: 500 }
    );
  }
}

// POST - Create a new package (purchase)
export async function POST(request: Request) {
  try {
    const user = await auth(request);
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const { packageType } = await request.json();
    console.log(`Creating package of type: ${packageType} for user: ${user.email}`);
    
    // Define package types
    const packageTypes: Record<string, { name: string; totalClasses: number; days: number }> = {
      "8": { name: "8 CrossFit Classes / Month", totalClasses: 8, days: 30 },
      "12": { name: "12 CrossFit Classes / Month", totalClasses: 12, days: 30 }
    };
    
    if (!packageType || !(packageType in packageTypes)) {
      return NextResponse.json(
        { error: "Invalid package type" },
        { status: 400 }
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
    
    const packageDetails = packageTypes[packageType];
    
    // Calculate start and end dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + packageDetails.days);
    
    // Create the new package
    const newPackage = await prisma.package.create({
      data: {
        userId: user.id,
        name: packageDetails.name,
        totalClasses: packageDetails.totalClasses,
        classesRemaining: packageDetails.totalClasses,
        startDate,
        endDate,
        active: true,
      },
    });
    
    // Calculate days remaining
    const daysRemaining = packageDetails.days;
    
    console.log(`Successfully created package ${newPackage.id} for user ${user.email}`);
    
    // Verify the package was created correctly
    const verifyPackage = await prisma.package.findUnique({
      where: { id: newPackage.id }
    });
    
    if (verifyPackage) {
      console.log(`Verified new package is active: ${verifyPackage.active}`);
    } else {
      console.warn(`WARNING: Could not verify package ${newPackage.id}`);
    }
    
    return NextResponse.json({
      package: {
        ...newPackage,
        daysRemaining,
      },
    }, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
  } catch (error) {
    console.error("Error creating package:", error);
    return NextResponse.json(
      { error: "Failed to create package" },
      { status: 500 }
    );
  }
} 