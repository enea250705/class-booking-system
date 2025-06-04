import { NextResponse } from "next/server";
import { auth } from "@/lib/auth-middleware";
import { prisma } from "@/lib/prisma";

// GET - Load settings
export async function GET(request: Request) {
  try {
    const user = await auth(request);

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Try to get existing settings from database
    let settings = await prisma.setting.findFirst();

    // If no settings exist, create default settings
    if (!settings) {
      const defaultSettings = {
        general: {
          studioName: "GymXam",
          email: "info@gymxam.com",
          phone: "+1 (555) 123-4567",
          address: "123 Fitness Ave, New York, NY 10001",
          cancelHours: "8"
        },
        notifications: {
          sendBookingConfirmations: true,
          sendCancellationNotifications: true,
          sendRenewalReminders: true,
          reminderDays: "7",
          allowClientEmails: false
        },
        packages: {
          package8Price: "120",
          package12Price: "160",
          packageDuration: "30",
          allowAutoRenewal: false
        }
      };

      settings = await prisma.setting.create({
        data: {
          name: "admin_settings",
          value: JSON.stringify(defaultSettings)
        }
      });
    }

    const settingsData = JSON.parse(settings.value);

    return NextResponse.json({
      success: true,
      settings: settingsData
    });
  } catch (error) {
    console.error("Error loading settings:", error);
    return NextResponse.json(
      { error: "Failed to load settings" },
      { status: 500 }
    );
  }
}

// POST - Save settings
export async function POST(request: Request) {
  try {
    const user = await auth(request);

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { section, settings: newSettings } = await request.json();

    if (!section || !newSettings) {
      return NextResponse.json(
        { error: "Section and settings are required" },
        { status: 400 }
      );
    }

    // Get existing settings
    let existingSettings = await prisma.setting.findFirst({
      where: { name: "admin_settings" }
    });

    let currentSettings = {};
    if (existingSettings) {
      currentSettings = JSON.parse(existingSettings.value);
    }

    // Update the specific section
    const updatedSettings = {
      ...currentSettings,
      [section]: newSettings
    };

    // Save back to database
    if (existingSettings) {
      await prisma.setting.update({
        where: { id: existingSettings.id },
        data: {
          value: JSON.stringify(updatedSettings)
        }
      });
    } else {
      await prisma.setting.create({
        data: {
          name: "admin_settings",
          value: JSON.stringify(updatedSettings)
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: `${section} settings updated successfully`,
      settings: updatedSettings
    });
  } catch (error) {
    console.error("Error saving settings:", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
} 