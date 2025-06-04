import { NextResponse } from "next/server";

// GET - Get current package prices from admin settings
export async function GET() {
  try {
    // Default prices that match admin settings defaults
    let packagePrices = {
      package8Price: "120",
      package12Price: "160",
      packageDuration: "30"
    };

    // Try to get prices from admin settings by making internal API call
    try {
      // Import the auth middleware to create a mock admin request
      const { auth } = await import("@/lib/auth-middleware");
      
      // Check if we can access the database directly
      const { PrismaClient } = await import("@prisma/client");
      const prisma = new PrismaClient();
      
      // Try to find admin settings directly
      const settingsResult = await prisma.$queryRaw`
        SELECT value FROM "Setting" WHERE name = 'admin_settings' LIMIT 1
      ` as any[];
      
      if (settingsResult && settingsResult.length > 0) {
        const settingsData = JSON.parse(settingsResult[0].value);
        if (settingsData && settingsData.packages) {
          packagePrices = {
            package8Price: settingsData.packages.package8Price || "120",
            package12Price: settingsData.packages.package12Price || "160",
            packageDuration: settingsData.packages.packageDuration || "30"
          };
          console.log("Package prices loaded from database:", packagePrices);
        }
      } else {
        console.log("No admin settings found in database");
      }
      
      await prisma.$disconnect();
    } catch (dbError) {
      console.log("Database connection failed, using defaults:", dbError);
      // Use default prices if database fails
    }

    return NextResponse.json({
      success: true,
      prices: packagePrices
    });
  } catch (error) {
    console.error("Error fetching package prices:", error);
    // Return default prices if there's an error
    return NextResponse.json({
      success: true,
      prices: {
        package8Price: "120",
        package12Price: "160", 
        packageDuration: "30"
      }
    });
  }
} 