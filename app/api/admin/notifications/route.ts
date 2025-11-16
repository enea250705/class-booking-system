import { NextResponse } from "next/server"
import { auth } from "@/lib/auth-middleware"
import { prisma } from "@/lib/prisma"

// GET - Fetch admin notifications
export async function GET(request: Request) {
  try {
    const user = await auth(request)

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get query params for filtering
    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')

    // Fetch notifications for this admin user
    const notifications = await prisma.notification.findMany({
      where: {
        userId: user.id,
        type: 'admin_cancellation',
        ...(unreadOnly && { read: false })
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })

    // Get unread count
    const unreadCount = await prisma.notification.count({
      where: {
        userId: user.id,
        type: 'admin_cancellation',
        read: false
      }
    })

    return NextResponse.json({
      notifications,
      unreadCount,
      total: notifications.length
    })
  } catch (error) {
    console.error("Error fetching admin notifications:", error)
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    )
  }
}

// PUT - Mark notifications as read
export async function PUT(request: Request) {
  try {
    const user = await auth(request)

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { notificationIds, markAllRead } = await request.json()

    if (markAllRead) {
      // Mark all admin cancellation notifications as read
      await prisma.notification.updateMany({
        where: {
          userId: user.id,
          type: 'admin_cancellation',
          read: false
        },
        data: {
          read: true
        }
      })

      return NextResponse.json({ 
        message: "All notifications marked as read",
        updated: true
      })
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId: user.id
        },
        data: {
          read: true
        }
      })

      return NextResponse.json({ 
        message: "Notifications marked as read",
        updated: notificationIds.length
      })
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  } catch (error) {
    console.error("Error updating notifications:", error)
    return NextResponse.json(
      { error: "Failed to update notifications" },
      { status: 500 }
    )
  }
}

// DELETE - Delete notification(s)
export async function DELETE(request: Request) {
  try {
    const user = await auth(request)

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const notificationId = searchParams.get('id')

    if (notificationId) {
      await prisma.notification.delete({
        where: {
          id: notificationId,
          userId: user.id
        }
      })

      return NextResponse.json({ 
        message: "Notification deleted",
        deleted: true
      })
    }

    return NextResponse.json({ error: "Notification ID required" }, { status: 400 })
  } catch (error) {
    console.error("Error deleting notification:", error)
    return NextResponse.json(
      { error: "Failed to delete notification" },
      { status: 500 }
    )
  }
}

