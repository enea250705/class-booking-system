import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth-middleware";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    // Authenticate the request (optional, but recommended for security)
    const authenticatedUser = await auth(request);
    
    // Get the user ID from the path
    const userId = params.id;
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }
    
    // Fetch the user from the database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        approved: true,
        createdAt: true,
        updatedAt: true
      },
    });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Return the user data
    return NextResponse.json(
      { 
        user: {
          id: user.id,
          name: user.name || 'User',
          email: user.email,
          role: user.role
        }
      },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'private, max-age=60',
        }
      }
    );
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 