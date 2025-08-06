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
    
    console.log(`Found ${clients.length} clients`);
    
    // Calculate days remaining for active packages
    const now = new Date();
    const clientsWithFormattedPackages = clients.map(client => {
      let packageInfo = null;
      
      if (client.packages && client.packages.length > 0) {
        const activePackage = client.packages[0];
        console.log(`Client ${client.email} has active package: ${activePackage.name}`);
        
        const endDate = new Date(activePackage.endDate);
        const daysRemaining = Math.max(
          0,
          Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        );
        
        packageInfo = {
          id: activePackage.id,
          name: activePackage.name,
          classesRemaining: activePackage.classesRemaining,
          totalClasses: activePackage.totalClasses,
          endDate: activePackage.endDate,
          active: activePackage.active,
          daysRemaining,
        };
      } else {
        console.log(`Client ${client.email} has no active package`);
      }
      
      return {
        id: client.id,
        name: client.name,
        email: client.email,
        package: packageInfo,
      };
    });
    
    return NextResponse.json(clientsWithFormattedPackages, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      }
    });
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json(
      { error: "Failed to fetch clients", details: String(error) },
      { status: 500 }
    );
  }
} 