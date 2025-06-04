// Email service for sending notifications
// 
// PRODUCTION SETUP INSTRUCTIONS:
// 1. Install nodemailer: npm install nodemailer --save
// 2. Replace the import below with: import nodemailer from 'nodemailer';
//
// The mock implementation works for development without requiring the actual package.

// Using real nodemailer implementation
import nodemailer from 'nodemailer';

// Define a single SMTP configuration from environment variables
const smtpConfig = {
  host: process.env.SMTP_HOST || '',
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true, // Use secure connection for port 465
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
  // Add TLS options to avoid certificate issues
  tls: {
    rejectUnauthorized: false
  }
};

// Log the SMTP configuration (without the password)
console.log('SMTP Config:', {
  host: smtpConfig.host,
  port: smtpConfig.port,
  secure: smtpConfig.secure,
  user: smtpConfig.auth.user,
  environment: process.env.NODE_ENV || 'unknown',
});

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html: string;
}

export async function sendEmail(options: EmailOptions) {
  try {
    // Validate required environment variables
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error('Missing required SMTP environment variables:', {
        host: process.env.SMTP_HOST ? 'set' : 'missing',
        user: process.env.SMTP_USER ? 'set' : 'missing',
        pass: process.env.SMTP_PASS ? 'set' : 'missing',
        port: process.env.SMTP_PORT || 'missing',
      });
      return { success: false, error: 'Missing SMTP configuration' };
    }

    console.log(`Attempting to send email to ${options.to}`, {
      subject: options.subject,
      environment: process.env.NODE_ENV || 'unknown',
    });
    
    // Create transporter with our simplified config
    const transporter = nodemailer.createTransport(smtpConfig);
    
    // Set the from address from env variable
    const mailOptions = {
      from: process.env.SMTP_FROM || `"GymXam" <${smtpConfig.auth.user}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };
    
    console.log('Sending email with SMTP configuration');
    const info = await transporter.sendMail(mailOptions);
    
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send email:', error);
    // Return error instead of throwing to prevent API failures when email sending fails
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown email error' 
    };
  }
}
