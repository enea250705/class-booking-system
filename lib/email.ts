// Email service for sending notifications
// Currently a placeholder implementation with logging
// To implement real SMTP, uncomment the nodemailer code and install the package

/*
import nodemailer from 'nodemailer';

// Email configuration from environment variables
const smtpConfig = {
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
};

// Create reusable transporter
const transporter = nodemailer.createTransport(smtpConfig);
*/

type EmailOptions = {
  to: string
  subject: string
  text: string
  html?: string
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Prepare email with sender from environment
    const mailOptions = {
      from: process.env.SMTP_FROM || 'GymXam <info@codewithenea.it>',
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    };

    // Log email details instead of sending
    console.log('==========================================');
    console.log('Email would be sent with the following details:');
    console.log('From:', mailOptions.from);
    console.log('To:', mailOptions.to);
    console.log('Subject:', mailOptions.subject);
    console.log('Text:', mailOptions.text);
    console.log('==========================================');
    
    // In a real implementation, you would uncomment this code:
    /*
    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: %s', info.messageId);
    */
    
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}
