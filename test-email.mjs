import nodemailer from 'nodemailer';

// SMTP configuration
const smtpConfig = {
  host: "authsmtp.securemail.pro",
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: "info@codewithenea.it",
    pass: "Enea2507@"
  }
};

// Log the configuration
console.log('SMTP Configuration:', {
  host: smtpConfig.host,
  port: smtpConfig.port,
  secure: smtpConfig.secure,
  user: smtpConfig.auth.user
});

// Create transporter
const transporter = nodemailer.createTransport(smtpConfig);

// Test connection
async function verifyConnection() {
  try {
    console.log('Verifying SMTP connection...');
    const result = await transporter.verify();
    console.log('SMTP connection verified:', result);
    return true;
  } catch (error) {
    console.error('SMTP connection failed:', error);
    return false;
  }
}

// Send test email
async function sendTestEmail() {
  try {
    console.log('Sending test email...');
    
    const info = await transporter.sendMail({
      from: 'GymXam <info@codewithenea.it>',
      to: 'info@codewithenea.it', // Send to the same email for testing
      subject: 'Test Email from GymXam',
      text: 'This is a test email to verify SMTP functionality.',
      html: '<h1>Test Email</h1><p>This is a test email to verify SMTP functionality.</p>'
    });
    
    console.log('Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

// Run tests
async function runTests() {
  const connectionValid = await verifyConnection();
  
  if (connectionValid) {
    await sendTestEmail();
  } else {
    console.log('Skipping email send test due to connection failure');
  }
}

runTests(); 