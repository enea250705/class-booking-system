"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"

interface AuthCheckProps {
  children: React.ReactNode
  requiredRole?: "admin" | "user"
}

export function AuthCheck({ children, requiredRole }: AuthCheckProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return

    // If no user is logged in, redirect to login
    if (!user) {
      router.push("/login")
      return
    }

    // If a specific role is required and user doesn't have it
    if (requiredRole && user.role !== requiredRole) {
      // Redirect admins to admin dashboard, users to user dashboard
      router.push(user.role === "admin" ? "/admin" : "/dashboard")
    }
  }, [user, isLoading, router, requiredRole])

  // Show nothing while loading or redirecting
  if (isLoading || !user || (requiredRole && user.role !== requiredRole)) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>
  }

  return <>{children}</>
}
