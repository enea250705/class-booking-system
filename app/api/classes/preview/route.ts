import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Public endpoint to preview upcoming classes
export async function GET() {
  try {
    // Get today's date (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get the upcoming classes that are enabled
    const classes = await prisma.class.findMany({
      where: {
        date: {
          gte: today,
        },
        enabled: true,
      },
      orderBy: [
        {
          date: "asc",
        },
      ],
      take: 10, // Limit to 10 upcoming classes
    });
    
    // Map to remove sensitive data and format for preview - no price included
    const previewClasses = classes.map(cls => ({
      id: cls.id,
      name: cls.name,
      day: cls.day,
      time: cls.time,
      date: cls.date,
      spotsAvailable: cls.capacity - cls.currentBookings,
      paymentMethod: "Cash" // Instead of specific price
    }));
    
    return NextResponse.json(previewClasses);
  } catch (error) {
    console.error("Error fetching preview classes:", error);
    return NextResponse.json(
      { error: "Failed to fetch classes" },
      { status: 500 }
    );
  }
} 