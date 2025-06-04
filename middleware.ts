import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtDecode } from "jwt-decode"

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value || request.headers.get("authorization")?.split(" ")[1]
  const sessionId = request.cookies.get("auth_session")?.value
  const { pathname } = request.nextUrl

  // Check if the pathname starts with /admin
  const isAdminRoute = pathname.startsWith("/admin")

  // Check if the pathname is a protected route
  const isProtectedRoute = isAdminRoute || pathname.startsWith("/dashboard")

  // Check if the pathname is an auth route
  const isAuthRoute = pathname === "/login" || pathname === "/register"

  // If there's no token and the route is protected, redirect to login
  if (!token && !sessionId && isProtectedRoute) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // If there's a token
  if (token) {
    try {
      const decoded = jwtDecode<{ role: string; userId: string }>(token)

      // If user is trying to access admin routes but is not an admin
      if (isAdminRoute && decoded.role !== "admin") {
        return NextResponse.redirect(new URL("/dashboard", request.url))
      }

      // If user is already logged in and trying to access auth routes
      if (isAuthRoute) {
        // Redirect admins to admin dashboard, users to user dashboard
        return NextResponse.redirect(new URL(decoded.role === "admin" ? "/admin" : "/dashboard", request.url))
      }
    } catch (error) {
      console.error("Token decode error in middleware:", error)
      
      // Only redirect if the token is invalid AND we're on a protected route
      if (isProtectedRoute) {
        // Check if we have a session ID cookie as fallback
        if (sessionId) {
          // Allow the request to proceed as we have a session ID
          // The auth context will try to recover the session
          return NextResponse.next()
        }
        
        // No token or session ID, redirect to login
        const response = NextResponse.redirect(new URL("/login", request.url))
        // Clear the invalid token
        response.cookies.delete("auth_token")
        return response
      }
    }
  } else if (sessionId && isProtectedRoute) {
    // If we have a session ID but no token, allow the request
    // The auth context will try to recover the session
    return NextResponse.next()
  }

  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all authenticated routes
     */
    '/dashboard/:path*',
    '/bookings/:path*',
    '/classes/:path*',
    '/admin/:path*',
  ],
}
