import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth-middleware";

// GET - Get all clients with their packages (admin only)
export async function GET(request: Request) {
  try {
    const user = await auth(request);
    
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get all users with role 'user'
    const clients = await prisma.user.findMany({
      where: {
        role: "user",
      },
      select: {
        id: true,
        name: true,
        email: true,
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
    
    // Calculate days remaining for active packages
    const now = new Date();
    const clientsWithFormattedPackages = clients.map(client => {
      let packageInfo = null;
      
      if (client.packages && client.packages.length > 0) {
        const activePackage = client.packages[0];
        const endDate = new Date(activePackage.endDate);
        const daysRemaining = Math.max(
          0,
          Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        );
        
        packageInfo = {
          ...activePackage,
          daysRemaining,
        };
      }
      
      return {
        id: client.id,
        name: client.name,
        email: client.email,
        package: packageInfo,
      };
    });
    
    return NextResponse.json(clientsWithFormattedPackages);
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 }
    );
  }
} 