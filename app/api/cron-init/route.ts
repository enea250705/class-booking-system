import { NextResponse } from "next/server";
import { setupCronJobs } from "@/lib/cron";

// Initialize cron jobs
let cronInitialized = false;

// Initialize cron jobs on server startup
if (!cronInitialized) {
  setupCronJobs();
  cronInitialized = true;
  console.log("Cron jobs initialized on server startup");
}

// Route for manually triggering cron job initialization
export async function GET() {
  if (!cronInitialized) {
    setupCronJobs();
    cronInitialized = true;
    return NextResponse.json({ message: "Cron jobs initialized" });
  }
  
  return NextResponse.json({ message: "Cron jobs already initialized" });
} 