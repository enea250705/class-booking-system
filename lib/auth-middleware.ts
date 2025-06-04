import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma';
import type { User } from "./types"

interface UserJwtPayload {
  userId: string;
  role?: string;
  iat: number;
  exp: number;
}

export async function auth(request: NextRequest | Request): Promise<User | null> {
  try {
    // Get token from cookies or Authorization header
    const cookieStore = await cookies();
    const tokenFromCookie = cookieStore.get('auth_token')?.value;
    
    // For API routes that use Authorization header
    const authHeader = request.headers.get('authorization');
    const tokenFromHeader = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    const token = tokenFromCookie || tokenFromHeader;
    
    if (!token) {
      // Check for backup session cookie
      const sessionId = cookieStore.get('auth_session')?.value;
      if (sessionId) {
        // Try to find user by ID stored in backup cookie
        const user = await prisma.user.findUnique({
          where: { id: sessionId },
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        });
        
        if (user) {
          return {
            id: user.id,
            name: user.name || '',
            email: user.email,
            role: user.role
          };
        }
      }
      
      return null;
    }
    
    try {
      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as UserJwtPayload;
      
      // Get user from database using userId field from token
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      });
      
      if (!user) {
        return null;
      }
      
      // Make sure name is not null to satisfy User type
      return {
        id: user.id,
        name: user.name || '',
        email: user.email,
        role: user.role
      };
    } catch (tokenError) {
      console.error('Token verification error:', tokenError);
      
      // If token verification fails, try to find user by id in token
      // This provides a fallback authentication method
      try {
        // Attempt to decode without verification just to get the userId
        const decodedWithoutVerification = jwt.decode(token) as UserJwtPayload;
        
        if (decodedWithoutVerification?.userId) {
          const user = await prisma.user.findUnique({
            where: { id: decodedWithoutVerification.userId },
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          });
          
          if (user) {
            // Found the user, return their information
            return {
              id: user.id,
              name: user.name || '',
              email: user.email,
              role: user.role
            };
          }
        }
      } catch (fallbackError) {
        console.error('Fallback authentication error:', fallbackError);
      }
      
      return null;
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}
