import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import { User } from "@/lib/types"
import { auth } from '@/lib/auth-middleware'

export async function GET(request: Request) {
  try {
    console.time('auth-session-api')
    const user = await auth(request)
    console.timeEnd('auth-session-api')
    
    if (!user) {
      return new NextResponse(
        JSON.stringify({ authenticated: false }), 
        { 
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            // Add cache control headers for unauthenticated responses
            'Cache-Control': 'private, no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      )
    }
    
    // Add performance metrics for debugging
    const responseTime = process.hrtime()
    
    return new NextResponse(
      JSON.stringify({ 
        authenticated: true, 
        user 
      }), 
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          // Add cache headers to avoid frequent session checks
          // Cache for 5 minutes, but allow revalidation
          'Cache-Control': 'private, max-age=300, stale-while-revalidate=60',
          'X-Response-Time': `${responseTime[0]}s ${responseTime[1] / 1000000}ms`
        }
      }
    )
  } catch (error) {
    console.error('Session check error:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Session check failed' }), 
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    )
  }
}
