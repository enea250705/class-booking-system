import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import { User } from "@/lib/types"
import { auth } from '@/lib/auth-middleware'
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    // Get the user from the auth middleware
    const user = await auth(request)
    
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    
    // Generate a fresh token to extend the session
        const token = jwt.sign(
          {
        userId: user.id,
        role: user.role,
            iat: Math.floor(Date.now() / 1000)
          },
          process.env.JWT_SECRET || 'fallback_secret_for_development',
          { 
            expiresIn: "365d",
            algorithm: "HS256"
          }
    )
    
    // Try to get more detailed user info from the database
    const detailedUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    })
    
    // Response with fresh token and user data
    const response = NextResponse.json({ 
      user: detailedUser || user,
      token,
      valid: true
    })
        
    // Set a fresh cookie with the new token
        response.cookies.set({
          name: "auth_token",
          value: token,
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
          path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    })
        
    // Also set a session cookie as a backup
        response.cookies.set({
          name: "auth_session",
      value: user.id,
      httpOnly: false, // Allow JS access for recovery
          secure: process.env.NODE_ENV === "production",
      sameSite: "lax", // More permissive for backup
          path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    })
    
    return response
  } catch (error) {
    console.error('Session verification error:', error)
    return NextResponse.json({ message: 'Session error' }, { status: 500 })
  }
}
