import { NextResponse } from "next/server";
import { auth } from "@/lib/auth-middleware";
import prisma from "@/lib/prisma";
import { addDays } from "date-fns";
import { sendEmail } from "@/lib/email";
import { packageAssignedEmail } from "@/lib/email-templates";

// Define valid package types
type PackageType = 'starter' | 'basic' | 'premium';

// POST - Assign a package to a client (admin only)
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user is authenticated and is an admin
    const user = await auth(request);
    
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const clientId = params.id;
    
    // Get request body
    const body = await request.json();
    const packageType = body.packageType as PackageType;
    
    if (!packageType) {
      return NextResponse.json(
        { error: "Package type is required" },
        { status: 400 }
      );
    }

    // Get client
    const client = await prisma.user.findUnique({
      where: {
        id: clientId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        packages: {
          where: {
            active: true,
          },
          select: {
            id: true,
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    // Deactivate existing packages
    if (client.packages.length > 0) {
      await prisma.package.updateMany({
        where: {
          userId: clientId,
          active: true,
        },
        data: {
          active: false,
        },
      });
    }

    // Define package details
    const packageDetails = {
      starter: {
        name: "Starter Package: 4 Classes",
        totalClasses: 4,
        durationDays: 30,
      },
      basic: {
        name: "Basic Package: 8 Classes",
        totalClasses: 8,
        durationDays: 30,
      },
      premium: {
        name: "Premium Package: 12 Classes",
        totalClasses: 12,
        durationDays: 30,
      },
    };

    // Check if package type is valid
    if (!packageDetails[packageType]) {
      return NextResponse.json(
        { error: "Invalid package type" },
        { status: 400 }
      );
    }

    const startDate = new Date();
    const endDate = addDays(startDate, packageDetails[packageType].durationDays);
    const totalClasses = packageDetails[packageType].totalClasses;

    // Create new package
    const newPackage = await prisma.package.create({
      data: {
        userId: clientId,
        name: packageDetails[packageType].name,
        startDate,
        endDate,
        totalClasses,
        classesRemaining: totalClasses,
        active: true,
      },
    });

    // Track the package assignment in PackageRenewal table
    await prisma.packageRenewal.create({
      data: {
        userId: clientId,
        packageId: newPackage.id,
        packageType: packageType,
        packageName: packageDetails[packageType].name,
        startDate,
        endDate,
        price: 0, // Admin assigned packages are free
        method: "admin_assigned",
      },
    });

    // Send email notification
    try {
      await sendEmail({
        to: client.email,
        subject: "Your New GymXam Membership Package",
        html: packageAssignedEmail({
          name: client.name,
          packageName: packageDetails[packageType].name,
          totalClasses,
          validUntil: endDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        }),
      });
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      // Continue with the process even if email fails
    }

    return NextResponse.json({
      success: true,
      message: "Package assigned successfully",
      package: newPackage,
    });
  } catch (error) {
    console.error("Error assigning package:", error);
    return NextResponse.json(
      { error: "Failed to assign package" },
      { status: 500 }
    );
  }
} 