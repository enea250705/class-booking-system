import { NextResponse } from "next/server"
import { auth } from "@/lib/auth-middleware"

// POST renew a subscription
export async function POST(request: Request) {
  try {
    const user = await auth(request)

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { userId, packageId } = await request.json()

    // Admins can renew any subscription, users can only renew their own
    if (user.role !== "admin" && user.id !== userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // In a real app, this would check if the package exists
    // const package = await db.package.findUnique({
    //   where: { id: packageId }
    // })

    // if (!package) {
    //   return NextResponse.json({ message: "Package not found" }, { status: 404 })
    // }

    // Set the current active subscription to expired
    // await db.subscription.updateMany({
    //   where: {
    //     userId,
    //     status: "active"
    //   },
    //   data: { status: "expired" }
    // })

    // Create a new subscription
    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + 30) // 30 days from now

    // const classesPerMonth = package.classesPerMonth
    const classesPerMonth = packageId === "1" ? 8 : 12 // Mock for demo

    // const newSubscription = await db.subscription.create({
    //   data: {
    //     userId,
    //     packageId,
    //     startDate,
    //     endDate,
    //     classesRemaining: classesPerMonth,
    //     classesTotal: classesPerMonth,
    //     status: "active"
    //   },
    //   include: { package: true }
    // })

    // Mock for demo
    const newSubscription = {
      id: Date.now().toString(),
      userId,
      packageId,
      startDate,
      endDate,
      classesRemaining: classesPerMonth,
      classesTotal: classesPerMonth,
      status: "active",
      package: {
        id: packageId,
        name: classesPerMonth === 8 ? "8 Classes Package" : "12 Classes Package",
        classesPerMonth,
        durationDays: 30,
        price: classesPerMonth === 8 ? 120 : 160,
      },
    }

    return NextResponse.json(newSubscription)
  } catch (error) {
    console.error("Error renewing subscription:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
