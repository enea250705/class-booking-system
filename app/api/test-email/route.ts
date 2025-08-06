import { NextResponse } from "next/server"
import { sendEmail } from "@/lib/email"

export async function POST(request: Request) {
  try {
    const { to } = await request.json()
    
    if (!to) {
      return NextResponse.json(
        { error: "Email address is required" },
        { status: 400 }
      )
    }

    console.log('Testing email sending to:', to);
    
    const result = await sendEmail({
      to,
      subject: "GymXam Email Test",
      text: "This is a test email from GymXam to verify email functionality.",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>GymXam Email Test</h2>
          <p>This is a test email from GymXam to verify email functionality.</p>
          <p>If you received this email, the email system is working correctly!</p>
          <p>Best regards,<br>The GymXam Team</p>
        </div>
      `
    });

    return NextResponse.json({
      success: result.success,
      messageId: result.messageId,
      error: result.error,
      message: result.success ? "Test email sent successfully" : "Failed to send test email"
    })
  } catch (error) {
    console.error("Error sending test email:", error)
    return NextResponse.json(
      { error: "Failed to send test email", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
} 