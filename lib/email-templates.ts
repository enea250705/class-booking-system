const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://gymxam.vercel.app'

function layout(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>GymXam</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background-color:#111827;border-radius:12px 12px 0 0;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:2px;text-transform:uppercase;">GymXam</h1>
              <p style="margin:6px 0 0;color:#9ca3af;font-size:13px;letter-spacing:1px;text-transform:uppercase;">Fitness &amp; Training</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff;padding:40px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#111827;border-radius:0 0 12px 12px;padding:24px 40px;text-align:center;">
              <p style="margin:0;color:#6b7280;font-size:12px;">© ${new Date().getFullYear()} GymXam. All rights reserved.</p>
              <p style="margin:8px 0 0;color:#6b7280;font-size:12px;">Questions? Reply to this email or contact us at <a href="mailto:info@auditmylanding.com" style="color:#9ca3af;text-decoration:none;">info@auditmylanding.com</a></p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function infoBox(rows: { label: string; value: string }[]): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin:24px 0;">
    ${rows.map((r, i) => `
    <tr>
      <td style="padding:12px 20px;font-size:14px;color:#6b7280;font-weight:600;border-bottom:${i < rows.length - 1 ? '1px solid #e5e7eb' : 'none'};width:40%;">${r.label}</td>
      <td style="padding:12px 20px;font-size:14px;color:#111827;font-weight:500;border-bottom:${i < rows.length - 1 ? '1px solid #e5e7eb' : 'none'};">${r.value}</td>
    </tr>`).join('')}
  </table>`
}

function badge(text: string, color: '#16a34a' | '#dc2626' | '#d97706' | '#2563eb'): string {
  const bg: Record<string, string> = {
    '#16a34a': '#dcfce7', '#dc2626': '#fee2e2', '#d97706': '#fef3c7', '#2563eb': '#dbeafe'
  }
  return `<span style="display:inline-block;background-color:${bg[color]};color:${color};font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px;text-transform:uppercase;letter-spacing:0.5px;">${text}</span>`
}

function heading(text: string): string {
  return `<h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:700;">${text}</h2>`
}

function greeting(name: string | null): string {
  return `<p style="margin:0 0 20px;color:#374151;font-size:15px;">Hi <strong>${name || 'there'}</strong>,</p>`
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">${text}</p>`
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />`
}

function signature(): string {
  return `${divider()}<p style="margin:0;color:#6b7280;font-size:14px;">Best regards,<br/><strong style="color:#111827;">The GymXam Team</strong></p>`
}

// ─── Templates ───────────────────────────────────────────────────────────────

export function bookingConfirmationEmail(data: {
  name: string | null
  className: string
  date: string
  time: string
  classesRemaining: number
}): string {
  return layout(`
    <div style="margin-bottom:24px;">${badge('Booking Confirmed', '#16a34a')}</div>
    ${heading('Your class is booked!')}
    ${greeting(data.name)}
    ${paragraph('Great news — your spot has been reserved. See you on the mat!')}
    ${infoBox([
      { label: 'Class', value: data.className },
      { label: 'Date', value: data.date },
      { label: 'Time', value: data.time },
      { label: 'Credits Remaining', value: `${data.classesRemaining}` },
    ])}
    ${paragraph('You can cancel your booking up to <strong>8 hours</strong> before the class starts.')}
    ${signature()}
  `)
}

export function bookingCancelledEmail(data: {
  name: string | null
  className: string
  date: string
  time: string
}): string {
  return layout(`
    <div style="margin-bottom:24px;">${badge('Booking Cancelled', '#dc2626')}</div>
    ${heading('Your booking has been cancelled')}
    ${greeting(data.name)}
    ${paragraph('Your booking has been successfully cancelled and a class credit has been returned to your account.')}
    ${infoBox([
      { label: 'Class', value: data.className },
      { label: 'Date', value: data.date },
      { label: 'Time', value: data.time },
    ])}
    ${paragraph('We hope to see you at a future class!')}
    ${signature()}
  `)
}

export function classCancelledEmail(data: {
  name: string | null
  className: string
  date: string
}): string {
  return layout(`
    <div style="margin-bottom:24px;">${badge('Class Cancelled', '#dc2626')}</div>
    ${heading('A class has been cancelled')}
    ${greeting(data.name)}
    ${paragraph('We regret to inform you that the following class has been cancelled. Your class credit has been automatically returned to your account.')}
    ${infoBox([
      { label: 'Class', value: data.className },
      { label: 'Date', value: data.date },
    ])}
    ${paragraph('We apologise for the inconvenience. Please check the schedule for other available classes.')}
    ${signature()}
  `)
}

export function packageExpiringEmail(data: {
  name: string | null
  packageName: string
  classesRemaining: number
  daysRemaining: number
  expirationDate: string
}): string {
  return layout(`
    <div style="margin-bottom:24px;">${badge('Action Required', '#d97706')}</div>
    ${heading('Your membership is expiring soon')}
    ${greeting(data.name)}
    ${paragraph(`Your membership package expires in <strong>${data.daysRemaining} day${data.daysRemaining !== 1 ? 's' : ''}</strong>. Renew now to keep your spot in class without interruption.`)}
    ${infoBox([
      { label: 'Package', value: data.packageName },
      { label: 'Credits Remaining', value: `${data.classesRemaining}` },
      { label: 'Days Remaining', value: `${data.daysRemaining}` },
      { label: 'Expires On', value: data.expirationDate },
    ])}
    ${paragraph('Contact us or visit the gym to renew your membership before it expires.')}
    ${signature()}
  `)
}

export function packageAssignedEmail(data: {
  name: string | null
  packageName: string
  totalClasses: number
  validUntil: string
}): string {
  return layout(`
    <div style="margin-bottom:24px;">${badge('New Package', '#2563eb')}</div>
    ${heading('Your membership package is ready')}
    ${greeting(data.name)}
    ${paragraph('A new membership package has been assigned to your account. You can start booking classes right away!')}
    ${infoBox([
      { label: 'Package', value: data.packageName },
      { label: 'Total Classes', value: `${data.totalClasses}` },
      { label: 'Valid Until', value: data.validUntil },
    ])}
    ${paragraph('Log in to your account to browse the class schedule and book your first session.')}
    ${signature()}
  `)
}

export function accountApprovedEmail(data: { name: string | null }): string {
  return layout(`
    <div style="margin-bottom:24px;">${badge('Welcome', '#16a34a')}</div>
    ${heading('Your account has been approved!')}
    ${greeting(data.name)}
    ${paragraph('Welcome to GymXam! Your account is now active and you can start booking fitness classes.')}
    ${paragraph('Log in to your account to browse the schedule and book your first class. We look forward to training with you!')}
    ${signature()}
  `)
}

export function accountDeclinedEmail(data: { name: string | null }): string {
  return layout(`
    ${heading('Registration Update')}
    ${greeting(data.name)}
    ${paragraph('Thank you for your interest in joining GymXam. Unfortunately, we are unable to approve your registration at this time.')}
    ${paragraph('If you have any questions or believe this is a mistake, please don\'t hesitate to contact us directly.')}
    ${signature()}
  `)
}
