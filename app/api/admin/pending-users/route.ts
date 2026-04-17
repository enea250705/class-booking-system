import { NextResponse } from "next/server"
import { auth } from "@/lib/auth-middleware"
import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/email"
import { accountApprovedEmail, accountDeclinedEmail } from "@/lib/email-templates"

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
        subject: "Welcome to GymXam — Account Approved",
        html: accountApprovedEmail({ name: userToApprove.name }),
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

// DELETE to decline a user
export async function DELETE(request: Request) {
  try {
    const user = await auth(request)

    if (!user || user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ message: "User ID is required" }, { status: 400 })
    }

    // Find the user to decline
    const userToDecline = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!userToDecline) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // Delete related data first (notifications, packages, bookings)
    await prisma.notification.deleteMany({
      where: { userId: userId },
    })

    await prisma.booking.deleteMany({
      where: { userId: userId },
    })

    await prisma.package.deleteMany({
      where: { userId: userId },
    })

    // Delete the user
    await prisma.user.delete({
      where: { id: userId },
    })

    // Send decline email
    try {
      await sendEmail({
        to: userToDecline.email,
        subject: "GymXam — Registration Update",
        html: accountDeclinedEmail({ name: userToDecline.name }),
      })
    } catch (emailError) {
      console.error("Failed to send decline email:", emailError)
      // Continue even if email fails
    }

    return NextResponse.json({ message: "User declined successfully" })
  } catch (error) {
    console.error("Error declining user:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
} 
 