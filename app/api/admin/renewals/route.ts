import { NextResponse } from "next/server";
import { auth } from "@/lib/auth-middleware";
import { prisma } from "@/lib/prisma";

// GET - Fetch all package renewals (admin only)
export async function GET(request: Request) {
  try {
    const user = await auth(request);

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse URL for pagination and filtering
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const userId = url.searchParams.get("userId");
    const email = url.searchParams.get("email");
    const method = url.searchParams.get("method"); // filter by renewal/purchase/admin_assigned
    
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (userId) {
      where.userId = userId;
    }
    if (email) {
      where.user = {
        email: {
          contains: email,
          mode: 'insensitive'
        }
      };
    }
    if (method) {
      where.method = method;
    }

    // Fetch renewals with user information
    const renewals = await prisma.packageRenewal.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        package: {
          select: {
            id: true,
            name: true,
            active: true,
          },
        },
      },
      orderBy: {
        renewedAt: "desc",
      },
      skip,
      take: limit,
    });

    // Get total count for pagination
    const total = await prisma.packageRenewal.count({ where });

    // Format the response
    const formattedRenewals = renewals.map((renewal) => ({
      id: renewal.id,
      user: {
        id: renewal.user.id,
        name: renewal.user.name,
        email: renewal.user.email,
      },
      package: {
        id: renewal.package.id,
        name: renewal.package.name,
        active: renewal.package.active,
      },
      packageType: renewal.packageType,
      packageName: renewal.packageName,
      renewedAt: renewal.renewedAt,
      startDate: renewal.startDate,
      endDate: renewal.endDate,
      price: renewal.price,
      method: renewal.method,
    }));

    return NextResponse.json({
      success: true,
      renewals: formattedRenewals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching renewals:", error);
    return NextResponse.json(
      { error: "Failed to fetch renewals" },
      { status: 500 }
    );
  }
} 