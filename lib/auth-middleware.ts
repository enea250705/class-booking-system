import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma';
import type { User } from "./types"

interface UserJwtPayload {
  id: string;
  name: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export async function auth(request: NextRequest | Request): Promise<User | null> {
  // Get token from cookies or Authorization header
  const cookieStore = cookies();
  const tokenFromCookie = cookieStore.get('auth_token')?.value;
  
  // For API routes that use Authorization header
  const authHeader = request.headers.get('authorization');
  const tokenFromHeader = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  
  const token = tokenFromCookie || tokenFromHeader;
  
  if (!token) {
    return null;
  }
  
  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as UserJwtPayload;
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
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
    
    return user;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}
