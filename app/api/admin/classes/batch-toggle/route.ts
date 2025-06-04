import { NextResponse } from "next/server";
import { auth } from "@/lib/auth-middleware";
import { prisma } from "@/lib/prisma";
import { addDays, parseISO } from "date-fns";
import { z } from "zod";

// Schema validation for request body
const toggleRequestSchema = z.object({
  weekStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
  enabled: z.boolean(),
});

// POST - Toggle all classes for a specific week
export async function POST(request: Request) {
  try {
    const user = await auth(request);

    // Check authentication and admin role
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // Parse and validate request data
    const data = await request.json();
    const parseResult = toggleRequestSchema.safeParse(data);
    
    if (!parseResult.success) {
      return NextResponse.json({ 
        error: "Invalid input", 
        details: parseResult.error.errors 
      }, { status: 400 });
    }
    
    const { weekStartDate, enabled } = parseResult.data;
    
    // Parse the week start date (should be a Monday)
    const startDate = parseISO(weekStartDate);
    const endDate = addDays(startDate, 6); // End of the week (Sunday)
    
    // Update all classes in this week
    const result = await prisma.class.updateMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      data: {
        enabled: enabled,
      },
    });

    return NextResponse.json({
      message: `Successfully ${enabled ? 'enabled' : 'disabled'} ${result.count} classes`,
      weekStartDate,
      weekEndDate: endDate.toISOString().split('T')[0],
      affectedClasses: result.count,
    });
  } catch (error) {
    console.error("Error toggling classes:", error);
    return NextResponse.json(
      { error: "Failed to toggle classes" },
      { status: 500 }
    );
  }
} 