import { NextResponse } from "next/server"
import { auth } from "@/lib/auth-middleware"
import { sendEmail } from "@/lib/email"

// POST /api/admin/test-email
export async function POST(request: Request) {
  try {
    const user = await auth(request)

    if (!user || user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { email } = await request.json()
    
    // Use provided email or default to the admin's email
    const recipient = email || user.email
    
    console.log("Test email API called, sending to:", recipient)
    
    // Check environment variables to ensure they're loaded
    console.log("Environment check:", {
      host: process.env.SMTP_HOST ? "✓" : "✗",
      port: process.env.SMTP_PORT ? "✓" : "✗",
      user: process.env.SMTP_USER ? "✓" : "✗",
      pass: process.env.SMTP_PASS ? "✓" : "✗",
      from: process.env.SMTP_FROM ? "✓" : "✗"
    })
    
    // Send test email
    const result = await sendEmail({
      to: recipient,
      subject: "GymXam Test Email",
      text: "This is a test email from GymXam to verify that the email system is working correctly.",
      html: `
        <h2>GymXam Email Test</h2>
        <p>This is a test email from GymXam to verify that the email system is working correctly.</p>
        <p>If you're receiving this email, it means your SMTP configuration is working properly!</p>
        <p>Email configuration:</p>
        <ul>
          <li>SMTP Host: ${process.env.SMTP_HOST}</li>
          <li>SMTP Port: ${process.env.SMTP_PORT}</li>
          <li>SMTP User: ${process.env.SMTP_USER}</li>
          <li>From: ${process.env.SMTP_FROM}</li>
        </ul>
        <p>Sent at: ${new Date().toISOString()}</p>
      `
    })

    if (result.success) {
      return NextResponse.json({ 
        message: "Test email sent successfully", 
        recipient,
        success: true,
        messageId: result.messageId
      })
    } else {
      console.error("Email sending failed:", result.error)
      return NextResponse.json(
        { 
          message: "Failed to send test email", 
          success: false,
          error: result.error || "Unknown error occurred"
        }, 
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Error sending test email:", error)
    return NextResponse.json(
      { 
        message: "Error sending test email", 
        success: false,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      }, 
      { status: 500 }
    )
  }
} 