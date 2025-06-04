import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth-middleware";

// This is a debug endpoint to check all packages for the current user
export async function GET(request: Request) {
  try {
    const user = await auth(request);
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get all packages for the current user
    const packages = await prisma.package.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    // Calculate days remaining for each package
    const now = new Date();
    const packagesWithDaysRemaining = packages.map(pkg => {
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
    
    // Get basic user info
    const userInfo = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    
    return NextResponse.json({
      user: userInfo,
      packages: packagesWithDaysRemaining,
      activePackage: packagesWithDaysRemaining.find(pkg => pkg.active),
      stats: {
        totalPackages: packages.length,
        activePackages: packages.filter(pkg => pkg.active).length,
        expiredPackages: packages.filter(pkg => new Date(pkg.endDate) < now).length,
      }
    }, { 
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      }
    });
  } catch (error) {
    console.error("Debug user packages API error:", error);
    return NextResponse.json(
      { error: "An error occurred", details: String(error) },
      { status: 500 }
    );
  }
} 