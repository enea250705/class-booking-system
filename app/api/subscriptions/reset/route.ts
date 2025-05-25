import { NextResponse } from "next/server"
import { auth } from "@/lib/auth-middleware"

// POST reset a subscription (admin only)
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

    // In a real app, this would check if the user has an active subscription
    // const subscription = await db.subscription.findFirst({
    //   where: {
    //     userId,
    //     status: "active"
    //   },
    //   include: { package: true }
    // })

    // if (!subscription) {
    //   return NextResponse.json({ message: "No active subscription found" }, { status: 404 })
    // }

    // Reset the subscription
    // const updatedSubscription = await db.subscription.update({
    //   where: { id: subscription.id },
    //   data: {
    //     classesRemaining: subscription.package.classesPerMonth,
    //     startDate: new Date(),
    //     endDate: new Date(Date.now() + subscription.package.durationDays * 24 * 60 * 60 * 1000)
    //   },
    //   include: { package: true }
    // })

    // Mock for demo
    const updatedSubscription = {
      id: "1",
      userId,
      packageId: "1",
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      classesRemaining: 8,
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

    return NextResponse.json(updatedSubscription)
  } catch (error) {
    console.error("Error resetting subscription:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
