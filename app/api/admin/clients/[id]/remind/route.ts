import { NextResponse } from "next/server";
import { auth } from "@/lib/auth-middleware";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { packageExpiringEmail } from "@/lib/email-templates";

// Function to calculate days remaining
function calculateDaysRemaining(endDate: Date): number {
  const now = new Date();
  const end = new Date(endDate);
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

// POST - Send a reminder to a client about expiring package
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
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

    const { id: clientId } = await params;
    
    // Get client with their active package
    const client = await prisma.user.findUnique({
      where: {
        id: clientId,
      },
      include: {
        packages: {
          where: {
            active: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    // Check if client has an active package
    if (!client.packages || client.packages.length === 0) {
      return NextResponse.json(
        { error: "Client does not have an active package" },
        { status: 400 }
      );
    }

    const activePackage = client.packages[0];
    const daysRemaining = calculateDaysRemaining(activePackage.endDate);

    // Check if package is actually expiring soon
    if (daysRemaining > 7) {
      return NextResponse.json(
        { error: "Package is not expiring soon (more than 7 days remaining)" },
        { status: 400 }
      );
    }

    // Send reminder email
    try {
      await sendEmail({
        to: client.email,
        subject: "Your GymXam Membership is Expiring Soon",
        html: packageExpiringEmail({
          name: client.name,
          packageName: activePackage.name,
          classesRemaining: activePackage.classesRemaining,
          daysRemaining,
          expirationDate: activePackage.endDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        }),
      });
    } catch (emailError) {
      console.error("Error sending reminder email:", emailError);
      return NextResponse.json(
        { error: "Failed to send reminder email" },
        { status: 500 }
      );
    }

    // Record that a reminder was sent
    await prisma.notification.create({
      data: {
        userId: clientId,
        type: "package_expiry",
        message: `Reminder sent for package expiring in ${daysRemaining} days`,
        read: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Reminder sent successfully",
    });
  } catch (error) {
    console.error("Error sending package reminder:", error);
    return NextResponse.json(
      { error: "Failed to send reminder" },
      { status: 500 }
    );
  }
} 