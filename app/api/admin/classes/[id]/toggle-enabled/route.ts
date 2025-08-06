import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import { auth } from "@/lib/auth-middleware";

const prisma = new PrismaClient();

// Create transporter for sending emails
const transporter = nodemailer.createTransport({
  host: 'authsmtp.securemail.pro',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await auth(request);

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { enabled } = await request.json();
    const classId = params.id;

    // Get class details with bookings
    const classItem = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        bookings: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!classItem) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    // If enabling the class, convert pre-added users to confirmed bookings
    if (enabled && !classItem.enabled) {
      const preAddedBookings = classItem.bookings.filter(booking => booking.status === 'pre_added');
      
      for (const booking of preAddedBookings) {
        // Check if user has an active package with remaining classes
        const userPackage = await prisma.package.findFirst({
          where: {
            userId: booking.userId,
            active: true,
            classesRemaining: {
              gt: 0
            }
          }
        });

        if (userPackage) {
          // Convert to confirmed booking and deduct from package
          await prisma.booking.update({
            where: { id: booking.id },
            data: { status: 'confirmed' }
          });

          await prisma.package.update({
            where: { id: userPackage.id },
            data: {
              classesRemaining: {
                decrement: 1
              }
            }
          });

          console.log(`Converted pre-added user ${booking.user.name} to confirmed booking`);
        } else {
          // User doesn't have valid package, remove the booking
          await prisma.booking.delete({
            where: { id: booking.id }
          });

          await prisma.class.update({
            where: { id: classId },
            data: {
              currentBookings: {
                decrement: 1
              }
            }
          });

          console.log(`Removed pre-added user ${booking.user.name} - no valid package`);
        }
      }

             // Refresh class data after conversions
       const updatedClass = await prisma.class.findUnique({
         where: { id: classId },
         include: {
           bookings: {
             include: {
               user: {
                 select: {
                   id: true,
                   name: true,
                   email: true
                 }
               }
             }
           }
         }
       });

       if (updatedClass) {
         classItem.bookings = updatedClass.bookings;
       }
    }

    // Update class enabled status
    await prisma.class.update({
      where: { id: classId },
      data: { enabled }
    });

    // If enabling the class and there are confirmed bookings, send confirmation emails
    if (enabled && classItem.bookings.length > 0) {
      const confirmedBookings = classItem.bookings.filter(booking => booking.status === 'confirmed');
      
      const emailPromises = confirmedBookings.map(async (booking) => {
        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Class Booking Confirmed - GymXam</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f7f7f7;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
              <!-- Header -->
              <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #3b82f6; padding-bottom: 20px;">
                <h1 style="color: #3b82f6; margin: 0; font-size: 28px; font-weight: bold;">GymXam</h1>
                <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 14px;">Your Fitness Journey Starts Here</p>
              </div>

              <!-- Main Content -->
              <div style="margin-bottom: 30px;">
                <h2 style="color: #1f2937; margin-bottom: 20px;">Class Booking Confirmed! 🎉</h2>
                
                <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
                  Dear <strong>${booking.user.name}</strong>,
                </p>
                
                <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
                  Great news! Your class booking has been confirmed. Here are the details:
                </p>

                <!-- Class Details Box -->
                <div style="background-color: #f3f4f6; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 4px;">
                  <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">${classItem.name}</h3>
                  <div style="color: #374151; line-height: 1.8;">
                    <p style="margin: 5px 0;"><strong>📅 Date:</strong> ${new Date(classItem.date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</p>
                    <p style="margin: 5px 0;"><strong>🕐 Time:</strong> ${classItem.time}</p>
                    <p style="margin: 5px 0;"><strong>📍 Day:</strong> ${classItem.day}</p>
                    ${classItem.description ? `<p style="margin: 5px 0;"><strong>📝 Description:</strong> ${classItem.description}</p>` : ''}
                  </div>
                </div>

                <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
                  <p style="color: #065f46; margin: 0; font-weight: 500;">
                    ✅ Your spot is secured! Please arrive 5-10 minutes early.
                  </p>
                </div>

                <p style="color: #374151; line-height: 1.6; margin-bottom: 15px;">
                  <strong>Important reminders:</strong>
                </p>
                <ul style="color: #374151; line-height: 1.6; margin-bottom: 20px; padding-left: 20px;">
                  <li>Bring your water bottle and towel</li>
                  <li>Wear comfortable workout attire</li>
                  <li>Arrive 5-10 minutes before class starts</li>
                  <li>One class has been deducted from your package</li>
                </ul>

                <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
                  If you need to cancel, please do so at least 2 hours before the class starts through your dashboard at 
                  <a href="https://gymxam.com" style="color: #3b82f6; text-decoration: none;">gymxam.com</a>
                </p>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://gymxam.com/dashboard" 
                   style="display: inline-block; background-color: #3b82f6; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 16px;">
                  View Your Dashboard
                </a>
              </div>

              <!-- Footer -->
              <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                  Questions? Contact us at 
                  <a href="mailto:info@codewithenea.it" style="color: #3b82f6; text-decoration: none;">info@codewithenea.it</a>
                </p>
                <p style="color: #9ca3af; font-size: 12px; margin: 10px 0 0 0;">
                  © 2024 GymXam. All rights reserved.
                </p>
              </div>
            </div>
          </body>
          </html>
        `;

        try {
          await transporter.sendMail({
            from: `"GymXam" <${process.env.EMAIL_USER}>`,
            to: booking.user.email,
            subject: `Class Booking Confirmed - ${classItem.name} on ${classItem.day}`,
            html: emailHtml,
          });
          
          console.log(`Booking confirmation sent to ${booking.user.email}`);
          return { success: true, email: booking.user.email };
        } catch (emailError) {
          console.error(`Failed to send email to ${booking.user.email}:`, emailError);
          return { success: false, email: booking.user.email, error: emailError };
        }
      });

      const emailResults = await Promise.all(emailPromises);
      const successfulEmails = emailResults.filter(result => result.success).length;
      const failedEmails = emailResults.filter(result => !result.success).length;

      let message = `Class ${enabled ? 'enabled' : 'disabled'} successfully.`;
      if (enabled && confirmedBookings.length > 0) {
        message += ` Booking confirmation emails sent: ${successfulEmails} successful`;
        if (failedEmails > 0) {
          message += `, ${failedEmails} failed`;
        }
      }

      return NextResponse.json({
        success: true,
        message,
        emailResults: enabled ? emailResults : undefined
      });
    }

    return NextResponse.json({
      success: true,
      message: `Class ${enabled ? 'enabled' : 'disabled'} successfully.`
    });

  } catch (error) {
    console.error('Error toggling class enabled status:', error);
    return NextResponse.json({ error: 'Failed to update class status' }, { status: 500 });
  }
} 