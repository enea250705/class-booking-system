import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/email"
import { subDays, startOfWeek, endOfWeek } from "date-fns"

export async function checkExpiringSubscriptions() {
  try {
    // Get subscriptions expiring in the next 2 days
    const twoDaysFromNow = new Date()
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2)
    
    // Get the beginning and end of the day 2 days from now
    const startOfTwoDaysFromNow = new Date(twoDaysFromNow)
    startOfTwoDaysFromNow.setHours(0, 0, 0, 0)
    
    const endOfTwoDaysFromNow = new Date(twoDaysFromNow)
    endOfTwoDaysFromNow.setHours(23, 59, 59, 999)

    // Query the database for packages expiring in exactly 2 days
    const expiringPackages = await prisma.package.findMany({
      where: {
        active: true,
        endDate: {
          gte: startOfTwoDaysFromNow,
          lte: endOfTwoDaysFromNow
        }
      },
      include: {
        user: true
      }
    })

    console.log(`Found ${expiringPackages.length} packages expiring in 2 days`)

    // Create notifications and send emails
    for (const packageData of expiringPackages) {
      // Create in-app notification
      await prisma.notification.create({
        data: {
          userId: packageData.userId,
          type: "package_expiring",
          message: `Your package will expire in 2 days on ${packageData.endDate.toLocaleDateString()}. Renew now to continue booking classes.`,
          read: false
        }
      })

      // Format package details for the email
      const formattedEndDate = packageData.endDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })

      // Send email notification
      await sendEmail({
        to: packageData.user.email,
        subject: "Your GymXam Subscription is Expiring in 2 Days",
        text: `
Dear ${packageData.user.name},

Your GymXam subscription package will expire in 2 days on ${formattedEndDate}.

Package Details:
- Classes Remaining: ${packageData.classesRemaining}
- Expiration Date: ${formattedEndDate}

To ensure uninterrupted access to our classes, please renew your subscription before the expiration date.

You can renew your subscription by visiting our website or contacting our front desk.

Thank you for choosing GymXam!

Best regards,
The GymXam Team
        `,
        html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>Your GymXam Subscription is Expiring Soon</h2>
  
  <p>Dear ${packageData.user.name},</p>
  
  <p>Your GymXam subscription package will expire in <strong>2 days</strong> on ${formattedEndDate}.</p>
  
  <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
    <h3 style="margin-top: 0;">Package Details:</h3>
    <ul>
      <li><strong>Classes Remaining:</strong> ${packageData.classesRemaining}</li>
      <li><strong>Expiration Date:</strong> ${formattedEndDate}</li>
    </ul>
  </div>
  
  <p>To ensure uninterrupted access to our classes, please renew your subscription before the expiration date.</p>
  
  <p>You can renew your subscription by visiting our website or contacting our front desk.</p>
  
  <p>Thank you for choosing GymXam!</p>
  
  <p>Best regards,<br>
  The GymXam Team</p>
</div>
        `
      })
    }

    console.log("Completed checking for expiring subscriptions")
  } catch (error) {
    console.error("Error checking expiring subscriptions:", error)
  }
}

// New function to delete past class weeks
export async function deletePastClasses() {
  try {
    console.log("Starting cleanup of past classes")
    
    // Get date for one week ago
    const oneWeekAgo = subDays(new Date(), 7)
    
    // Find all classes that ended before one week ago
    const pastClasses = await prisma.class.findMany({
      where: {
        date: {
          lt: oneWeekAgo
        }
      },
      select: {
        id: true,
        name: true,
        date: true,
      }
    })
    
    console.log(`Found ${pastClasses.length} classes older than one week to delete`)
    
    if (pastClasses.length === 0) {
      console.log("No past classes to delete")
      return
    }
    
    // Extract class IDs for deletion
    const classIds = pastClasses.map(cls => cls.id)
    
    // Delete bookings for these classes first (handling foreign key constraints)
    const deletedBookings = await prisma.booking.deleteMany({
      where: {
        classId: {
          in: classIds
        }
      }
    })
    
    console.log(`Deleted ${deletedBookings.count} bookings associated with past classes`)
    
    // Delete waitlist entries for these classes
    const deletedWaitlist = await prisma.waitlist.deleteMany({
      where: {
        classId: {
          in: classIds
        }
      }
    })
    
    console.log(`Deleted ${deletedWaitlist.count} waitlist entries associated with past classes`)
    
    // Now delete the classes
    const result = await prisma.class.deleteMany({
      where: {
        id: {
          in: classIds
        }
      }
    })
    
    console.log(`Successfully deleted ${result.count} past classes`)
  } catch (error) {
    console.error("Error deleting past classes:", error)
  }
}

// Setup all cron jobs
export function setupCronJobs() {
  // Schedule the expiring subscriptions check to run every day at 9:00 AM
  const checkTime = new Date()
  checkTime.setHours(9, 0, 0, 0) // 9:00 AM
  
  // Calculate time until next 9:00 AM
  let timeUntilCheck = checkTime.getTime() - Date.now()
  if (timeUntilCheck < 0) {
    // If it's already past 9:00 AM, schedule for tomorrow
    timeUntilCheck += 24 * 60 * 60 * 1000 // Add 24 hours
  }
  
  // Schedule the first check
  setTimeout(() => {
    // Run the check
    checkExpiringSubscriptions()
    
    // Then set up an interval to run every 24 hours
    setInterval(checkExpiringSubscriptions, 24 * 60 * 60 * 1000)
  }, timeUntilCheck)
  
  console.log(`Scheduled subscription expiration check for ${new Date(Date.now() + timeUntilCheck).toLocaleString()}`)
  
  // Schedule past classes deletion to run every Sunday at midnight
  const sundayMidnight = new Date()
  sundayMidnight.setDate(sundayMidnight.getDate() + (7 - sundayMidnight.getDay()) % 7) // Next Sunday
  sundayMidnight.setHours(0, 0, 0, 0) // Midnight
  
  // Calculate time until next Sunday midnight
  const timeUntilCleanup = sundayMidnight.getTime() - Date.now()
  
  // Schedule the first cleanup
  setTimeout(() => {
    // Run the cleanup
    deletePastClasses()
    
    // Then set up an interval to run every 7 days (weekly)
    setInterval(deletePastClasses, 7 * 24 * 60 * 60 * 1000)
  }, timeUntilCleanup)
  
  console.log(`Scheduled past classes cleanup for ${new Date(Date.now() + timeUntilCleanup).toLocaleString()} (every Sunday)`)
}