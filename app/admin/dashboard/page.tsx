"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { AdminSidebar, MobileHeader, MobileMenu } from "@/app/admin/components/AdminLayout"
import DashboardContent from "@/app/admin/components/DashboardContent"

export default function AdminDashboardPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [pendingUsers, setPendingUsers] = useState<any[]>([])
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const { user, isLoading } = useAuth()
  const router = useRouter()

  // Fetch pending users for the sidebar badge
  useEffect(() => {
    const fetchPendingUsers = async () => {
      try {
        const response = await fetch('/api/admin/pending-users')
        if (response.ok) {
          const data = await response.json()
          setPendingUsers(data)
        }
      } catch (error) {
        console.error('Error fetching pending users:', error)
      }
    }

    const fetchNotificationCount = async () => {
      try {
        const response = await fetch('/api/admin/notifications?unreadOnly=true')
        if (response.ok) {
          const data = await response.json()
          setUnreadNotifications(data.unreadCount)
        }
      } catch (error) {
        console.error('Error fetching notification count:', error)
      }
    }

    if (user?.role === 'admin') {
      fetchPendingUsers()
      fetchNotificationCount()
    }
  }, [user])

  // Handle auth redirects
  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  if (isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (user.role !== "admin") {
    return null
  }

  return (
    <div className="min-h-screen bg-black">
      <AdminSidebar user={user} pendingUsers={pendingUsers} unreadNotifications={unreadNotifications} />
      <MobileHeader user={user} setIsMobileMenuOpen={setIsMobileMenuOpen} />
      <MobileMenu 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
        user={user} 
        pendingUsers={pendingUsers}
        unreadNotifications={unreadNotifications}
      />
      
      <div className="lg:ml-64">
        <main className="min-h-screen p-8">
          <div className="text-center mb-12">
            <h1 className="font-montserrat text-3xl sm:text-4xl font-bold tracking-tight text-white drop-shadow-sm mb-2">
              Admin Dashboard
            </h1>
            <p className="text-white/70 max-w-xl mx-auto">
              Manage CrossFit classes, clients, and system settings
            </p>
          </div>
          <DashboardContent />
        </main>
      </div>
    </div>
  )
} 