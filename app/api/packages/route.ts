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
    
    let packageType: string;
    try {
      const body = await request.json();
      packageType = body.packageType;
      console.log(`Creating package of type: ${packageType} for user: ${user.email}`);
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return NextResponse.json(
        { error: "Invalid request body", message: parseError instanceof Error ? parseError.message : String(parseError) },
        { status: 400 }
      );
    }
    
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
    // This check works for both first-time purchases and renewals
    const fiveSecondsAgo = new Date(Date.now() - 5000);
    const recentRenewal = await prisma.packageRenewal.findFirst({
      where: {
        userId: user.id,
        packageType: packageType,
        renewedAt: {
          gte: fiveSecondsAgo,
        },
      },
      orderBy: {
        renewedAt: "desc",
      },
    });

    if (recentRenewal) {
      console.log(`Duplicate purchase/renewal attempt blocked for user ${user.email} - renewal created ${Math.round((Date.now() - recentRenewal.renewedAt.getTime()) / 1000)}s ago`);
      return NextResponse.json(
        { error: "Please wait a moment before purchasing again. Your package is being processed." },
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

    // Prevent purchasing if user has an active membership with remaining days AND classes
    // Allow renewal if:
    // 1. Classes remaining is 0 (even if days remain)
    // 2. Days remaining is 0 (membership expired, even if classes remain)
    // 3. Days remaining <= 3 (membership expiring soon, allow early renewal)
    if (currentPackage) {
      const currentEndDate = new Date(currentPackage.endDate);
      const now = new Date();
      const daysRemaining = Math.ceil((currentEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      // Block only if days remaining > 3 AND classes remain
      // Allow renewal if:
      // - daysRemaining <= 3 (expiring soon)
      // - daysRemaining <= 0 (expired)
      // - classesRemaining === 0 (exhausted)
      if (daysRemaining > 3 && currentPackage.classesRemaining > 0) {
        console.log(`Purchase blocked for user ${user.email} - active membership with ${daysRemaining} days and ${currentPackage.classesRemaining} classes remaining`);
        return NextResponse.json(
          { 
            error: `You already have an active membership. Please wait until it expires (${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} remaining). You can renew after ${new Date(currentEndDate).toLocaleDateString()}.` 
          },
          { status: 400 }
        );
      }
      
      // Allow renewal if days <= 3 (expiring soon)
      if (daysRemaining <= 3 && daysRemaining > 0) {
        console.log(`Allowing renewal for user ${user.email} - membership expiring soon (${daysRemaining} days remaining)`);
      }
      
      // Allow renewal if classes are 0 (user has used all their classes)
      if (daysRemaining > 0 && currentPackage.classesRemaining === 0) {
        console.log(`Allowing renewal for user ${user.email} - 0 classes remaining but ${daysRemaining} days remaining`);
      }
      
      // Allow renewal if days are 0 (membership expired)
      if (daysRemaining <= 0) {
        console.log(`Allowing renewal for user ${user.email} - membership expired (${daysRemaining} days remaining)`);
      }
    }

    const packageDetails = packageTypes[packageType];

    // Calculate start and end dates
    const now = new Date();
    let startDate = new Date(now);
    let endDate = new Date(now);

    // If user has a current package, determine how to extend it
    if (currentPackage) {
      const currentEndDate = new Date(currentPackage.endDate);
      const daysRemaining = Math.ceil((currentEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      console.log(`Renewal calculation for user ${user.email}:`);
      console.log(`  Current end date: ${currentEndDate.toISOString()}`);
      console.log(`  Current time: ${now.toISOString()}`);
      console.log(`  Days remaining: ${daysRemaining}`);
      console.log(`  Classes remaining: ${currentPackage.classesRemaining}`);
      
      if (currentEndDate > now) {
        // Package hasn't expired yet - extend from current end date
        startDate = new Date(currentEndDate);
        endDate = new Date(startDate.getTime() + (packageDetails.days * 24 * 60 * 60 * 1000));
        console.log(`  Extending from current end date: ${startDate.toISOString()} to ${endDate.toISOString()}`);
      } else {
        // Package has expired (0 or negative days) - start fresh from now
        endDate = new Date(now.getTime() + (packageDetails.days * 24 * 60 * 60 * 1000));
        console.log(`  Package expired, starting fresh from now: ${startDate.toISOString()} to ${endDate.toISOString()}`);
      }
    } else {
      // No active package - this is a first-time purchase
      // Start from now and add the package duration
      endDate = new Date(now.getTime() + (packageDetails.days * 24 * 60 * 60 * 1000));
      console.log(`  First-time purchase for user ${user.email}, starting from now: ${startDate.toISOString()} to ${endDate.toISOString()}`);
      console.log(`  Package will be valid for ${packageDetails.days} days with ${packageDetails.totalClasses} classes`);
    }
    
    // First, deactivate any existing active packages for this user
    const deactivatedCount = await prisma.package.updateMany({
      where: {
        userId: user.id,
        active: true,
      },
      data: {
        active: false,
      },
    });
    
    console.log(`Deactivated ${deactivatedCount.count} existing package(s) for user ${user.email}`);
    
    // Create the new package
    let newPackage;
    try {
      newPackage = await prisma.package.create({
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
      console.log(`Package created successfully with ID: ${newPackage.id}`);
    } catch (packageError) {
      console.error("Error creating package:", packageError);
      throw new Error(`Failed to create package: ${packageError instanceof Error ? packageError.message : String(packageError)}`);
    }
    
    // Track the renewal in PackageRenewal table
    try {
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
      console.log(`PackageRenewal record created successfully for package ${newPackage.id}`);
    } catch (renewalError) {
      // Log the error but don't fail the whole operation if renewal tracking fails
      console.error("Error creating PackageRenewal record (non-critical):", renewalError);
      // Continue - the package was created successfully
    }
    
    // Calculate days remaining
    const finalNow = new Date();
    const daysRemaining = Math.max(
      0,
      Math.ceil((endDate.getTime() - finalNow.getTime()) / (1000 * 60 * 60 * 24))
    );
    
    console.log(`Successfully created package ${newPackage.id} for user ${user.email}`);
    console.log(`  Package name: ${newPackage.name}`);
    console.log(`  Start date: ${newPackage.startDate.toISOString()}`);
    console.log(`  End date: ${newPackage.endDate.toISOString()}`);
    console.log(`  Classes: ${newPackage.classesRemaining}/${newPackage.totalClasses}`);
    console.log(`  Days remaining: ${daysRemaining}`);
    
    // Verify the package was created correctly
    const verifyPackage = await prisma.package.findUnique({
      where: { id: newPackage.id }
    });
    
    if (!verifyPackage) {
      throw new Error("Package verification failed after creation");
    }
    
    console.log(`Package verified successfully: ${verifyPackage.name} with ${verifyPackage.classesRemaining} classes and ${daysRemaining} days remaining`);
    
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error details:", {
      message: errorMessage,
      stack: errorStack,
      error: error
    });
    
    // Always return error details to help with debugging
    return NextResponse.json(
      { 
        error: "Failed to create user package",
        message: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { stack: errorStack })
      },
      { status: 500 }
    );
  }
} 