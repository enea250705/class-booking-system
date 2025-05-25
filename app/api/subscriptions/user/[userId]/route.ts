import { NextResponse } from "next/server"
import { auth } from "@/lib/auth-middleware"

// GET subscription for a specific user
export async function GET(request: Request, { params }: { params: { userId: string } }) {
  try {
    const user = await auth(request)

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { userId } = params

    // Users can only view their own subscription, admins can view any
    if (user.role !== "admin" && user.id !== userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // In a real app, this would query the database
    // const subscription = await db.subscription.findFirst({
    //   where: {
    //     userId,
    //     status: "active"
    //   },
    //   include: { package: true }
    // })

    // Mock for demo
    const subscription = {
      id: "1",
      userId,
      packageId: "1",
      startDate: new Date("2025-05-10"),
      endDate: new Date("2025-06-09"),
      classesRemaining: 5,
      classesTotal: 8,
      status: "active",
      package: {
        id: "1",
        name: "8 Classes Package",
        classesPerMonth: 8,
        durationDays: 30,
        price: 120,
      },
    }

    if (!subscription) {
      return NextResponse.json({ message: "No active subscription found" }, { status: 404 })
    }

    return NextResponse.json(subscription)
  } catch (error) {
    console.error(`Error fetching subscription for user ${params.userId}:`, error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
