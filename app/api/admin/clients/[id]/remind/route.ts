import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth-middleware";

// POST - Send a reminder to a client about expiring package
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await auth(request);
    
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const clientId = params.id;
    
    // Find the client
    const client = await prisma.user.findUnique({
      where: { id: clientId },
      include: {
        packages: {
          where: {
            active: true,
          },
          orderBy: {
            endDate: "desc",
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
    
    if (!client.packages || client.packages.length === 0) {
      return NextResponse.json(
        { error: "Client has no active package" },
        { status: 400 }
      );
    }
    
    const activePackage = client.packages[0];
    
    // Calculate days remaining
    const now = new Date();
    const endDate = new Date(activePackage.endDate);
    const daysRemaining = Math.max(
      0,
      Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );
    
    if (daysRemaining > 7) {
      return NextResponse.json(
        { error: "Package is not expiring soon (more than 7 days remaining)" },
        { status: 400 }
      );
    }
    
    // In a real app, this would send an email to the client
    // For now, we'll just log the message
    console.log(`REMINDER: Sending package expiry reminder to ${client.email}. Package expires in ${daysRemaining} days.`);
    
    // Record this reminder in the database (if you had a notifications table)
    /* 
    await prisma.notification.create({
      data: {
        userId: clientId,
        type: "package_expiring",
        message: `Your ${activePackage.name} package will expire in ${daysRemaining} days. Renew now to continue booking classes.`,
        read: false,
      },
    });
    */
    
    return NextResponse.json({
      message: "Reminder sent successfully",
      client: {
        name: client.name,
        email: client.email,
      },
      package: {
        name: activePackage.name,
        daysRemaining,
      },
    });
  } catch (error) {
    console.error("Error sending reminder:", error);
    return NextResponse.json(
      { error: "Failed to send reminder" },
      { status: 500 }
    );
  }
} 