import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth-middleware";

// This is a debug endpoint to check the database contents
// Only accessible to admins
export async function GET(request: Request) {
  try {
    const user = await auth(request);
    
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get all classes from the database
    const classes = await prisma.class.findMany({
      orderBy: [
        { date: 'asc' },
        { time: 'asc' }
      ]
    });
    
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      }
    });
    
    // Get basic stats
    const stats = {
      totalClasses: classes.length,
      totalUsers: users.length,
      adminUsers: users.filter(u => u.role === 'admin').length,
      enabledClasses: classes.filter(c => c.enabled).length,
      disabledClasses: classes.filter(c => !c.enabled).length,
    };
    
    return NextResponse.json({
      stats,
      classes,
      users,
    }, { 
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      }
    });
  } catch (error) {
    console.error("Debug API error:", error);
    return NextResponse.json(
      { error: "An error occurred", details: String(error) },
      { status: 500 }
    );
  }
} 