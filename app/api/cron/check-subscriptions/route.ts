import { NextResponse } from "next/server"
import { checkExpiringSubscriptions } from "@/lib/cron"

// This route is called by a cron job to check for expiring subscriptions
export async function GET(request: Request) {
  try {
    // Check for expiring subscriptions and send notifications
    await checkExpiringSubscriptions()

    return NextResponse.json({ success: true, message: "Subscription check completed" })
  } catch (error) {
    console.error("Cron job error:", error)
    return NextResponse.json({ success: false, message: "Error running subscription check" }, { status: 500 })
  }
}
