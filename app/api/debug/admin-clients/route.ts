import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth-middleware";

// GET - Get all clients with their packages (admin only debug endpoint)
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
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });
    
    // Calculate days remaining for active packages
    const now = new Date();
    const clientsWithPackages = clients.map(client => {
      const allPackages = client.packages.map(pkg => {
        const endDate = new Date(pkg.endDate);
        const daysRemaining = Math.max(
          0,
          Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        );
        
        return {
          ...pkg,
          daysRemaining,
        };
      });
      
      // Filter to find active package
      const activePackage = allPackages.find(pkg => pkg.active);
      
      return {
        id: client.id,
        name: client.name,
        email: client.email,
        activePackage,
        allPackages,
        packageCount: allPackages.length,
        hasActivePackage: !!activePackage
      };
    });
    
    return NextResponse.json({
      clientCount: clients.length,
      clients: clientsWithPackages,
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      }
    });
  } catch (error) {
    console.error("Error in debug client packages:", error);
    return NextResponse.json(
      { error: "Failed to fetch client data", details: String(error) },
      { status: 500 }
    );
  }
} 