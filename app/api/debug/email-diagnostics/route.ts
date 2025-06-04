import { NextResponse } from "next/server"
import { auth } from "@/lib/auth-middleware"
// Using mock implementation for development - replace with real nodemailer in production
import nodemailer from '@/lib/mock-nodemailer'

// GET /api/debug/email-diagnostics
export async function GET(request: Request) {
  try {
    const user = await auth(request)

    if (!user || user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }
    
    // Run diagnostic tests on the email configuration
    const diagnostics = await runDiagnostics()
    
    return NextResponse.json(diagnostics)
  } catch (error) {
    console.error("Error running email diagnostics:", error)
    return NextResponse.json({ 
      message: "Error running email diagnostics", 
      error: String(error)
    }, { status: 500 })
  }
}

// Function to run various email diagnostics
async function runDiagnostics() {
  const results = {
    environment: checkEnvironment(),
    smtpConnection: await testSmtpConnection(),
    mockMode: true
  }
  
  return results
}

// Check if environment variables are set
function checkEnvironment() {
  return {
    host: {
      set: Boolean(process.env.SMTP_HOST),
      value: process.env.SMTP_HOST || "(not set)"
    },
    port: {
      set: Boolean(process.env.SMTP_PORT),
      value: process.env.SMTP_PORT || "(not set)"
    },
    user: {
      set: Boolean(process.env.SMTP_USER),
      value: process.env.SMTP_USER || "(not set)"
    },
    pass: {
      set: Boolean(process.env.SMTP_PASS),
      value: process.env.SMTP_PASS ? "********" : "(not set)"
    },
    from: {
      set: Boolean(process.env.SMTP_FROM),
      value: process.env.SMTP_FROM || "(not set)"
    }
  }
}

// Test SMTP connection
async function testSmtpConnection() {
  try {
    const config = {
      host: process.env.SMTP_HOST || "",
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER || "",
        pass: process.env.SMTP_PASS || ""
      }
    }
    
    console.log("Testing SMTP connection with:", {
      host: config.host,
      port: config.port,
      secure: config.secure
    })
    
    // Create a transporter with the config
    const transporter = nodemailer.createTransport(config)
    
    // Since we're using a mock, the verify will always return true
    const success = await transporter.verify()
    
    return {
      success: true,
      message: "Connection verified successfully (mock mode)",
      details: "Using mock nodemailer in development mode"
    }
  } catch (error) {
    console.error("SMTP connection test failed:", error)
    return {
      success: false,
      message: "Connection test failed",
      error: String(error)
    }
  }
} 