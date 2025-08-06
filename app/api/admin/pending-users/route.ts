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
        subject: "Registration Application Update",
        text: `Hello ${userToDecline.name},\n\nThank you for your interest in our CrossFit classes. Unfortunately, we are unable to approve your registration at this time.\n\nIf you have any questions, please feel free to contact us.\n\nBest regards,\nThe CrossFit Team`,
        html: `
          <h1>Registration Application Update</h1>
          <p>Hello ${userToDecline.name},</p>
          <p>Thank you for your interest in our CrossFit classes. Unfortunately, we are unable to approve your registration at this time.</p>
          <p>If you have any questions, please feel free to contact us.</p>
          <p>Best regards,<br>The CrossFit Team</p>
        `,
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
 