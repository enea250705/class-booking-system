import { NextResponse } from "next/server"
import { auth } from "@/lib/auth-middleware"

// PUT mark a notification as read
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await auth(request)

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { id } = params

    // In a real app, this would check if the notification exists and belongs to the user
    // const notification = await db.notification.findUnique({
    //   where: { id }
    // })

    // if (!notification) {
    //   return NextResponse.json({ message: "Notification not found" }, { status: 404 })
    // }

    // if (notification.userId !== user.id) {
    //   return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    // }

    // Update notification
    // const updatedNotification = await db.notification.update({
    //   where: { id },
    //   data: { read: true }
    // })

    // Mock for demo
    const updatedNotification = {
      id,
      userId: user.id,
      type: "class_cancelled",
      message: 'The class "Morning Yoga" on May 27, 2025 has been cancelled.',
      read: true,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    }

    return NextResponse.json(updatedNotification)
  } catch (error) {
    console.error(`Error marking notification ${params.id} as read:`, error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
