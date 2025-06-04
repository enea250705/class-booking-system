import { NextResponse } from "next/server"
import { auth } from "@/lib/auth-middleware"
import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/email"

// GET all pending users for admin approval
export async function GET(request: Request) {
  try {
    const user = await auth(request)

    if (!user || user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Get all users who need approval (non-admin users with approved=false)
    const pendingUsers = await prisma.user.findMany({
      where: {
        approved: false,
        role: "user",
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    })

    return NextResponse.json(pendingUsers)
  } catch (error) {
    console.error("Error fetching pending users:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// POST to approve a user
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

    // Find the user to approve
    const userToApprove = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!userToApprove) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // Update the user's approved status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { approved: true },
    })

    // Create a notification for the user
    await prisma.notification.create({
      data: {
        userId: userId,
        type: "account_approved",
        message: "Your account has been approved. You can now log in and book classes.",
      },
    })

    // Send approval email
    try {
      await sendEmail({
        to: userToApprove.email,
        subject: "Your Account Has Been Approved",
        text: `Hello ${userToApprove.name},\n\nYour account has been approved. You can now log in and book classes.\n\nThank you for joining us!`,
        html: `
          <h1>Your Account Has Been Approved</h1>
          <p>Hello ${userToApprove.name},</p>
          <p>Your account has been approved. You can now log in and book classes.</p>
          <p>Thank you for joining us!</p>
        `,
      })
    } catch (emailError) {
      console.error("Failed to send approval email:", emailError)
      // Continue even if email fails
    }

    return NextResponse.json({ message: "User approved successfully" })
  } catch (error) {
    console.error("Error approving user:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
} 
 