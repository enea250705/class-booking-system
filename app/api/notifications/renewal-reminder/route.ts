import { NextResponse } from "next/server"
import { auth } from "@/lib/auth-middleware"
import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/email"

// POST send a renewal reminder (admin only)
export async function POST(request: Request) {
  try {
    const user = await auth(request)

    if (!user || user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ message: "User ID is required" }, { status: 400 })
    }

    // Check if the user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!targetUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // Create a notification
    await prisma.notification.create({
      data: {
        userId,
        type: "subscription_expiring",
        message: "Your subscription will expire soon. Please renew to continue booking classes.",
        read: false
      }
    })

    // Send email notification
    await sendEmail({
      to: targetUser.email,
      subject: "Subscription Expiring Soon",
      text: "Your subscription will expire soon. Please renew to continue booking classes.",
      html: "<h1>Subscription Expiring Soon</h1><p>Your subscription will expire soon. Please renew to continue booking classes.</p>"
    })

    return NextResponse.json({ message: "Renewal reminder sent successfully" })
  } catch (error) {
    console.error("Error sending renewal reminder:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
