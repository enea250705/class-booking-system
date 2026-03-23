import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth-middleware";
// (date-fns not needed – using pure UTC timestamp arithmetic)

/**
 * POST /api/admin/fix-duplicate-classes
 *
 * Diagnoses and fixes:
 *  1. Duplicate classes (same date + same time) – keeps the one with bookings,
 *     or the first one if there are no bookings.
 *  2. Missing classes in a given date range (e.g. 30/03–03/04/2026).
 *
 * Query params:
 *   dryRun=true  → only reports, does not modify the database
 */

// Default weekly time slots (identical to generate-default-schedule)
const TIME_SLOTS: Record<string, string[]> = {
  Monday:    ["08:00", "09:00", "10:00", "17:00", "18:00", "19:00", "20:00"],
  Tuesday:   ["08:00", "09:00", "17:00", "18:00", "19:00", "20:00"],
  Wednesday: ["08:00", "09:00", "10:00", "17:00", "18:00", "19:00", "20:00"],
  Thursday:  ["08:00", "09:00", "17:00", "18:00", "19:00", "20:00"],
  Friday:    ["08:00", "09:00", "10:00", "16:00", "17:00", "18:00"],
};

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function formatTime(timeSlot: string): string {
  const [hours, minutes] = timeSlot.split(":");
  const h = parseInt(hours, 10);
  return `${h}:${minutes} ${h >= 12 ? "PM" : "AM"}`;
}

export async function POST(request: Request) {
  try {
    const user = await auth(request);

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized – Admin access required" }, { status: 401 });
    }

    const url = new URL(request.url);
    const dryRun = url.searchParams.get("dryRun") === "true";

    // ── 1. FETCH ALL CLASSES ──────────────────────────────────────────────────
    const allClasses = await prisma.class.findMany({
      include: { bookings: true },
      orderBy: [{ date: "asc" }, { time: "asc" }],
    });

    // ── 2. FIND DUPLICATES (same date-string + same time) ─────────────────────
    const seen = new Map<string, typeof allClasses[0][]>();

    for (const cls of allClasses) {
      // Normalise to YYYY-MM-DD in UTC so DST drift doesn't create false keys
      const dateKey = cls.date.toISOString().split("T")[0];
      const key = `${dateKey}|${cls.time}`;
      if (!seen.has(key)) seen.set(key, []);
      seen.get(key)!.push(cls);
    }

    const duplicateGroups = [...seen.values()].filter((g) => g.length > 1);

    const toDelete: string[] = [];
    const keptClasses: { id: string; date: string; time: string; bookings: number }[] = [];

    for (const group of duplicateGroups) {
      // Keep the one with the most bookings; if tied, keep the earliest createdAt
      group.sort((a, b) => {
        const diff = b.bookings.length - a.bookings.length;
        if (diff !== 0) return diff;
        return a.createdAt.getTime() - b.createdAt.getTime();
      });

      const [keep, ...rest] = group;
      keptClasses.push({
        id: keep.id,
        date: keep.date.toISOString().split("T")[0],
        time: keep.time,
        bookings: keep.bookings.length,
      });
      for (const dup of rest) {
        toDelete.push(dup.id);
      }
    }

    // ── 3. CHECK FOR MISSING CLASSES (30 Mar – 3 Apr 2026) ───────────────────
    const missingRangeStart = new Date("2026-03-30T00:00:00.000Z");
    const missingRangeEnd   = new Date("2026-04-04T00:00:00.000Z"); // exclusive

    // Build a set of existing (date, time) keys for the target range
    const existingKeys = new Set<string>();
    for (const cls of allClasses) {
      const dateKey = cls.date.toISOString().split("T")[0];
      if (cls.date >= missingRangeStart && cls.date < missingRangeEnd) {
        existingKeys.add(`${dateKey}|${cls.time}`);
      }
    }

    // Generate expected classes for the range
    const classesToCreate: {
      name: string;
      day: string;
      date: Date;
      time: string;
      capacity: number;
      enabled: boolean;
      currentBookings: number;
    }[] = [];

    let cursor = new Date(missingRangeStart);
    while (cursor < missingRangeEnd) {
      const dayName = DAYS[cursor.getUTCDay()];
      const slots = TIME_SLOTS[dayName];
      if (slots) {
        for (const slot of slots) {
          const formattedTime = formatTime(slot);
          const dateKey = cursor.toISOString().split("T")[0];
          const lookupKey = `${dateKey}|${formattedTime}`;
          if (!existingKeys.has(lookupKey)) {
            classesToCreate.push({
              name: "CrossFit Class",
              day: dayName,
              date: new Date(cursor),
              time: formattedTime,
              capacity: 5,
              enabled: false,
              currentBookings: 0,
            });
          }
        }
      }
      cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000); // safe UTC +1 day
    }

    // ── 4. APPLY CHANGES (unless dryRun) ─────────────────────────────────────
    let deletedCount = 0;
    let createdCount = 0;

    if (!dryRun) {
      // Delete bookings for duplicate classes first, then the classes themselves
      if (toDelete.length > 0) {
        await prisma.booking.deleteMany({ where: { classId: { in: toDelete } } });
        await prisma.waitlist.deleteMany({ where: { classId: { in: toDelete } } });
        const del = await prisma.class.deleteMany({ where: { id: { in: toDelete } } });
        deletedCount = del.count;
      }

      // Create missing classes
      if (classesToCreate.length > 0) {
        const result = await prisma.class.createMany({
          data: classesToCreate,
          skipDuplicates: true,
        });
        createdCount = result.count;
      }
    }

    return NextResponse.json({
      dryRun,
      duplicates: {
        groupsFound: duplicateGroups.length,
        idsToDelete: toDelete,
        deletedCount: dryRun ? 0 : deletedCount,
        keptClasses,
      },
      missingClasses: {
        rangeChecked: "2026-03-30 to 2026-04-03",
        toCreate: classesToCreate.map((c) => ({
          date: c.date.toISOString().split("T")[0],
          day: c.day,
          time: c.time,
        })),
        createdCount: dryRun ? 0 : createdCount,
      },
    });
  } catch (error) {
    console.error("Error in fix-duplicate-classes:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
