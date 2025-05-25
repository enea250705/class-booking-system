import { NextResponse } from "next/server"
import { auth } from "@/lib/auth-middleware"

// GET notifications for the current user
export async function GET(request: Request) {
  try {
    const user = await auth(request)

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // In a real app, this would query the database
    // const notifications = await db.notification.findMany({
    //   where: { userId: user.id },
    //   orderBy: { createdAt: 'desc' }
    // })

    // Mock for demo
    const notifications = [
      {
        id: "1",
        userId: user.id,
        type: "class_cancelled",
        message: 'The class "Morning Yoga" on May 27, 2025 has been cancelled.',
        read: false,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      },
      {
        id: "2",
        userId: user.id,
        type: "subscription_expiring",
        message: "Your subscription will expire in 3 days. Renew now to continue booking classes.",
        read: true,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      },
    ]

    return NextResponse.json(notifications)
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
