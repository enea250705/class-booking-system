import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Schema for validation
const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export async function POST(request: Request) {
  try {
    console.log("Login API route called");
    
    // Parse request body
    let body;
    try {
      body = await request.json();
      console.log("Request body parsed:", { email: body.email });
    } catch (error) {
      console.error("Failed to parse request body:", error);
      return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
    }
    
    // Validate input
    const result = loginSchema.safeParse(body);
    if (!result.success) {
      console.log("Validation failed:", result.error.errors[0].message);
      return NextResponse.json({ message: result.error.errors[0].message }, { status: 400 });
    }
    
    const { email, password } = result.data;
    
    // Find user by email
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { email }
      });
      console.log("User lookup result:", user ? "User found" : "User not found");
    } catch (dbError) {
      console.error("Database error during user lookup:", dbError);
      return NextResponse.json({ message: "Database error" }, { status: 500 });
    }
    
    if (!user) {
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
    }
    
    // Verify password
    let passwordMatch;
    try {
      passwordMatch = await bcrypt.compare(password, user.password);
      console.log("Password match:", passwordMatch);
    } catch (bcryptError) {
      console.error("Bcrypt error:", bcryptError);
      return NextResponse.json({ message: "Authentication error" }, { status: 500 });
    }
    
    if (!passwordMatch) {
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
    }
    
    // Generate JWT
    let token;
    try {
      token = jwt.sign(
        {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET || 'fallback_secret_for_development',
        { expiresIn: "7d" }
      );
      console.log("JWT generated successfully");
    } catch (jwtError) {
      console.error("JWT signing error:", jwtError);
      return NextResponse.json({ message: "Authentication error" }, { status: 500 });
    }
    
    // Set JWT as HTTP-only cookie
    const response = NextResponse.json(
      { 
        message: "Login successful",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        token 
      }, 
      { status: 200 }
    );
    
    response.cookies.set({
      name: "auth_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    
    console.log("Login successful, returning response");
    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
