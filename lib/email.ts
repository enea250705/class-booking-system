import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html: string;
}

export async function sendEmail(options: EmailOptions) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('Missing RESEND_API_KEY environment variable');
      return { success: false, error: 'Missing Resend API key' };
    }

    const from = process.env.RESEND_FROM || 'info@auditmylanding.com';

    const { data, error } = await resend.emails.send({
      from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    if (error) {
      console.error('Resend error:', error);
      return { success: false, error: error.message };
    }

    console.log('Email sent successfully:', data?.id);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Failed to send email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown email error',
    };
  }
}
