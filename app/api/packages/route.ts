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

// POST - Create a new package (purchase/renewal)
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
    const packageTypes: Record<string, { name: string; totalClasses: number; days: number; price: number }> = {
      "8": { name: "8 CrossFit Classes / Month", totalClasses: 8, days: 30, price: 120 },
      "12": { name: "12 CrossFit Classes / Month", totalClasses: 12, days: 30, price: 160 }
    };
    
    if (!packageType || !(packageType in packageTypes)) {
      return NextResponse.json(
        { error: "Invalid package type" },
        { status: 400 }
      );
    }
    
    // Prevent duplicate renewals: Check if a renewal was created in the last 5 seconds
    const fiveSecondsAgo = new Date(Date.now() - 5000);
    const recentRenewal = await prisma.packageRenewal.findFirst({
      where: {
        userId: user.id,
        packageType: packageType,
        createdAt: {
          gte: fiveSecondsAgo,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (recentRenewal) {
      console.log(`Duplicate renewal attempt blocked for user ${user.email} - renewal created ${Math.round((Date.now() - recentRenewal.createdAt.getTime()) / 1000)}s ago`);
      return NextResponse.json(
        { error: "Please wait a moment before renewing again. Your package is being processed." },
        { status: 429 }
      );
    }
    
    // Get the current active package if any
    const currentPackage = await prisma.package.findFirst({
      where: {
        userId: user.id,
        active: true,
      },
      orderBy: {
        endDate: "desc",
      },
    });

    // Prevent purchasing if user has an active membership with remaining days
    if (currentPackage) {
      const currentEndDate = new Date(currentPackage.endDate);
      const now = new Date();
      const daysRemaining = Math.ceil((currentEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysRemaining > 0) {
        console.log(`Purchase blocked for user ${user.email} - active membership with ${daysRemaining} days remaining`);
        return NextResponse.json(
          { 
            error: `You already have an active membership. Please wait until it expires (${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} remaining). You can renew after ${new Date(currentEndDate).toLocaleDateString()}.` 
          },
          { status: 400 }
        );
      }
    }

    const packageDetails = packageTypes[packageType];

    // Calculate start and end dates
    let startDate = new Date();
    let endDate = new Date();

    // If user has an expired package, start from now
    if (currentPackage) {
      const currentEndDate = new Date(currentPackage.endDate);
      const now = new Date();
      
      if (currentEndDate > now) {
        // This shouldn't happen due to the check above, but just in case
        // Extend from current end date
        startDate = currentEndDate;
        endDate = new Date(startDate.getTime() + (packageDetails.days * 24 * 60 * 60 * 1000));
      } else {
        // Current package has expired, start from now
        endDate.setDate(endDate.getDate() + packageDetails.days);
      }
    } else {
      // No active package, start from now
      endDate.setDate(endDate.getDate() + packageDetails.days);
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
    
    // Track the renewal in PackageRenewal table
    await prisma.packageRenewal.create({
      data: {
        userId: user.id,
        packageId: newPackage.id,
        packageType: packageType,
        packageName: packageDetails.name,
        startDate,
        endDate,
        price: packageDetails.price,
        method: currentPackage ? "renewal" : "purchase",
      },
    });
    
    // Calculate days remaining
    const now = new Date();
    const daysRemaining = Math.max(
      0,
      Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );
    
    console.log(`Successfully created package ${newPackage.id} for user ${user.email}`);
    
    // Verify the package was created correctly
    const verifyPackage = await prisma.package.findUnique({
      where: { id: newPackage.id }
    });
    
    if (!verifyPackage) {
      throw new Error("Package verification failed after creation");
    }
    
    console.log(`Package verified successfully: ${verifyPackage.name} with ${verifyPackage.classesRemaining} classes`);
    
    return NextResponse.json({
      package: {
        ...newPackage,
        daysRemaining,
      },
      message: currentPackage ? "Package renewed successfully" : "Package purchased successfully",
    }, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
  } catch (error) {
    console.error("Error creating user package:", error);
    return NextResponse.json(
      { error: "Failed to create user package" },
      { status: 500 }
    );
  }
} 