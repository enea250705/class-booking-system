// This is a mock implementation of nodemailer for development
// Replace this with the actual nodemailer package in production

interface TransportOptions {
  host?: string;
  port?: number;
  secure?: boolean;
  auth?: {
    user?: string;
    pass?: string;
  };
  tls?: {
    rejectUnauthorized?: boolean;
  };
}

interface MailOptions {
  from?: string;
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}

interface SendMailResult {
  messageId: string;
  accepted: string[];
  rejected: string[];
  response: string;
}

class Transporter {
  options: TransportOptions;

  constructor(options: TransportOptions) {
    this.options = options;
    console.log("Mock Transporter created with options:", {
      host: options.host,
      port: options.port,
      secure: options.secure,
      auth: options.auth ? { user: options.auth.user, pass: "****" } : undefined,
      tls: options.tls
    });
  }

  async sendMail(mailOptions: MailOptions): Promise<SendMailResult> {
    console.log("MOCK EMAIL SENT:", {
      to: mailOptions.to,
      from: mailOptions.from || process.env.SMTP_FROM,
      subject: mailOptions.subject,
      text: mailOptions.text?.substring(0, 100) + (mailOptions.text && mailOptions.text.length > 100 ? "..." : ""),
      html: mailOptions.html ? "[HTML content]" : undefined
    });

    return {
      messageId: `mock-${Date.now()}-${Math.random().toString(36).substring(2, 15)}@localhost`,
      accepted: Array.isArray(mailOptions.to) ? mailOptions.to : [mailOptions.to],
      rejected: [],
      response: "250 Message accepted"
    };
  }

  verify(): Promise<boolean> {
    return Promise.resolve(true);
  }
}

export default {
  createTransport: (options: TransportOptions): Transporter => {
    return new Transporter(options);
  }
}; 