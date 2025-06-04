import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth-middleware'
// Using mock implementation for development - replace with real nodemailer in production
import nodemailer from '@/lib/mock-nodemailer'

export async function POST(request: Request) {
  try {
    // Check if the user is authenticated and is an admin
    const user = await auth(request)
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Get the request body
    const body = await request.json()
    const { recipient, configType } = body

    if (!recipient) {
      return NextResponse.json({ message: 'Recipient email is required' }, { status: 400 })
    }

    // Define configurations
    const configurations = {
      primary: {
        host: process.env.SMTP_HOST || 'localhost',
        port: Number(process.env.SMTP_PORT || '25'),
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASS || ''
        }
      },
      tls587: {
        host: process.env.SMTP_HOST || 'localhost',
        port: 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASS || ''
        }
      },
      noSecure: {
        host: process.env.SMTP_HOST || 'localhost',
        port: Number(process.env.SMTP_PORT || '25'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASS || ''
        }
      },
      rejectUnauthorized: {
        host: process.env.SMTP_HOST || 'localhost',
        port: Number(process.env.SMTP_PORT || '25'),
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASS || ''
        },
        tls: {
          rejectUnauthorized: false
        }
      }
    }

    // Select configuration
    const config = configurations[configType as keyof typeof configurations] || configurations.primary

    // Log the selected configuration (without password)
    console.log('Testing with config:', {
      type: configType,
      host: config.host,
      port: config.port,
      secure: config.secure
    })

    // Create transporter
    const transporter = nodemailer.createTransport(config)

    // Prepare email options
    const mailOptions = {
      from: process.env.SMTP_FROM || `"GymXam" <${config.auth.user}>`,
      to: recipient,
      subject: 'Test Email from Alternate Configuration',
      text: `This is a test email sent using the ${configType} configuration.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #333;">GymXam Test Email</h2>
          <p>This is a test email sent using the <strong>${configType}</strong> configuration.</p>
          <p>Configuration details:</p>
          <ul>
            <li>Host: ${config.host}</li>
            <li>Port: ${config.port}</li>
            <li>Secure: ${config.secure}</li>
          </ul>
          <p>If you're seeing this email, the configuration is working!</p>
          <p style="font-size: 12px; color: #666; margin-top: 30px;">
            Sent at: ${new Date().toISOString()}
          </p>
        </div>
      `
    }

    // Send the email
    const info = await transporter.sendMail(mailOptions)

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      config: configType
    })
  } catch (error) {
    console.error('Error sending test email:', error)
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'An unknown error occurred',
      config: typeof error === 'object' && error && 'config' in error ? error.config : null
    }, { status: 500 })
  }
}